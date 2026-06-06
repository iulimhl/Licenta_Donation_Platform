from sqlalchemy.orm import Session
from models.donation import DonationModel
from models.need import NeedModel


def get_need_items(need: NeedModel):
    if need.items and isinstance(need.items, list):
        return need.items
    return []


def is_need_completed(need: NeedModel) -> bool:
    items = get_need_items(need)

    if not items:
        return False

    for item in items:
        quantity = item.get("quantity", 0)
        brought = item.get("brought", 0)

        if brought < quantity:
            return False

    return True


def get_home_stats(db: Session):
    donations = db.query(DonationModel).all()
    needs = db.query(NeedModel).all()

    available_items = sum(
        1 for donation in donations if donation.status == "available"
    )

    need_lists = len(needs)

    completed_single_donations = sum(
        1 for donation in donations if donation.status == "inactive"
    )

    completed_need_lists = sum(
        1 for need in needs if is_need_completed(need)
    )

    return {
        "available_items": available_items,
        "need_lists": need_lists,
        "completed_donations": completed_single_donations + completed_need_lists,
    }