from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, books, cart, orders, library, progress, bookmarks, users, wishlist

app = FastAPI(title="GeoAudiobooks API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(library.router)
app.include_router(progress.router)
app.include_router(bookmarks.router)
app.include_router(users.router)
app.include_router(wishlist.router)


@app.get("/health")
def health():
    return {"status": "ok"}
