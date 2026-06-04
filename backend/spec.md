# Backend Spec

**Stack:** FastAPI (sync, no `async`/`await`) · PostgreSQL · SQLAlchemy ORM · Alembic · JWT (HS256, 7-day) · bcrypt · Pydantic v2 · Celery + Redis (event queue)

## Running

```bash
docker compose up                          # starts postgres:16 + redis:7 + minio + backend:8000 + celery worker
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
│   ├── celery_app.py           # Celery instance; broker/backend = REDIS_URL; autodiscovers app.tasks
│   ├── notifications_service.py # broadcast(), notify_user(), list_for_user(), unread_count(), mark_read(), mark_all_read()
│   ├── tasks.py                # process_event Celery task — dispatches by event_type → notifications_service
│   └── routers/
│       ├── auth.py        # /auth/signup  /auth/signin  /auth/forgot-password
│       ├── books.py       # /books  /books/{id}  /books/{id}/chapters
│       ├── audio.py       # /books/{id}/chapters/{id}/audio   — ownership-gated pre-signed URL (MP3)
│       │                  # /books/{id}/chapters/{id}/hls      — HLS playlist; chapter.idx==0 (sample) skips ownership check; others require ownership
│       │                  # /books/{id}/chapters/{id}/hls/{f}  — segment proxy (.ts); same ownership rule as playlist
│       ├── cart.py        # /cart  /cart/{book_id}
│       ├── orders.py      # /orders/checkout  /orders
│       ├── library.py     # /library
│       ├── progress.py    # /progress  /progress/{book_id}
│       ├── bookmarks.py   # /bookmarks  /bookmarks/{id}
│       ├── wishlist.py    # /wishlist  /wishlist/{book_id}
│       ├── users.py       # /users/me
│       ├── notifications.py # /notifications  /notifications/unread-count  /notifications/{id}/read  /notifications/read-all
│       └── internal.py    # /internal/events — key-guarded (X-Internal-Key); enqueues Celery task; returns 202
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
| `notifications` | id (UUID), audience ("all"\|"user"), user_id (nullable — null for broadcasts), type, title, body, book_id (nullable), created_at — **one row per notification regardless of user count** |
| `notification_reads` | user_id, notification_id (unique pair), read_at — **lazy read tracking; row exists only when a user reads an item** |
| `idempotency_keys` | key (String PK), user_id, endpoint, order_id (nullable — replayable result ref), created_at — pruned after 48h by Celery beat |

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
| GET | /books/{id}/chapters/{chapter_id}/hls | ✓ | `chapter.idx == 0` (sample) exempt from ownership check; all others 403 if not owned. 404 if `audio_key` is null or not `.m3u8`; returns raw M3U8 (segment paths are relative — frontend rewrites to absolute proxy URLs) |
| GET | /books/{id}/chapters/{chapter_id}/hls/{filename} | ✓ | `chapter.idx == 0` exempt from ownership check; all others 403 if not owned. Segment proxy — streams `.ts` from MinIO; avoids CORS |
| GET | /cart | ✓ | includes total (single join query) |
| POST | /cart/{book_id} | ✓ | idempotent (`ON CONFLICT DO NOTHING`) |
| DELETE | /cart/{book_id} | ✓ | |
| POST | /cart/from-wishlist/{book_id} | ✓ | atomic move: insert cart + delete wishlist in one txn |
| POST | /orders/checkout | ✓ | requires `Idempotency-Key` header (UUID); mock Stripe; clears cart, creates order; retries with same key replay original order |
| GET | /orders | ✓ | purchase history |
| GET | /library | ✓ | purchased books |
| GET | /progress | ✓ | all playback positions |
| PUT | /progress/{book_id} | ✓ | upsert `{chapter_idx, position_secs}` |
| GET | /bookmarks | ✓ | |
| POST | /bookmarks | ✓ | `{book_id, chapter_idx, position_secs, note}` |
| DELETE | /bookmarks/{id} | ✓ | |
| GET | /wishlist | ✓ | |
| POST | /wishlist/{book_id} | ✓ | idempotent (`ON CONFLICT DO NOTHING`) |
| DELETE | /wishlist/{book_id} | ✓ | |
| GET | /users/me | ✓ | |
| PATCH | /users/me | ✓ | `{name, is_premium}` |
| GET | /notifications | ✓ | `?limit=50`; newest-first; `is_read` derived via LEFT JOIN on `notification_reads` |
| GET | /notifications/unread-count | ✓ | `{ "count": n }` — cheap poll target |
| POST | /notifications/{id}/read | ✓ | marks one notification read; 404 if not visible to user |
| POST | /notifications/read-all | ✓ | marks all visible unread notifications read |
| POST | /internal/events | key | `X-Internal-Key` header required; body `{ type, payload }`; enqueues Celery task; returns 202 `{ "status": "queued" }` |

## Notification architecture

**Fan-out on read** — a broadcast (`audience="all"`) is a single DB INSERT regardless of user count. `is_read` is derived per-user at query time (LEFT JOIN `notification_reads`), never stored on the notification row.

**Visibility rule:** a notification is visible to user *U* if `user_id = U` OR (`audience="all"` AND `created_at >= U.created_at`). The `created_at` guard prevents new signups from seeing the entire broadcast backlog.

**Event pipeline:** `booksmanager add` → `POST /internal/events` → Celery task on Redis → worker calls `notifications_service.broadcast()`. Backend returns 202 immediately; write is async. Add new event types to `tasks.py → process_event`. Call `notify_user()` directly (or dispatch a task) for user-specific notifications.
