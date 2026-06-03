from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user
from app import storage

router = APIRouter(prefix="/books", tags=["audio"])

SAMPLE_CHAPTER_IDX = 0


def _ownership_check(book_id: str, user: models.User, db: Session):
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


def _require_ownership_for_non_sample(book_id: str, chapter: models.Chapter, user: models.User, db: Session):
    """Skip ownership check for the sample chapter (idx 0); enforce it for all others."""
    if chapter.idx != SAMPLE_CHAPTER_IDX:
        _ownership_check(book_id, user, db)


def _get_chapter(book_id: str, chapter_id: int, db: Session) -> models.Chapter:
    chapter = (
        db.query(models.Chapter)
        .filter(models.Chapter.id == chapter_id, models.Chapter.book_id == book_id)
        .first()
    )
    if not chapter or not chapter.audio_key:
        raise HTTPException(status_code=404, detail="Audio not available for this chapter")
    return chapter


@router.get("/{book_id}/chapters/{chapter_id}/audio", response_model=schemas.ChapterAudioResponse)
def get_chapter_audio(
    book_id: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _ownership_check(book_id, user, db)

    chapter = (
        db.query(models.Chapter)
        .filter(models.Chapter.id == chapter_id, models.Chapter.book_id == book_id)
        .first()
    )
    if not chapter or not chapter.audio_key:
        raise HTTPException(status_code=404, detail="Audio not available for this chapter")

    url = storage.presign_chapter(chapter.audio_key)
    return {"url": url, "expires_in": 3600}


@router.get("/{book_id}/chapters/{chapter_id}/hls")
def get_chapter_hls(
    book_id: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Return the raw HLS playlist. Segment paths are relative filenames — the frontend
    rewrites them to absolute backend proxy URLs before passing to hls.js.
    Chapter 0 (sample) is served without ownership check; all others require ownership."""
    chapter = _get_chapter(book_id, chapter_id, db)
    _require_ownership_for_non_sample(book_id, chapter, user, db)
    if not chapter.audio_key.endswith(".m3u8"):
        raise HTTPException(status_code=404, detail="HLS not available for this chapter")
    try:
        raw = storage.get_hls_playlist_content(chapter.audio_key)
    except Exception:
        raise HTTPException(status_code=404, detail="HLS playlist not found in storage")
    return Response(content=raw, media_type="application/vnd.apple.mpegurl")


@router.get("/{book_id}/chapters/{chapter_id}/hls/{seg_filename}")
def get_hls_segment(
    book_id: str,
    chapter_id: int,
    seg_filename: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Proxy a .ts segment from MinIO — avoids any MinIO CORS configuration.
    Chapter 0 (sample) is served without ownership check; all others require ownership."""
    chapter = _get_chapter(book_id, chapter_id, db)
    _require_ownership_for_non_sample(book_id, chapter, user, db)
    seg_key = storage.hls_segment_key(book_id, chapter.idx, seg_filename)
    try:
        stream = storage.get_segment_stream(seg_key)
    except Exception:
        raise HTTPException(status_code=404, detail="Segment not found")
    return StreamingResponse(stream, media_type="video/mp2t")
