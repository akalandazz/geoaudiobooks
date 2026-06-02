import os
from pathlib import Path
from dotenv import load_dotenv


def _load_env():
    here = Path(__file__).resolve().parent.parent  # audiomanager/
    for candidate in [here / ".env", here.parent / "backend" / ".env"]:
        if candidate.exists():
            load_dotenv(candidate, override=False)
            break


_load_env()


class Settings:
    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/geoaudiobooks"
        )
        self.minio_endpoint = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
        self.minio_access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.minio_secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.minio_bucket = os.getenv("MINIO_BUCKET", "audiobooks")


settings = Settings()
