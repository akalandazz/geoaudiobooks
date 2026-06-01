from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=schemas.CartResponse)
def get_cart(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    items = db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()
    total = sum(item.book.price for item in items)
    return {"items": items, "total": round(total, 2)}


@router.post("/{book_id}", status_code=201)
def add_to_cart(book_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not db.query(models.Book).filter(models.Book.id == book_id).first():
        raise HTTPException(status_code=404, detail="Book not found")
    item = models.CartItem(user_id=user.id, book_id=book_id)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Added to cart"}


@router.delete("/{book_id}")
def remove_from_cart(book_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user.id,
        models.CartItem.book_id == book_id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Removed from cart"}
