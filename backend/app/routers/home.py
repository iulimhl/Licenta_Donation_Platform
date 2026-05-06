from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.donation import DonationModel
from models.need import NeedModel

router = APIRouter(prefix="/home", tags=["home"])

@router.get("/feed")
def get_mixed_feed(db: Session = Depends(get_db)):
    try:
        donations = db.query(DonationModel).all()
        needs = db.query(NeedModel).all()

        combined_results = []

        for d in donations:
            combined_results.append({
                "id": d.id,
                "title": d.title,
                "description": d.description,
                "location": d.location,
                "category": d.category,
                "owner_email": getattr(d, 'owner_email', None), # Folosim getattr pentru siguranță
                "image": d.image,
                "item_type": "donation"
            })

        for n in needs:
            combined_results.append({
                "id": n.id,
                "title": n.title,
                "description": n.description,
                "location": n.location,
                "organization_email": getattr(n, 'organization_email', None),
                "image": n.image,
                "item_type": "need"
            })

        return combined_results
    except Exception as e:
        print(f"EROARE SERVER: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))