"""
booksmanager — GeoAudiobooks content management CLI
Run: booksmanager --help
"""
import os
import re
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

import boto3
import yaml
import typer
from botocore.client import Config
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table
from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text, create_engine, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# ── Config ────────────────────────────────────────────────────────────────────

def _load_env():
    here = Path(__file__).resolve().parent
    for candidate in [here / ".env", here.parent / "backend" / ".env"]:
        if candidate.exists():
            load_dotenv(candidate, override=False)
            break

_load_env()

DATABASE_URL  = os.getenv("DATABASE_URL",  "postgresql://postgres:postgres@localhost:5432/geoaudiobooks")
MINIO_ENDPOINT    = os.getenv("MINIO_ENDPOINT",    "http://localhost:9000")
MINIO_ACCESS_KEY  = os.getenv("MINIO_ACCESS_KEY",  "minioadmin")
MINIO_SECRET_KEY  = os.getenv("MINIO_SECRET_KEY",  "minioadmin")
MINIO_BUCKET      = os.getenv("MINIO_BUCKET",      "audiobooks")

# ── Database ──────────────────────────────────────────────────────────────────

Base = declarative_base()
_engine = None
_Session = None

def _db_init():
    global _engine, _Session
    if _engine is None:
        _engine = create_engine(DATABASE_URL)
        _Session = sessionmaker(bind=_engine)

@contextmanager
def session():
    _db_init()
    db = _Session()
    try:
        yield db
    finally:
        db.close()

# ── Models ────────────────────────────────────────────────────────────────────

class Book(Base):
    __tablename__ = "books"
    id            = Column(String,  primary_key=True)
    title         = Column(String,  nullable=False)
    author        = Column(String,  nullable=False)
    narrator      = Column(String,  nullable=False, default="")
    genre         = Column(String,  nullable=False, default="")
    duration_secs = Column(Integer, nullable=False, default=0)
    rating_avg    = Column(Float,   default=0.0)
    reviews_count = Column(Integer, default=0)
    price         = Column(Float,   nullable=False, default=0.0)
    year          = Column(Integer, default=0)
    tags          = Column(JSONB,   default=list)
    blurb         = Column(Text,    default="")
    palette       = Column(JSONB,   default=list)
    motif         = Column(String,  default="lines")
    chapters = relationship("Chapter", back_populates="book", order_by="Chapter.idx", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    book_id     = Column(String,  ForeignKey("books.id"), nullable=False)
    idx         = Column(Integer, nullable=False)
    title       = Column(String,  nullable=False)
    length_secs = Column(Integer, nullable=False)
    start_secs  = Column(Integer, nullable=False)
    audio_key   = Column(String,  nullable=True)
    book = relationship("Book", back_populates="chapters")

# ── Storage ───────────────────────────────────────────────────────────────────

def _s3():
    return boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )

def _ensure_bucket():
    s3 = _s3()
    existing = [b["Name"] for b in s3.list_buckets().get("Buckets", [])]
    if MINIO_BUCKET not in existing:
        s3.create_bucket(Bucket=MINIO_BUCKET)

def _upload(audio_key: str, file_path: str):
    _s3().upload_file(file_path, MINIO_BUCKET, audio_key, ExtraArgs={"ContentType": "audio/mpeg"})

def _audio_key(book_id: str, idx: int) -> str:
    return f"{book_id}/{idx:03d}.mp3"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _hms(secs: int) -> str:
    h, r = divmod(secs, 3600); m, s = divmod(r, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

def _ms(secs: int) -> str:
    m, s = divmod(secs, 60); return f"{m:02d}:{s:02d}"

def _dur(secs: int) -> str:
    h, r = divmod(secs, 3600); m = r // 60
    return f"{h}h {m}m" if h else f"{m}m"

SLUG_RE     = re.compile(r"^[a-z0-9-]+$")
VALID_MOTIFS = {"lines", "wave", "grid", "soft"}
console     = Console()

# ── CLI ───────────────────────────────────────────────────────────────────────

app = typer.Typer(name="booksmanager", help="GeoAudiobooks content management CLI.", no_args_is_help=True)


@app.command()
def add(
    yaml_file: Path = typer.Argument(..., help="Path to book YAML file"),
    dry_run: bool   = typer.Option(False, "--dry-run", help="Validate and preview without writing"),
):
    """Add a new audiobook from a YAML definition file."""
    if not yaml_file.exists():
        typer.echo(f"Error: file not found: {yaml_file}", err=True); raise typer.Exit(1)

    with open(yaml_file, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    yaml_dir = yaml_file.resolve().parent
    errors   = _validate_yaml(data, yaml_dir)
    if errors:
        typer.echo("Validation errors:", err=True)
        for e in errors: typer.echo(f"  • {e}", err=True)
        raise typer.Exit(1)

    acc, chapters = 0, []
    for i, ch in enumerate(data["chapters"]):
        length = int(ch["length_secs"])
        chapters.append({
            "idx": i, "title": ch["title"],
            "length_secs": length, "start_secs": acc,
            "audio_key": _audio_key(data["id"], i),
            "audio_file": (yaml_dir / ch["audio_file"]).resolve(),
        })
        acc += length

    if dry_run:
        _preview(data, chapters, acc); return

    with session() as db:
        if db.query(Book).filter(Book.id == data["id"]).first():
            typer.echo(f"Error: book '{data['id']}' already exists.", err=True); raise typer.Exit(1)
        db.add(Book(
            id=data["id"], title=data["title"], author=data["author"],
            narrator=data.get("narrator", ""), genre=data["genre"],
            duration_secs=acc, price=float(data["price"]),
            rating_avg=float(data.get("rating_avg", 0.0)),
            reviews_count=int(data.get("reviews_count", 0)),
            year=int(data.get("year", datetime.now().year)),
            tags=data.get("tags", []), blurb=data.get("blurb", ""),
            palette=data.get("palette", []), motif=data.get("motif", "lines"),
        ))
        for ch in chapters:
            db.add(Chapter(
                book_id=data["id"], idx=ch["idx"], title=ch["title"],
                length_secs=ch["length_secs"], start_secs=ch["start_secs"],
                audio_key=ch["audio_key"],
            ))
        db.commit()

    console.print(f"[green]✓[/green] [bold]{data['title']}[/bold] ({data['id']}) added to database.")

    try:
        _ensure_bucket()
    except Exception as e:
        console.print(f"[red]MinIO error:[/red] {e}")
        console.print("[yellow]Run 'booksmanager upload' to upload audio later.[/yellow]")
        raise typer.Exit(1)

    uploaded, failures = 0, []
    for ch in chapters:
        try:
            _upload(ch["audio_key"], str(ch["audio_file"]))
            console.print(f"  [dim]↑[/dim] Chapter {ch['idx']}: {ch['audio_file'].name} → {ch['audio_key']}")
            uploaded += 1
        except Exception as e:
            failures.append(ch["idx"])
            console.print(f"  [red]✗[/red] Chapter {ch['idx']}: {e}", highlight=False)

    n = len(chapters)
    style = "yellow" if failures else "green"
    console.print(f"\n[{style}]Added: {data['title']} — {n} chapters, {uploaded}/{n} audio uploaded.[/{style}]")
    if failures:
        console.print("[yellow]Run 'booksmanager upload' to retry.[/yellow]")
        raise typer.Exit(1)


@app.command("list")
def list_books(
    genre: Optional[str] = typer.Option(None, "--genre", help="Filter by genre"),
    missing_audio: bool  = typer.Option(False, "--missing-audio", help="Only books with missing audio"),
):
    """List all audiobooks."""
    with session() as db:
        q     = db.query(Book)
        if genre: q = q.filter(Book.genre == genre)
        books = q.order_by(Book.title).all()
        if not books: typer.echo("No books found."); return

        totals   = dict(db.query(Chapter.book_id, func.count(Chapter.id)).group_by(Chapter.book_id).all())
        uploaded = dict(db.query(Chapter.book_id, func.count(Chapter.id))
                        .filter(Chapter.audio_key.isnot(None)).group_by(Chapter.book_id).all())

    if missing_audio:
        books = [b for b in books if uploaded.get(b.id, 0) < totals.get(b.id, 0)]
        if not books: typer.echo("All books have complete audio."); return

    t = Table(header_style="bold")
    t.add_column("ID",     style="cyan", no_wrap=True)
    t.add_column("Title")
    t.add_column("Author", style="dim")
    t.add_column("Genre")
    t.add_column("Price",  justify="right")
    t.add_column("Audio",  justify="right")

    for b in books:
        total = totals.get(b.id, 0); up = uploaded.get(b.id, 0)
        if total == 0:       audio = "[dim]—[/dim]"
        elif up == total:    audio = f"[green]{up}/{total}[/green]"
        elif up > 0:         audio = f"[yellow]{up}/{total}[/yellow]"
        else:                audio = f"[red]{up}/{total}[/red]"
        t.add_row(b.id, b.title, b.author, b.genre, f"${b.price:.2f}", audio)

    console.print(t)
    console.print(f"\nTotal: {len(books)} book{'s' if len(books) != 1 else ''}")


@app.command()
def show(book_id: str = typer.Argument(..., help="Book slug ID")):
    """Show book details and per-chapter audio status."""
    with session() as db:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            typer.echo(f"Error: book '{book_id}' not found.", err=True); raise typer.Exit(1)
        chs = [{"idx": c.idx, "title": c.title, "start_secs": c.start_secs,
                "length_secs": c.length_secs, "audio_key": c.audio_key}
               for c in sorted(book.chapters, key=lambda c: c.idx)]
        meta = {"id": book.id, "title": book.title, "author": book.author,
                "narrator": book.narrator, "genre": book.genre, "year": book.year,
                "price": book.price, "duration_secs": book.duration_secs,
                "rating_avg": book.rating_avg, "reviews_count": book.reviews_count,
                "tags": list(book.tags or []), "blurb": book.blurb or ""}

    console.print(f"\n[bold]{meta['title']}[/bold]  [dim]({meta['id']})[/dim]")
    for label, val in [
        ("Author",   meta["author"]),
        ("Narrator", meta["narrator"] or "—"),
        ("Genre",    meta["genre"]),
        ("Year",     str(meta["year"])),
        ("Price",    f"${meta['price']:.2f}"),
        ("Duration", _dur(meta["duration_secs"])),
        ("Rating",   f"{meta['rating_avg']} ({meta['reviews_count']} reviews)"),
    ]:
        console.print(f"  {label:<10}: {val}")
    if meta["tags"]:
        console.print(f"  {'Tags':<10}: {', '.join(meta['tags'])}")
    if meta["blurb"]:
        b = meta["blurb"]; console.print(f"  {'Blurb':<10}: {b[:120]}{'...' if len(b) > 120 else ''}")

    if not chs: console.print("\n[dim]No chapters.[/dim]"); return

    t = Table(show_lines=False, header_style="bold")
    t.add_column("#",      style="dim", width=4)
    t.add_column("Title")
    t.add_column("Start",  justify="right")
    t.add_column("Length", justify="right")
    t.add_column("Audio",  justify="center")
    for c in chs:
        t.add_row(str(c["idx"]), c["title"], _hms(c["start_secs"]), _ms(c["length_secs"]),
                  "[green]✓[/green]" if c["audio_key"] else "[red]✗[/red]")

    uploaded = sum(1 for c in chs if c["audio_key"])
    console.print(); console.print(t)
    console.print(f"\nAudio: {uploaded}/{len(chs)} chapters uploaded")


@app.command()
def upload(
    book_id: str           = typer.Argument(..., help="Book slug ID"),
    dir:     Optional[Path] = typer.Option(None, "--dir",     help="Directory of MP3 files (000.mp3, 001.mp3, ...)"),
    file:    Optional[Path] = typer.Option(None, "--file",    help="Single MP3 file"),
    chapter: Optional[int]  = typer.Option(None, "--chapter", help="Chapter index (required with --file)"),
    dry_run: bool           = typer.Option(False, "--dry-run", help="Preview without uploading"),
):
    """Upload or re-upload audio files for an existing book."""
    if dir is None and file is None:
        typer.echo("Error: provide --dir or --file.", err=True); raise typer.Exit(1)
    if dir is not None and file is not None:
        typer.echo("Error: --dir and --file are mutually exclusive.", err=True); raise typer.Exit(1)
    if file is not None and chapter is None:
        typer.echo("Error: --file requires --chapter.", err=True); raise typer.Exit(1)

    with session() as db:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            typer.echo(f"Error: book '{book_id}' not found.", err=True); raise typer.Exit(1)
        chs = [{"id": c.id, "idx": c.idx} for c in sorted(book.chapters, key=lambda c: c.idx)]

    if dir is not None:
        if not dir.is_dir():
            typer.echo(f"Error: not a directory: {dir}", err=True); raise typer.Exit(1)

        idx_map: dict = {}
        for ch in chs:
            idx_map[f"{ch['idx']:03d}.mp3"] = ch
            idx_map[f"{ch['idx']}.mp3"]     = ch

        plan: list[tuple] = []; seen: set = set(); unmatched = []
        for f in sorted(dir.glob("*.mp3")):
            ch = idx_map.get(f.name)
            if ch and ch["id"] not in seen:
                plan.append((ch, f)); seen.add(ch["id"])
            elif ch is None:
                unmatched.append(f.name)

        no_file = [ch for ch in chs if ch["id"] not in seen]
        if unmatched: console.print(f"[yellow]Skipping unrecognized files: {', '.join(unmatched)}[/yellow]")
        if no_file:   console.print(f"[yellow]No file for chapters: {', '.join(str(c['idx']) for c in no_file)}[/yellow]")
        if not plan:  typer.echo("No matching MP3 files found."); return

        if dry_run:
            console.print("[bold]DRY RUN — would upload:[/bold]")
            for ch, f in plan: console.print(f"  Chapter {ch['idx']}: {f.name} → {_audio_key(book_id, ch['idx'])}")
            return
    else:
        if not file.exists():
            typer.echo(f"Error: file not found: {file}", err=True); raise typer.Exit(1)
        if file.suffix.lower() != ".mp3":
            typer.echo("Error: file must be .mp3.", err=True); raise typer.Exit(1)
        ch = next((c for c in chs if c["idx"] == chapter), None)
        if ch is None:
            typer.echo(f"Error: chapter {chapter} not found. Valid: {', '.join(str(c['idx']) for c in chs)}", err=True)
            raise typer.Exit(1)

        if dry_run:
            console.print(f"[bold]DRY RUN:[/bold] Chapter {chapter}: {file.name} → {_audio_key(book_id, chapter)}")
            return
        plan = [(ch, file)]

    _ensure_bucket()
    failures = []
    with session() as db:
        for ch_data, fp in plan:
            key = _audio_key(book_id, ch_data["idx"])
            try:
                _upload(key, str(fp))
                row = db.query(Chapter).filter(Chapter.id == ch_data["id"]).first()
                if row: row.audio_key = key
                console.print(f"  [green]↑[/green] Chapter {ch_data['idx']}: {fp.name} → {key}")
            except Exception as e:
                failures.append(ch_data["idx"])
                console.print(f"  [red]✗[/red] Chapter {ch_data['idx']}: {e}", highlight=False)
        db.commit()

    n = len(plan); ok = n - len(failures)
    style = "yellow" if failures else "green"
    console.print(f"\n[{style}]{ok}/{n} chapters uploaded.[/{style}]")
    if failures: raise typer.Exit(1)


@app.command()
def delete(
    book_id: str  = typer.Argument(..., help="Book slug ID"),
    yes:     bool = typer.Option(False, "--yes", "-y", help="Skip confirmation prompt"),
):
    """Delete an audiobook and all its chapters."""
    with session() as db:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            typer.echo(f"Error: book '{book_id}' not found.", err=True); raise typer.Exit(1)
        n_chapters = len(book.chapters); title = book.title
        if not yes and not typer.confirm(f"Delete '{title}' ({book_id}) and all {n_chapters} chapters?", default=False):
            typer.echo("Aborted."); return
        try:
            db.delete(book); db.commit()
        except IntegrityError:
            db.rollback()
            typer.echo(f"Error: '{book_id}' is referenced by existing orders or user libraries.", err=True)
            raise typer.Exit(1)

    console.print(f"[green]Deleted: {title} ({book_id})[/green]")
    console.print(f"[dim]Note: audio files in MinIO were not deleted. "
                  f"Remove bucket '{MINIO_BUCKET}' prefix '{book_id}/' manually.[/dim]")

# ── Validation ────────────────────────────────────────────────────────────────

def _validate_yaml(data: dict, yaml_dir: Path) -> list[str]:
    errors = []
    for f in ("id", "title", "author", "genre", "price", "chapters"):
        if f not in data: errors.append(f"Missing required field: '{f}'")

    if "id" in data and not SLUG_RE.match(str(data["id"])):
        errors.append(f"'id' must match ^[a-z0-9-]+$ (got: {data['id']!r})")
    if "price" in data:
        try:
            if float(data["price"]) < 0: errors.append("'price' must be >= 0")
        except (TypeError, ValueError):  errors.append("'price' must be a number")
    if "palette" in data:
        p = data["palette"]
        if not isinstance(p, list) or len(p) != 3:
            errors.append("'palette' must be a list of exactly 3 hex colors")
        else:
            for c in p:
                if not re.match(r"^#[0-9a-fA-F]{6}$", str(c)):
                    errors.append(f"Invalid palette color: {c!r}")
    if "motif" in data and data["motif"] not in VALID_MOTIFS:
        errors.append(f"'motif' must be one of {sorted(VALID_MOTIFS)}")
    if "chapters" in data:
        chs = data["chapters"]
        if not isinstance(chs, list) or not chs:
            errors.append("'chapters' must be a non-empty list")
        else:
            for i, ch in enumerate(chs):
                if not isinstance(ch, dict): errors.append(f"Chapter {i}: must be a mapping"); continue
                if "title"      not in ch:   errors.append(f"Chapter {i}: missing 'title'")
                if "length_secs" not in ch:  errors.append(f"Chapter {i}: missing 'length_secs'")
                elif int(ch["length_secs"]) <= 0: errors.append(f"Chapter {i}: 'length_secs' must be > 0")
                if "audio_file" not in ch:   errors.append(f"Chapter {i}: missing 'audio_file'")
                else:
                    p = (yaml_dir / ch["audio_file"]).resolve()
                    if not p.exists(): errors.append(f"Chapter {i}: audio_file not found: {p}")
                    elif not ch["audio_file"].lower().endswith(".mp3"):
                        errors.append(f"Chapter {i}: audio_file must be .mp3")
    return errors


def _preview(data: dict, chapters: list, duration_secs: int):
    console.print("\n[bold]DRY RUN — Book preview[/bold]")
    for label, val in [("ID", data["id"]), ("Title", data["title"]), ("Author", data["author"]),
                       ("Genre", data["genre"]), ("Price", f"${float(data['price']):.2f}"),
                       ("Duration", _dur(duration_secs))]:
        console.print(f"  {label:<10}: {val}")
    t = Table(title="Chapters", show_lines=False)
    t.add_column("#", style="dim", width=4); t.add_column("Title")
    t.add_column("Start", justify="right");  t.add_column("Length", justify="right")
    t.add_column("Local file", style="dim"); t.add_column("MinIO key", style="cyan")
    for ch in chapters:
        t.add_row(str(ch["idx"]), ch["title"], _hms(ch["start_secs"]), _ms(ch["length_secs"]),
                  ch["audio_file"].name, ch["audio_key"])
    console.print(t)


if __name__ == "__main__":
    app()
