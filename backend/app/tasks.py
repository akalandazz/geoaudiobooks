from app.celery_app import celery
from app.database import SessionLocal
from app import notifications_service


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
