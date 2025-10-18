from __future__ import annotations

from typing import Callable, Optional

from .providers.base import LiveScoreProvider
from .storage import InMemoryStore, MatchState


class LiveScorePoller:
    """Polls live scores and persists state.

    Decides when to poll next based on match status.
    """

    def __init__(
        self,
        *,
        provider: LiveScoreProvider,
        store: InMemoryStore,
        on_update: Optional[Callable[[MatchState], None]] = None,
    ) -> None:
        self._provider = provider
        self._store = store
        self._on_update = on_update

    async def poll_once(self, match_id: str) -> MatchState:
        data = await self._provider.get_live_score(match_id)
        if not data:
            # If no data, retain last (if any). Could trigger retry upstream.
            current = self._store.get(match_id)
            if not current:
                raise RuntimeError(f"No data for match {match_id}")
            return current

        st = self._store.upsert(
            match_id=data["match_id"],
            home=data["home"],
            away=data["away"],
            home_score=data["home_score"],
            away_score=data["away_score"],
            status=data["status"],
            minute=data["minute"],
        )

        if self._on_update:
            try:
                self._on_update(st)
            except Exception:
                # Non-fatal; don't block polling
                pass
        return st

    @staticmethod
    def next_poll_delay(state: MatchState) -> float:
        """Dynamic poll schedule based on status and minute.

        - NOT_STARTED: slow poll every 15s
        - LIVE: fast poll 2s (1s near end-game)
        - HT: slower poll 10s
        - FT: no further polls
        """
        if state.status == "FT":
            return -1.0
        if state.status == "NOT_STARTED":
            return 15.0
        if state.status == "HT":
            return 10.0
        # LIVE
        if state.minute >= 85:
            return 1.0
        return 2.0

