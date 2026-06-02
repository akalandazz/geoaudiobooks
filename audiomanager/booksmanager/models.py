from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from booksmanager.db import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    narrator = Column(String, nullable=False, default="")
    genre = Column(String, nullable=False, default="")
    duration_secs = Column(Integer, nullable=False, default=0)
    rating_avg = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    price = Column(Float, nullable=False, default=0.0)
    year = Column(Integer, default=0)
    tags = Column(JSONB, default=list)
    blurb = Column(Text, default="")
    palette = Column(JSONB, default=list)
    motif = Column(String, default="lines")

    chapters = relationship(
        "Chapter", back_populates="book", order_by="Chapter.idx", cascade="all, delete-orphan"
    )


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(String, ForeignKey("books.id"), nullable=False)
    idx = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    length_secs = Column(Integer, nullable=False)
    start_secs = Column(Integer, nullable=False)
    audio_key = Column(String, nullable=True)

    book = relationship("Book", back_populates="chapters")
