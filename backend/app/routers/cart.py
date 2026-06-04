from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=schemas.CartResponse)
def get_cart(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    items = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == user.id)
        .options(joinedload(models.CartItem.book))
        .all()
    )
    total = round(sum(i.book.price for i in items), 2)
    return {"items": items, "total": total}


# More specific route must come before /{book_id} to avoid route shadowing.
@router.post("/from-wishlist/{book_id}", status_code=200)
def move_from_wishlist(book_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Atomically add to cart and remove from wishlist in one transaction."""
    db.execute(
        pg_insert(models.CartItem)
        .values(user_id=user.id, book_id=book_id)
        .on_conflict_do_nothing(index_elements=["user_id", "book_id"])
    )
    db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user.id,
        models.WishlistItem.book_id == book_id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "Moved to cart"}


@router.post("/{book_id}", status_code=201)
def add_to_cart(book_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not db.query(models.Book.id).filter(models.Book.id == book_id).first():
        raise HTTPException(status_code=404, detail="Book not found")
    db.execute(
        pg_insert(models.CartItem)
        .values(user_id=user.id, book_id=book_id)
        .on_conflict_do_nothing(index_elements=["user_id", "book_id"])
    )
    db.commit()
    return {"message": "Added to cart"}


@router.delete("/{book_id}")
def remove_from_cart(book_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db.query(models.CartItem).filter(
        models.CartItem.user_id == user.id,
        models.CartItem.book_id == book_id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "Removed from cart"}
