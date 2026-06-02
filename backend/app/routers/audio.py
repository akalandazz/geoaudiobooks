from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user
from app.storage import presign_chapter

router = APIRouter(prefix="/books", tags=["audio"])


@router.get("/{book_id}/chapters/{chapter_id}/audio", response_model=schemas.ChapterAudioResponse)
def get_chapter_audio(
    book_id: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    owned = (
        db.query(models.OrderItem)
        .join(models.Order, models.Order.id == models.OrderItem.order_id)
        .filter(
            models.Order.user_id == user.id,
            models.Order.status == "completed",
            models.OrderItem.book_id == book_id,
        )
        .first()
    )
    if not owned:
        raise HTTPException(status_code=403, detail="Book not in library")

    chapter = (
        db.query(models.Chapter)
        .filter(models.Chapter.id == chapter_id, models.Chapter.book_id == book_id)
        .first()
    )
    if not chapter or not chapter.audio_key:
        raise HTTPException(status_code=404, detail="Audio not available for this chapter")

    url = presign_chapter(chapter.audio_key)
    return {"url": url, "expires_in": 3600}
