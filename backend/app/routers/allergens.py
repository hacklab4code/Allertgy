from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Allergen
from ..schemas import AllergenOut

router = APIRouter(prefix="/allergens", tags=["allergens"])


@router.get("", response_model=list[AllergenOut])
def list_allergens(db: Session = Depends(get_db)):
    return db.scalars(select(Allergen).order_by(Allergen.sort_order)).all()
