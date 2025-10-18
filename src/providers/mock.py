import asyncio
from typing import Dict, Optional

from .base import LiveScore, LiveScoreProvider


class MockLiveScoreProvider(LiveScoreProvider):
    """A deterministic mock that evolves score over time.

    - Each match advances a minute every tick.
    - Every 7 minutes, home scores; every 11 minutes, away scores.
    - Status progresses: NOT_STARTED -> LIVE -> HT (45) -> LIVE -> FT (90)
    """

    def __init__(self, *, tick_seconds: float = 0.2) -> None:
        self._tick_seconds = tick_seconds
        self._state: Dict[str, LiveScore] = {}

    async def get_live_score(self, match_id: str) -> Optional[LiveScore]:
        await asyncio.sleep(self._tick_seconds)  # Simulate I/O latency

        st = self._state.get(match_id)
        if not st:
            st = LiveScore(
                match_id=match_id,
                home=f"HOME-{match_id}",
                away=f"AWAY-{match_id}",
                home_score=0,
                away_score=0,
                status="NOT_STARTED",
                minute=0,
            )
            self._state[match_id] = st

        if st["status"] == "FT":
            return st

        # Advance time
        st["minute"] += 1
        if st["status"] == "NOT_STARTED":
            st["status"] = "LIVE"

        m = st["minute"]
        # Score evolution rules
        if st["status"] in ("LIVE", "HT"):
            if m <= 45 and m % 7 == 0:
                st["home_score"] += 1
            if m <= 90 and m % 11 == 0:
                st["away_score"] += 1

        # Status changes
        if m == 45:
            st["status"] = "HT"
        elif m == 46:
            st["status"] = "LIVE"
        elif m >= 90:
            st["status"] = "FT"

        return st

