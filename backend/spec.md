# Backend Spec

**Stack:** FastAPI (sync, no `async`/`await`) · PostgreSQL · SQLAlchemy ORM · Alembic · JWT (HS256, 7-day) · bcrypt · Pydantic v2

## Running

```bash
docker compose up                          # starts postgres:16 + minio + backend on :8000
alembic upgrade head                       # run migrations (from backend/)
python -m app.seed                         # seed 12 books + chapters (once)
http://localhost:8000/docs                 # OpenAPI UI
http://localhost:9001                      # MinIO console (minioadmin / minioadmin)
```

Copy `backend/.env.example` → `backend/.env` before first run.

## File Map

```
backend/
├── app/
│   ├── main.py        # FastAPI app, CORS (localhost:3000), router mounts
│   ├── database.py    # engine, SessionLocal, Base
│   ├── models.py      # all ORM models
│   ├── schemas.py     # all Pydantic schemas
│   ├── auth.py        # hash_password, verify_password, create_token, decode_token
│   ├── deps.py        # get_db, get_current_user (Bearer token)
│   ├── seed.py        # seeds books + chapters; idempotent
│   ├── storage.py     # boto3 MinIO client; presign_chapter, upload_chapter, object_key, ensure_bucket_exists
│   │                  # HLS helpers: hls_playlist_key, hls_segment_key, get_hls_playlist_content,
│   │                  #              get_segment_stream, upload_hls_chapter
│   └── routers/
│       ├── auth.py        # /auth/signup  /auth/signin  /auth/forgot-password
│       ├── books.py       # /books  /books/{id}  /books/{id}/chapters
│       ├── audio.py       # /books/{id}/chapters/{id}/audio   — ownership-gated pre-signed URL (MP3)
│       │                  # /books/{id}/chapters/{id}/hls      — raw HLS playlist (audio_key must end .m3u8; 404 otherwise)
│       │                  # /books/{id}/chapters/{id}/hls/{f}  — segment proxy (.ts); avoids MinIO CORS
│       ├── cart.py        # /cart  /cart/{book_id}
│       ├── orders.py      # /orders/checkout  /orders
│       ├── library.py     # /library
│       ├── progress.py    # /progress  /progress/{book_id}
│       ├── bookmarks.py   # /bookmarks  /bookmarks/{id}
│       ├── wishlist.py    # /wishlist  /wishlist/{book_id}
│       └── users.py       # /users/me
├── alembic/           # migrations
├── alembic.ini
├── requirements.txt
└── .env.example
```

## Models

| Table | Key columns |
|---|---|
| `users` | id (UUID), email (unique), password_hash, name, is_premium |
| `books` | id (slug), title, author, narrator, genre, duration_secs, rating_avg, reviews_count, price, year, tags (JSONB), blurb, palette (JSONB), motif |
| `chapters` | id, book_id, idx, title, length_secs, start_secs, audio_key (nullable) — set to `{book_id}/{idx:03d}.mp3` for MP3 uploads or `{book_id}/{idx:03d}/playlist.m3u8` for HLS uploads |
| `cart_items` | user_id, book_id — unique pair |
| `wishlist_items` | user_id, book_id — unique pair |
| `orders` | id (UUID), user_id, total, status (completed) |
| `order_items` | order_id, book_id, price_at_purchase |
| `progress` | user_id, book_id, chapter_idx, position_secs — unique pair |
| `bookmarks` | id (UUID), user_id, book_id, chapter_idx, position_secs, note |

## API Summary

All protected routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /auth/signup | — | returns JWT |
| POST | /auth/signin | — | returns JWT |
| POST | /auth/forgot-password | — | stub, no email sent |
| GET | /books | — | query: `q`, `genre`, `min_price`, `max_price`, `min_rating`, `sort`, `page`, `limit` |
| GET | /books/{id} | — | |
| GET | /books/{id}/chapters | — | `ChapterOut` includes `audio_key` (null if no file uploaded) |
| GET | /books/{id}/chapters/{chapter_id}/audio | ✓ | 403 if book not owned; 404 if no audio_key; returns `{url, expires_in}` pre-signed MinIO URL |
| GET | /books/{id}/chapters/{chapter_id}/hls | ✓ | 403 if not owned; 404 if audio_key is null or not `.m3u8`; returns raw M3U8 playlist (segment paths are relative filenames — frontend rewrites to absolute proxy URLs) |
| GET | /books/{id}/chapters/{chapter_id}/hls/{filename} | ✓ | Segment proxy — streams `.ts` file from MinIO; avoids exposing MinIO directly or requiring MinIO CORS config |
| GET | /cart | ✓ | includes total |
| POST | /cart/{book_id} | ✓ | idempotent |
| DELETE | /cart/{book_id} | ✓ | |
| POST | /orders/checkout | ✓ | mock Stripe; clears cart, creates order |
| GET | /orders | ✓ | purchase history |
| GET | /library | ✓ | purchased books |
| GET | /progress | ✓ | all playback positions |
| PUT | /progress/{book_id} | ✓ | upsert `{chapter_idx, position_secs}` |
| GET | /bookmarks | ✓ | |
| POST | /bookmarks | ✓ | `{book_id, chapter_idx, position_secs, note}` |
| DELETE | /bookmarks/{id} | ✓ | |
| GET | /wishlist | ✓ | |
| POST | /wishlist/{book_id} | ✓ | idempotent |
| DELETE | /wishlist/{book_id} | ✓ | |
| GET | /users/me | ✓ | |
| PATCH | /users/me | ✓ | `{name, is_premium}` |
