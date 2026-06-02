from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    is_premium: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    is_premium: Optional[bool] = None


# ── Book / Chapter ────────────────────────────────────────────────────────────

class ChapterOut(BaseModel):
    id: int
    idx: int
    title: str
    length_secs: int
    start_secs: int
    audio_key: Optional[str] = None

    model_config = {"from_attributes": True}


class ChapterAudioResponse(BaseModel):
    url: str
    expires_in: int

class BookOut(BaseModel):
    id: str
    title: str
    author: str
    narrator: str
    genre: str
    duration_secs: int
    rating_avg: float
    reviews_count: int
    price: float
    year: int
    tags: List[str]
    blurb: str
    palette: List[str]
    motif: str

    model_config = {"from_attributes": True}

class BookListResponse(BaseModel):
    items: List[BookOut]
    total: int
    page: int
    limit: int


# ── Cart ──────────────────────────────────────────────────────────────────────

class CartItemOut(BaseModel):
    book: BookOut

    model_config = {"from_attributes": True}

class CartResponse(BaseModel):
    items: List[CartItemOut]
    total: float


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderItemOut(BaseModel):
    book: BookOut
    price_at_purchase: float

    model_config = {"from_attributes": True}

class OrderOut(BaseModel):
    id: str
    total: float
    status: str
    created_at: datetime
    items: List[OrderItemOut]

    model_config = {"from_attributes": True}


# ── Progress ──────────────────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    chapter_idx: int
    position_secs: float

class ProgressOut(BaseModel):
    book_id: str
    chapter_idx: int
    position_secs: float
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Bookmarks ─────────────────────────────────────────────────────────────────

class BookmarkCreate(BaseModel):
    book_id: str
    chapter_idx: int
    position_secs: float
    note: str = ""

class BookmarkOut(BaseModel):
    id: str
    book_id: str
    chapter_idx: int
    position_secs: float
    note: str
    created_at: datetime

    model_config = {"from_attributes": True}
