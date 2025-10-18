import asyncio
import heapq
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, Optional, Set, Tuple


JobFn = Callable[[], Awaitable[None]]


@dataclass(order=True)
class _ScheduledJob:
    run_at: float
    priority: int
    seq: int = field(compare=True)
    key: Optional[str] = field(compare=False, default=None)
    fn: JobFn = field(compare=False, default=lambda: asyncio.sleep(0))
    attempt: int = field(compare=False, default=0)
    max_retries: int = field(compare=False, default=3)
    backoff_base: float = field(compare=False, default=1.5)
    backoff_min: float = field(compare=False, default=1.0)
    backoff_max: float = field(compare=False, default=60.0)
    jitter: float = field(compare=False, default=0.15)


class WorkerQueue:
    """A minimal async worker queue with:
    - Concurrency control via semaphore
    - Delayed scheduling (run_at)
    - Priority (higher value runs first when due)
    - De-dup by job key across pending+inflight
    - Retries with exponential backoff and jitter
    """

    def __init__(
        self,
        *,
        concurrency: int = 4,
        poll_interval: float = 0.1,
    ) -> None:
        self._heap: list[_ScheduledJob] = []
        self._seq: int = 0
        self._pending_keys: Dict[str, int] = {}
        self._inflight_keys: Set[str] = set()
        self._sema = asyncio.Semaphore(concurrency)
        self._poll_interval = poll_interval
        self._stop = asyncio.Event()
        self._dispatcher_task: Optional[asyncio.Task] = None

    def stop(self) -> None:
        self._stop.set()

    async def wait_stopped(self) -> None:
        if self._dispatcher_task:
            await self._dispatcher_task

    def start(self) -> None:
        if self._dispatcher_task is None:
            self._dispatcher_task = asyncio.create_task(self._dispatcher_loop())

    def size(self) -> Tuple[int, int]:
        return len(self._heap), len(self._inflight_keys)

    def enqueue(
        self,
        *,
        fn: JobFn,
        key: Optional[str] = None,
        delay: float = 0.0,
        priority: int = 0,
        max_retries: int = 3,
        backoff_base: float = 1.6,
        backoff_min: float = 0.5,
        backoff_max: float = 60.0,
        jitter: float = 0.15,
        coalesce: bool = True,
    ) -> bool:
        """Queue a job.

        Returns True if enqueued, False if dropped due to key coalescing.
        """
        now = time.monotonic()
        run_at = now + max(0.0, delay)

        if key and coalesce:
            # Drop if an identical key is already pending or inflight.
            if key in self._pending_keys or key in self._inflight_keys:
                return False

        self._seq += 1
        job = _ScheduledJob(
            run_at=run_at,
            priority=-priority,  # heapq is min-heap; invert for max-priority
            seq=self._seq,
            key=key,
            fn=fn,
            attempt=0,
            max_retries=max_retries,
            backoff_base=backoff_base,
            backoff_min=backoff_min,
            backoff_max=backoff_max,
            jitter=jitter,
        )
        heapq.heappush(self._heap, job)
        if key:
            self._pending_keys[key] = self._pending_keys.get(key, 0) + 1
        return True

    async def _dispatcher_loop(self) -> None:
        try:
            while not self._stop.is_set():
                now = time.monotonic()
                did_dispatch = False
                while self._heap and self._heap[0].run_at <= now:
                    job = heapq.heappop(self._heap)
                    if job.key:
                        count = self._pending_keys.get(job.key, 0)
                        if count <= 1:
                            self._pending_keys.pop(job.key, None)
                        else:
                            self._pending_keys[job.key] = count - 1

                        # If somehow duplicated with inflight, skip.
                        if job.key in self._inflight_keys:
                            continue
                        self._inflight_keys.add(job.key)

                    await self._sema.acquire()
                    did_dispatch = True
                    asyncio.create_task(self._run_job(job))

                if not did_dispatch:
                    await asyncio.sleep(self._poll_interval)
        finally:
            # Wait for inflight to drain
            while self._inflight_keys:
                await asyncio.sleep(0.05)

    async def _run_job(self, job: _ScheduledJob) -> None:
        try:
            try:
                await job.fn()
            except Exception:
                # Retry with exponential backoff and jitter
                if job.attempt < job.max_retries:
                    job.attempt += 1
                    delay = self._compute_backoff(job)
                    job.run_at = time.monotonic() + delay
                    heapq.heappush(self._heap, job)
                    if job.key:
                        self._pending_keys[job.key] = self._pending_keys.get(job.key, 0) + 1
                else:
                    # Exhausted retries; drop
                    pass
        finally:
            if job.key and job.key in self._inflight_keys:
                self._inflight_keys.remove(job.key)
            self._sema.release()

    def _compute_backoff(self, job: _ScheduledJob) -> float:
        base = max(job.backoff_min, min(job.backoff_max, job.backoff_min * (job.backoff_base ** job.attempt)))
        # Apply jitter in +/- range
        jitter = job.jitter
        low = base * (1.0 - jitter)
        high = base * (1.0 + jitter)
        # Deterministic jitter using seq/attempt to avoid importing random
        key = (job.seq + job.attempt * 101) % 1000
        frac = (key % 1000) / 1000.0
        return low + (high - low) * frac

