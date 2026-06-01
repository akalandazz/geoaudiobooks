from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=list[schemas.ProgressOut])
def get_all_progress(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Progress).filter(models.Progress.user_id == user.id).all()


@router.put("/{book_id}", response_model=schemas.ProgressOut)
def update_progress(
    book_id: str,
    body: schemas.ProgressUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not db.query(models.Book).filter(models.Book.id == book_id).first():
        raise HTTPException(status_code=404, detail="Book not found")

    record = db.query(models.Progress).filter(
        models.Progress.user_id == user.id,
        models.Progress.book_id == book_id,
    ).first()

    if record:
        record.chapter_idx = body.chapter_idx
        record.position_secs = body.position_secs
        record.updated_at = datetime.utcnow()
    else:
        record = models.Progress(
            user_id=user.id,
            book_id=book_id,
            chapter_idx=body.chapter_idx,
            position_secs=body.position_secs,
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record
