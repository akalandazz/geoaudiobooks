from datetime import datetime, timedelta
from app.celery_app import celery
from app.database import SessionLocal
from app import models, notifications_service


@celery.task(name="app.tasks.process_event", bind=True, max_retries=3, default_retry_delay=10)
def process_event(self, event_type: str, payload: dict):
    db = SessionLocal()
    try:
        if event_type == "book_released":
            notifications_service.broadcast(
                db,
                type="book_release",
                title="New audiobook released",
                body=f"{payload['title']} by {payload['author']} is now available.",
                book_id=payload.get("book_id"),
            )
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery.task(name="app.tasks.purge_old_idempotency_keys")
def purge_old_idempotency_keys():
    """Delete idempotency keys older than 48 hours; retries only matter within that window."""
    cutoff = datetime.utcnow() - timedelta(hours=48)
    db = SessionLocal()
    try:
        deleted = (
            db.query(models.IdempotencyKey)
            .filter(models.IdempotencyKey.created_at < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        return {"deleted": deleted}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
