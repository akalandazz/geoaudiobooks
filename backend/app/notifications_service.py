from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app import models


def broadcast(db: Session, *, type: str, title: str, body: str = "", book_id: str | None = None) -> models.Notification:
    notif = models.Notification(
        audience="all",
        user_id=None,
        type=type,
        title=title,
        body=body,
        book_id=book_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_user(
    db: Session,
    user_id: str,
    *,
    type: str,
    title: str,
    body: str = "",
    book_id: str | None = None,
) -> models.Notification:
    notif = models.Notification(
        audience="user",
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        book_id=book_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def _visible_filter(user: models.User):
    """SQLAlchemy filter expression for notifications visible to a user."""
    return or_(
        and_(
            models.Notification.audience == "all",
            models.Notification.created_at >= user.created_at,
        ),
        and_(
            models.Notification.audience == "user",
            models.Notification.user_id == user.id,
        ),
    )


def list_for_user(db: Session, user: models.User, *, limit: int = 50) -> list[dict]:
    rows = (
        db.query(models.Notification, models.NotificationRead)
        .outerjoin(
            models.NotificationRead,
            and_(
                models.NotificationRead.notification_id == models.Notification.id,
                models.NotificationRead.user_id == user.id,
            ),
        )
        .filter(_visible_filter(user))
        .order_by(models.Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for notif, read in rows:
        result.append({
            "id": notif.id,
            "type": notif.type,
            "title": notif.title,
            "body": notif.body,
            "book_id": notif.book_id,
            "is_read": read is not None,
            "created_at": notif.created_at,
        })
    return result


def unread_count(db: Session, user: models.User) -> int:
    read_ids = db.query(models.NotificationRead.notification_id).filter(
        models.NotificationRead.user_id == user.id
    ).subquery()
    return (
        db.query(models.Notification)
        .filter(_visible_filter(user))
        .filter(models.Notification.id.notin_(read_ids))
        .count()
    )


def mark_read(db: Session, user: models.User, notification_id: str) -> bool:
    """Returns False if notification not visible to user."""
    notif = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id)
        .filter(_visible_filter(user))
        .first()
    )
    if not notif:
        return False
    existing = db.query(models.NotificationRead).filter_by(
        user_id=user.id, notification_id=notification_id
    ).first()
    if not existing:
        db.add(models.NotificationRead(user_id=user.id, notification_id=notification_id))
        db.commit()
    return True


def mark_all_read(db: Session, user: models.User) -> None:
    already_read = db.query(models.NotificationRead.notification_id).filter(
        models.NotificationRead.user_id == user.id
    ).subquery()
    unread = (
        db.query(models.Notification.id)
        .filter(_visible_filter(user))
        .filter(models.Notification.id.notin_(already_read))
        .all()
    )
    for (notif_id,) in unread:
        db.add(models.NotificationRead(user_id=user.id, notification_id=notif_id))
    db.commit()
