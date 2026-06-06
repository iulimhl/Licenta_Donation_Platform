from pydantic import BaseModel

class HomeStatsResponse(BaseModel):
    available_items: int
    need_lists: int
    completed_donations: int