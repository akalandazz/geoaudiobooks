from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/checkout", response_model=schemas.OrderOut, status_code=201)
def checkout(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Find books not yet owned
    owned_ids = {
        row.book_id
        for row in db.query(models.OrderItem.book_id)
        .join(models.Order)
        .filter(models.Order.user_id == user.id, models.Order.status == "completed")
        .all()
    }
    new_items = [ci for ci in cart_items if ci.book_id not in owned_ids]
    if not new_items:
        raise HTTPException(status_code=400, detail="All cart items already purchased")

    total = sum(item.book.price for item in new_items)
    order = models.Order(user_id=user.id, total=round(total, 2), status="completed")
    db.add(order)
    db.flush()

    for ci in new_items:
        db.add(models.OrderItem(order_id=order.id, book_id=ci.book_id, price_at_purchase=ci.book.price))

    # Clear cart
    for ci in cart_items:
        db.delete(ci)

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Order).filter(models.Order.user_id == user.id).order_by(models.Order.created_at.desc()).all()
