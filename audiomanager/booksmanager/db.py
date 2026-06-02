from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

_engine = None
_SessionLocal = None


def _init():
    global _engine, _SessionLocal
    if _engine is None:
        from booksmanager.config import settings
        _engine = create_engine(settings.database_url)
        _SessionLocal = sessionmaker(bind=_engine)


@contextmanager
def get_session():
    _init()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
