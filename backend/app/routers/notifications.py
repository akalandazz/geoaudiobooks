from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.deps import get_db, get_current_user
from app import notifications_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def get_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return notifications_service.list_for_user(db, user, limit=min(limit, 100))


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return {"count": notifications_service.unread_count(db, user)}


@router.post("/{notification_id}/read", status_code=200)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ok = notifications_service.mark_read(db, user, notification_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}


@router.post("/read-all", status_code=200)
def mark_all_read(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    notifications_service.mark_all_read(db, user)
    return {"status": "ok"}
