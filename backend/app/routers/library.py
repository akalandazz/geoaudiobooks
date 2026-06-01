from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/library", tags=["library"])


@router.get("", response_model=list[schemas.BookOut])
def get_library(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.Book)
        .join(models.OrderItem, models.OrderItem.book_id == models.Book.id)
        .join(models.Order, models.Order.id == models.OrderItem.order_id)
        .filter(models.Order.user_id == user.id, models.Order.status == "completed")
        .distinct()
        .all()
    )
    return rows
