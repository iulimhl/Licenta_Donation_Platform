from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.donation import DonationModel
from models.need import NeedModel
from models.user import User  # Importăm modelul de User pentru a citi numele reale

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/feed")
def get_mixed_feed(db: Session = Depends(get_db)):
    try:
        donations = db.query(DonationModel).all()
        needs = db.query(NeedModel).all()

        combined_results = []

        for d in donations:
            user_profile = db.query(User).filter(User.email == d.owner_email).first()
            calculated_name = None
            if user_profile:
                if user_profile.user_type in ["organization", "post_organization"]:
                    calculated_name = user_profile.organization_name
                else:
                    calculated_name = user_profile.full_name

            if not calculated_name:
                calculated_name = d.owner_email

            combined_results.append({
                "id": d.id,
                "title": d.title,
                "description": d.description,
                "location": d.location,
                "category": d.category,
                "owner_email": d.owner_email,
                "donor_name": calculated_name,
                "image": d.image,
                "status": getattr(d, 'status', 'available'),
                "item_type": "donation"
            })

        for n in needs:
            org_profile = db.query(User).filter(User.email == n.organization_email).first()

            calculated_org_name = None
            if org_profile:
                calculated_org_name = org_profile.organization_name or org_profile.full_name

            if not calculated_org_name:
                calculated_org_name = n.organization_email

            items_list = []
            raw_items = getattr(n, 'items', [])
            if raw_items:
                for item in raw_items:
                    if isinstance(item, dict):
                        items_list.append(item)
                    else:
                        items_list.append({
                            "name": getattr(item, 'name', ''),
                            "quantity": getattr(item, 'quantity', 0),
                            "brought": getattr(item, 'brought', 0)
                        })

            combined_results.append({
                "id": n.id,
                "title": n.title,
                "description": n.description,
                "location": n.location,
                "organization_email": n.organization_email,
                "organization_name": calculated_org_name,
                "image": n.image,
                "items": items_list,
                "item_type": "need"
            })

        combined_results.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        return combined_results
    except Exception as e:
        print(f"SERVER ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))