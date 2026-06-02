import os
import boto3
from botocore.client import Config

_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
_ACCESS   = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
_SECRET   = os.getenv("MINIO_SECRET_KEY", "minioadmin")
_BUCKET   = os.getenv("MINIO_BUCKET", "audiobooks")
_EXPIRY   = int(os.getenv("PRESIGN_EXPIRY_SECONDS", "3600"))


def _client():
    return boto3.client(
        "s3",
        endpoint_url=_ENDPOINT,
        aws_access_key_id=_ACCESS,
        aws_secret_access_key=_SECRET,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket_exists():
    s3 = _client()
    existing = [b["Name"] for b in s3.list_buckets().get("Buckets", [])]
    if _BUCKET not in existing:
        s3.create_bucket(Bucket=_BUCKET)


def presign_chapter(audio_key: str, expiry: int = _EXPIRY) -> str:
    s3 = _client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": _BUCKET, "Key": audio_key},
        ExpiresIn=expiry,
    )


def upload_chapter(audio_key: str, file_path: str) -> None:
    s3 = _client()
    s3.upload_file(file_path, _BUCKET, audio_key, ExtraArgs={"ContentType": "audio/mpeg"})


def object_key(book_id: str, chapter_idx: int) -> str:
    return f"{book_id}/{chapter_idx:03d}.mp3"
