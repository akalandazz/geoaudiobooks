from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=schemas.BookListResponse)
def list_books(
    q: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    sort: Optional[str] = Query(None, pattern="^(rating|price_asc|price_desc|newest)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Book)

    if q:
        like = f"%{q}%"
        query = query.filter(
            models.Book.title.ilike(like)
            | models.Book.author.ilike(like)
            | models.Book.narrator.ilike(like)
        )
    if genre:
        query = query.filter(models.Book.genre == genre)
    if min_price is not None:
        query = query.filter(models.Book.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Book.price <= max_price)
    if min_rating is not None:
        query = query.filter(models.Book.rating_avg >= min_rating)

    if sort == "rating":
        query = query.order_by(models.Book.rating_avg.desc())
    elif sort == "price_asc":
        query = query.order_by(models.Book.price.asc())
    elif sort == "price_desc":
        query = query.order_by(models.Book.price.desc())
    elif sort == "newest":
        query = query.order_by(models.Book.year.desc())

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.get("/{book_id}/chapters", response_model=list[schemas.ChapterOut])
def get_chapters(book_id: str, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book.chapters
