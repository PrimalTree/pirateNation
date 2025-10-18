from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class MatchState:
    match_id: str
    home: str
    away: str
    home_score: int
    away_score: int
    status: str
    minute: int


class InMemoryStore:
    def __init__(self) -> None:
        self._by_id: Dict[str, MatchState] = {}

    def get(self, match_id: str) -> Optional[MatchState]:
        return self._by_id.get(match_id)

    def upsert(
        self,
        *,
        match_id: str,
        home: str,
        away: str,
        home_score: int,
        away_score: int,
        status: str,
        minute: int,
    ) -> MatchState:
        st = MatchState(
            match_id=match_id,
            home=home,
            away=away,
            home_score=home_score,
            away_score=away_score,
            status=status,
            minute=minute,
        )
        self._by_id[match_id] = st
        return st

    def is_finished(self, match_id: str) -> bool:
        st = self._by_id.get(match_id)
        return bool(st and st.status == "FT")

