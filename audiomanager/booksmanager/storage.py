import boto3
from botocore.client import Config
from booksmanager.config import settings


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.minio_endpoint,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket_exists():
    s3 = _client()
    existing = [b["Name"] for b in s3.list_buckets().get("Buckets", [])]
    if settings.minio_bucket not in existing:
        s3.create_bucket(Bucket=settings.minio_bucket)


def upload_chapter(audio_key: str, file_path: str) -> None:
    s3 = _client()
    s3.upload_file(file_path, settings.minio_bucket, audio_key, ExtraArgs={"ContentType": "audio/mpeg"})


def object_key(book_id: str, chapter_idx: int) -> str:
    return f"{book_id}/{chapter_idx:03d}.mp3"
