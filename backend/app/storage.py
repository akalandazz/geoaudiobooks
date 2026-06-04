import os
from pathlib import Path
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


def cover_object_key(book_id: str, ext: str) -> str:
    return f"{book_id}/cover{ext}"


def upload_cover(cover_key: str, file_path: str, content_type: str) -> None:
    _client().upload_file(file_path, _BUCKET, cover_key, ExtraArgs={"ContentType": content_type})


def get_cover_stream(cover_key: str):
    return _client().get_object(Bucket=_BUCKET, Key=cover_key)["Body"]


# ── HLS helpers ───────────────────────────────────────────────────────────────

def hls_playlist_key(book_id: str, chapter_idx: int) -> str:
    return f"{book_id}/{chapter_idx:03d}/playlist.m3u8"


def hls_segment_key(book_id: str, chapter_idx: int, seg_filename: str) -> str:
    return f"{book_id}/{chapter_idx:03d}/{seg_filename}"


def get_hls_playlist_content(playlist_key: str) -> str:
    s3 = _client()
    response = s3.get_object(Bucket=_BUCKET, Key=playlist_key)
    return response["Body"].read().decode("utf-8")


def get_segment_stream(segment_key: str):
    """Return a streaming body for a .ts segment (for backend proxying)."""
    s3 = _client()
    response = s3.get_object(Bucket=_BUCKET, Key=segment_key)
    return response["Body"]


def upload_hls_chapter(book_id: str, chapter_idx: int, hls_dir: str) -> tuple[str, list[str]]:
    """Upload playlist.m3u8 + all .ts segments from hls_dir. Returns (playlist_key, segment_names)."""
    s3 = _client()
    src = Path(hls_dir)
    playlist_path = src / "playlist.m3u8"
    if not playlist_path.exists():
        raise FileNotFoundError(f"playlist.m3u8 not found in {hls_dir}")

    playlist_key = hls_playlist_key(book_id, chapter_idx)
    s3.upload_file(
        str(playlist_path), _BUCKET, playlist_key,
        ExtraArgs={"ContentType": "application/vnd.apple.mpegurl"},
    )

    segments = []
    for seg in sorted(src.glob("*.ts")):
        seg_key = hls_segment_key(book_id, chapter_idx, seg.name)
        s3.upload_file(str(seg), _BUCKET, seg_key, ExtraArgs={"ContentType": "video/mp2t"})
        segments.append(seg.name)

    return playlist_key, segments
