import asyncio
from typing import List

from .queue import WorkerQueue
from .poller import LiveScorePoller
from .providers.mock import MockLiveScoreProvider
from .storage import InMemoryStore


def log_update():
    import datetime as _dt

    def _inner(st):
        ts = _dt.datetime.now().strftime("%H:%M:%S")
        print(
            f"[{ts}] {st.match_id} {st.home} {st.home_score}-{st.away_score} {st.away} | {st.status} {st.minute}'"
        )

    return _inner


async def main(matches: List[str]) -> None:
    provider = MockLiveScoreProvider(tick_seconds=0.05)
    store = InMemoryStore()
    poller = LiveScorePoller(provider=provider, store=store, on_update=log_update())
    queue = WorkerQueue(concurrency=4)
    queue.start()

    async def make_poll_job(mid: str):
        async def _job():
            st = await poller.poll_once(mid)
            delay = LiveScorePoller.next_poll_delay(st)
            if delay < 0:
                return  # Finished, do not re-enqueue
            # Re-enqueue next poll for this match; key prevents overlap
            queue.enqueue(fn=_job, key=f"poll:{mid}", delay=delay, priority=1)

        return _job

    # Seed jobs
    for mid in matches:
        job = await make_poll_job(mid)
        queue.enqueue(fn=job, key=f"poll:{mid}", delay=0.0, priority=1)

    # Run until all matches finish
    try:
        while True:
            await asyncio.sleep(0.5)
            done = [m for m in matches if store.is_finished(m)]
            if len(done) == len(matches):
                break
    finally:
        queue.stop()
        await queue.wait_stopped()


if __name__ == "__main__":
    # Example matches
    example_matches = ["M-1001", "M-1002", "M-1003"]
    asyncio.run(main(example_matches))

