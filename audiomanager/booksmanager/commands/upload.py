from pathlib import Path
from typing import Optional

import typer
from rich.console import Console

from booksmanager.db import get_session
from booksmanager.models import Book, Chapter
from booksmanager.storage import ensure_bucket_exists, upload_chapter, object_key

console = Console()


def upload(
    book_id: str = typer.Argument(..., help="Book slug ID"),
    dir: Optional[Path] = typer.Option(None, "--dir", help="Directory of MP3 files (000.mp3, 001.mp3, ...)"),
    file: Optional[Path] = typer.Option(None, "--file", help="Single MP3 file to upload"),
    chapter: Optional[int] = typer.Option(None, "--chapter", help="Chapter index (required with --file)"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Show what would be uploaded without uploading"),
):
    """Upload or re-upload audio files for an existing book."""
    if dir is None and file is None:
        typer.echo("Error: provide --dir or --file.", err=True)
        raise typer.Exit(1)
    if dir is not None and file is not None:
        typer.echo("Error: --dir and --file are mutually exclusive.", err=True)
        raise typer.Exit(1)
    if file is not None and chapter is None:
        typer.echo("Error: --file requires --chapter.", err=True)
        raise typer.Exit(1)

    with get_session() as db:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            typer.echo(f"Error: book '{book_id}' not found.", err=True)
            raise typer.Exit(1)
        # Convert to plain dicts before session closes
        chapters = [{"id": c.id, "idx": c.idx} for c in sorted(book.chapters, key=lambda c: c.idx)]

    if dir is not None:
        _upload_dir(book_id, chapters, dir, dry_run)
    else:
        _upload_single(book_id, chapters, file, chapter, dry_run)


def _upload_dir(book_id: str, chapters: list, dir_path: Path, dry_run: bool):
    if not dir_path.is_dir():
        typer.echo(f"Error: not a directory: {dir_path}", err=True)
        raise typer.Exit(1)

    # Build a lookup: both 000.mp3 and 0.mp3 forms map to the same chapter
    idx_map: dict[str, dict] = {}
    for ch in chapters:
        idx_map[f"{ch['idx']:03d}.mp3"] = ch
        idx_map[f"{ch['idx']}.mp3"] = ch

    plan: list[tuple[dict, Path]] = []
    unmatched: list[str] = []
    seen_chapter_ids: set[int] = set()

    for f in sorted(dir_path.glob("*.mp3")):
        ch = idx_map.get(f.name)
        if ch and ch["id"] not in seen_chapter_ids:
            plan.append((ch, f))
            seen_chapter_ids.add(ch["id"])
        elif ch is None:
            unmatched.append(f.name)

    no_file_chapters = [ch for ch in chapters if ch["id"] not in seen_chapter_ids]

    if unmatched:
        console.print(f"[yellow]Warning: unrecognized files (skipping): {', '.join(unmatched)}[/yellow]")
    if no_file_chapters:
        missing = ", ".join(str(c["idx"]) for c in no_file_chapters)
        console.print(f"[yellow]Warning: no matching file for chapters: {missing}[/yellow]")

    if not plan:
        typer.echo("No matching MP3 files found.")
        return

    if dry_run:
        console.print("[bold]DRY RUN — would upload:[/bold]")
        for ch, f in plan:
            console.print(f"  Chapter {ch['idx']}: {f.name} → {object_key(book_id, ch['idx'])}")
        return

    ensure_bucket_exists()
    _run_uploads(book_id, plan)


def _upload_single(book_id: str, chapters: list, file_path: Path, chapter_idx: int, dry_run: bool):
    if not file_path.exists():
        typer.echo(f"Error: file not found: {file_path}", err=True)
        raise typer.Exit(1)
    if not file_path.suffix.lower() == ".mp3":
        typer.echo("Error: file must be an .mp3 file.", err=True)
        raise typer.Exit(1)

    ch = next((c for c in chapters if c["idx"] == chapter_idx), None)
    if ch is None:
        valid = ", ".join(str(c["idx"]) for c in chapters)
        typer.echo(f"Error: chapter index {chapter_idx} not found. Valid indices: {valid}", err=True)
        raise typer.Exit(1)

    key = object_key(book_id, chapter_idx)
    if dry_run:
        console.print(f"[bold]DRY RUN:[/bold] Chapter {chapter_idx}: {file_path.name} → {key}")
        return

    ensure_bucket_exists()
    _run_uploads(book_id, [(ch, file_path)])


def _run_uploads(book_id: str, plan: list):
    failures = []
    with get_session() as db:
        for ch_data, file_path in plan:
            key = object_key(book_id, ch_data["idx"])
            try:
                upload_chapter(key, str(file_path))
                ch = db.query(Chapter).filter(Chapter.id == ch_data["id"]).first()
                if ch:
                    ch.audio_key = key
                console.print(f"  [green]↑[/green] Chapter {ch_data['idx']}: {file_path.name} → {key}")
            except Exception as e:
                failures.append(ch_data["idx"])
                console.print(f"  [red]✗[/red] Chapter {ch_data['idx']}: {e}", highlight=False)
        db.commit()

    n = len(plan)
    uploaded = n - len(failures)
    if failures:
        console.print(f"\n[yellow]{uploaded}/{n} chapters uploaded.[/yellow]")
        raise typer.Exit(1)
    else:
        console.print(f"\n[green]{uploaded}/{n} chapters uploaded.[/green]")
