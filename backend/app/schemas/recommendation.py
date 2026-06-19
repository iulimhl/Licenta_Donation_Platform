from pydantic import BaseModel


class DonationRecommendation(BaseModel):
    donation_id: int
    title: str
    category: str | None = None
    location: str | None = None
    image: str | None = None
    owner_email: str | None = None
    donor_name: str | None = None
    semantic_score: float
    match_score: float


class NeedItemRecommendation(BaseModel):
    need_id: int
    item_index: int
    item_name: str
    needed_quantity: int
    brought_quantity: int
    remaining_quantity: int
    matches: list[DonationRecommendation]


class NeedRecommendationsResponse(BaseModel):
    need_id: int
    model_available: bool
    recommendations: list[NeedItemRecommendation]


class NeedListRecommendation(BaseModel):
    need_id: int
    title: str
    location: str | None = None
    organization_email: str | None = None
    organization_name: str | None = None
    item_index: int
    item_name: str
    needed_quantity: int
    brought_quantity: int
    remaining_quantity: int
    semantic_score: float
    match_score: float


class DonationRecommendationsResponse(BaseModel):
    donation_id: int
    model_available: bool
    recommendations: list[NeedListRecommendation]
