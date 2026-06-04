from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/checkout", response_model=schemas.OrderOut, status_code=201)
def checkout(
    idempotency_key: str = Header(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    # Atomically claim the key; rowcount=0 means it already exists (retry).
    result = db.execute(
        pg_insert(models.IdempotencyKey)
        .values(key=idempotency_key, user_id=user.id, endpoint="checkout")
        .on_conflict_do_nothing(index_elements=["key"])
    )

    if result.rowcount == 0:
        rec = db.query(models.IdempotencyKey).filter_by(key=idempotency_key).first()
        if rec is None or rec.user_id != user.id:
            raise HTTPException(status_code=409, detail="Idempotency key conflict")
        if rec.order_id is None:
            raise HTTPException(status_code=409, detail="Original request still in progress")
        return db.query(models.Order).filter(models.Order.id == rec.order_id).first()

    # First request — do the real work.
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

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

    # Attach result to the idempotency key so retries replay it.
    rec = db.query(models.IdempotencyKey).filter_by(key=idempotency_key).first()
    rec.order_id = order.id

    # Scoped clear: only delete the rows that were read; concurrent adds survive.
    cart_ids = [ci.id for ci in cart_items]
    db.query(models.CartItem).filter(models.CartItem.id.in_(cart_ids)).delete(synchronize_session=False)

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
