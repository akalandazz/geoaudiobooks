from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[schemas.BookOut])
def get_wishlist(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    items = db.query(models.WishlistItem).filter(models.WishlistItem.user_id == user.id).all()
    return [item.book for item in items]


@router.post("/{book_id}", status_code=201)
def add_to_wishlist(book_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not db.query(models.Book).filter(models.Book.id == book_id).first():
        raise HTTPException(status_code=404, detail="Book not found")
    item = models.WishlistItem(user_id=user.id, book_id=book_id)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Added to wishlist"}


@router.delete("/{book_id}")
def remove_from_wishlist(book_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user.id,
        models.WishlistItem.book_id == book_id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Removed from wishlist"}
