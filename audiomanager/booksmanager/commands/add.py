import re
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer
import yaml
from rich.console import Console
from rich.table import Table

from booksmanager.db import get_session
from booksmanager.models import Book, Chapter
from booksmanager.storage import ensure_bucket_exists, upload_chapter, object_key

console = Console()

VALID_MOTIFS = {"lines", "wave", "grid", "soft"}
SLUG_RE = re.compile(r"^[a-z0-9-]+$")


def add(
    yaml_file: Path = typer.Argument(..., help="Path to book YAML definition file"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Validate and preview without writing to DB or MinIO"),
):
    """Add a new audiobook from a YAML definition file."""
    if not yaml_file.exists():
        typer.echo(f"Error: file not found: {yaml_file}", err=True)
        raise typer.Exit(1)

    with open(yaml_file, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    yaml_dir = yaml_file.resolve().parent
    errors = _validate(data, yaml_dir)
    if errors:
        typer.echo("Validation errors:", err=True)
        for e in errors:
            typer.echo(f"  • {e}", err=True)
        raise typer.Exit(1)

    # Build chapter list (plain dicts — no ORM objects yet)
    acc = 0
    chapters = []
    for i, ch in enumerate(data["chapters"]):
        length = int(ch["length_secs"])
        chapters.append(
            {
                "idx": i,
                "title": ch["title"],
                "length_secs": length,
                "start_secs": acc,
                "audio_key": object_key(data["id"], i),
                "audio_file": (yaml_dir / ch["audio_file"]).resolve(),
            }
        )
        acc += length

    duration_secs = acc

    if dry_run:
        _print_preview(data, chapters, duration_secs)
        return

    # Check for duplicate before touching the DB
    with get_session() as db:
        if db.query(Book).filter(Book.id == data["id"]).first():
            typer.echo(f"Error: book '{data['id']}' already exists.", err=True)
            raise typer.Exit(1)

        book = Book(
            id=data["id"],
            title=data["title"],
            author=data["author"],
            narrator=data.get("narrator", ""),
            genre=data["genre"],
            duration_secs=duration_secs,
            rating_avg=float(data.get("rating_avg", 0.0)),
            reviews_count=int(data.get("reviews_count", 0)),
            price=float(data["price"]),
            year=int(data.get("year", datetime.now().year)),
            tags=data.get("tags", []),
            blurb=data.get("blurb", ""),
            palette=data.get("palette", []),
            motif=data.get("motif", "lines"),
        )
        db.add(book)

        for ch in chapters:
            db.add(
                Chapter(
                    book_id=data["id"],
                    idx=ch["idx"],
                    title=ch["title"],
                    length_secs=ch["length_secs"],
                    start_secs=ch["start_secs"],
                    audio_key=ch["audio_key"],
                )
            )

        db.commit()

    console.print(f"[green]✓[/green] Book [bold]{data['title']}[/bold] ({data['id']}) added to database.")

    # Upload audio files to MinIO
    try:
        ensure_bucket_exists()
    except Exception as e:
        console.print(f"[red]Error connecting to MinIO:[/red] {e}")
        console.print("[yellow]Book is in the database. Run 'booksmanager upload' to upload audio later.[/yellow]")
        raise typer.Exit(1)

    uploaded = 0
    failures = []
    for ch in chapters:
        try:
            upload_chapter(ch["audio_key"], str(ch["audio_file"]))
            console.print(f"  [dim]↑[/dim] Chapter {ch['idx']}: {ch['audio_file'].name} → {ch['audio_key']}")
            uploaded += 1
        except Exception as e:
            failures.append(ch["idx"])
            console.print(f"  [red]✗[/red] Chapter {ch['idx']}: upload failed — {e}", highlight=False)

    n = len(chapters)
    if failures:
        console.print(
            f"\n[yellow]Added: {data['title']} ({data['id']}) — {n} chapters, {uploaded}/{n} audio uploaded.[/yellow]"
        )
        console.print("[yellow]Run 'booksmanager upload' to retry failed uploads.[/yellow]")
        raise typer.Exit(1)
    else:
        console.print(
            f"\n[green]Added: {data['title']} ({data['id']}) — {n} chapters, {uploaded}/{n} audio uploaded.[/green]"
        )


def _validate(data: dict, yaml_dir: Path) -> list[str]:
    errors = []

    for field in ("id", "title", "author", "genre", "price", "chapters"):
        if field not in data:
            errors.append(f"Missing required field: '{field}'")

    if "id" in data and not SLUG_RE.match(str(data["id"])):
        errors.append(f"'id' must match ^[a-z0-9-]+$ (got: {data['id']!r})")

    if "price" in data:
        try:
            if float(data["price"]) < 0:
                errors.append("'price' must be >= 0")
        except (TypeError, ValueError):
            errors.append("'price' must be a number")

    if "palette" in data:
        p = data["palette"]
        if not isinstance(p, list) or len(p) != 3:
            errors.append("'palette' must be a list of exactly 3 hex color strings")
        else:
            for c in p:
                if not re.match(r"^#[0-9a-fA-F]{6}$", str(c)):
                    errors.append(f"Invalid palette color: {c!r} (expected #RRGGBB)")

    if "motif" in data and data["motif"] not in VALID_MOTIFS:
        errors.append(f"'motif' must be one of {sorted(VALID_MOTIFS)} (got: {data['motif']!r})")

    if "chapters" in data:
        chapters = data["chapters"]
        if not isinstance(chapters, list) or len(chapters) == 0:
            errors.append("'chapters' must be a non-empty list")
        else:
            for i, ch in enumerate(chapters):
                if not isinstance(ch, dict):
                    errors.append(f"Chapter {i}: must be a mapping")
                    continue
                if "title" not in ch:
                    errors.append(f"Chapter {i}: missing 'title'")
                if "length_secs" not in ch:
                    errors.append(f"Chapter {i}: missing 'length_secs'")
                elif int(ch["length_secs"]) <= 0:
                    errors.append(f"Chapter {i}: 'length_secs' must be > 0")
                if "audio_file" not in ch:
                    errors.append(f"Chapter {i}: missing 'audio_file'")
                else:
                    p = (yaml_dir / ch["audio_file"]).resolve()
                    if not p.exists():
                        errors.append(f"Chapter {i}: audio_file not found: {p}")
                    elif not str(ch["audio_file"]).lower().endswith(".mp3"):
                        errors.append(f"Chapter {i}: audio_file must be an .mp3 file")

    return errors


def _print_preview(data: dict, chapters: list, duration_secs: int):
    console.print("\n[bold]DRY RUN — Book preview[/bold]")
    console.print(f"  ID       : {data['id']}")
    console.print(f"  Title    : {data['title']}")
    console.print(f"  Author   : {data['author']}")
    console.print(f"  Narrator : {data.get('narrator', '')}")
    console.print(f"  Genre    : {data['genre']}")
    console.print(f"  Price    : ${float(data['price']):.2f}")
    console.print(f"  Duration : {_fmt_duration(duration_secs)}")

    table = Table(title="Chapters", show_lines=False)
    table.add_column("#", style="dim", width=4)
    table.add_column("Title")
    table.add_column("Start", justify="right")
    table.add_column("Length", justify="right")
    table.add_column("Local file", style="dim")
    table.add_column("MinIO key", style="cyan")

    for ch in chapters:
        table.add_row(
            str(ch["idx"]),
            ch["title"],
            _fmt_hms(ch["start_secs"]),
            _fmt_ms(ch["length_secs"]),
            ch["audio_file"].name,
            ch["audio_key"],
        )

    console.print(table)


def _fmt_duration(secs: int) -> str:
    h, r = divmod(secs, 3600)
    m = r // 60
    return f"{h}h {m}m" if h else f"{m}m"


def _fmt_hms(secs: int) -> str:
    h, r = divmod(secs, 3600)
    m, s = divmod(r, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _fmt_ms(secs: int) -> str:
    m, s = divmod(secs, 60)
    return f"{m:02d}:{s:02d}"
