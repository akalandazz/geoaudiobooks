from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=list[schemas.BookmarkOut])
def get_bookmarks(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Bookmark).filter(models.Bookmark.user_id == user.id).order_by(models.Bookmark.created_at.desc()).all()


@router.post("", response_model=schemas.BookmarkOut, status_code=201)
def create_bookmark(
    body: schemas.BookmarkCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not db.query(models.Book).filter(models.Book.id == body.book_id).first():
        raise HTTPException(status_code=404, detail="Book not found")
    bookmark = models.Bookmark(
        user_id=user.id,
        book_id=body.book_id,
        chapter_idx=body.chapter_idx,
        position_secs=body.position_secs,
        note=body.note,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}")
def delete_bookmark(bookmark_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    bookmark = db.query(models.Bookmark).filter(
        models.Bookmark.id == bookmark_id,
        models.Bookmark.user_id == user.id,
    ).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
    return {"message": "Deleted"}
