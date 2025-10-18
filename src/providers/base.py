from typing import Protocol, TypedDict, Optional


class LiveScore(TypedDict):
    match_id: str
    home: str
    away: str
    home_score: int
    away_score: int
    status: str  # NOT_STARTED | LIVE | HT | FT
    minute: int


class LiveScoreProvider(Protocol):
    async def get_live_score(self, match_id: str) -> Optional[LiveScore]:
        ...

