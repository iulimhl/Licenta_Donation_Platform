from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.recommendation import NeedRecommendationsResponse
from services import recommendations_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/needs/{need_id}", response_model=NeedRecommendationsResponse)
def get_need_recommendations(
    need_id: int,
    limit: int = 3,
    min_score: float = 58,
    db: Session = Depends(get_db),
):
    result = recommendations_service.get_need_recommendations(
        db=db,
        need_id=need_id,
        limit=limit,
        min_score=min_score,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Need list not found")

    return result
