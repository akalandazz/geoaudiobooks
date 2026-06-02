from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from sqlalchemy import func

from booksmanager.db import get_session
from booksmanager.models import Book, Chapter

console = Console()


def list_books(
    genre: Optional[str] = typer.Option(None, "--genre", help="Filter by genre"),
    missing_audio: bool = typer.Option(
        False, "--missing-audio", help="Only show books with at least one chapter missing audio"
    ),
):
    """List all audiobooks in the database."""
    with get_session() as db:
        q = db.query(Book)
        if genre:
            q = q.filter(Book.genre == genre)
        books = q.order_by(Book.title).all()

        if not books:
            typer.echo("No books found.")
            return

        totals = dict(
            db.query(Chapter.book_id, func.count(Chapter.id)).group_by(Chapter.book_id).all()
        )
        uploaded = dict(
            db.query(Chapter.book_id, func.count(Chapter.id))
            .filter(Chapter.audio_key.isnot(None))
            .group_by(Chapter.book_id)
            .all()
        )

    if missing_audio:
        books = [b for b in books if uploaded.get(b.id, 0) < totals.get(b.id, 0)]
        if not books:
            typer.echo("All books have complete audio.")
            return

    table = Table(show_header=True, header_style="bold")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Title")
    table.add_column("Author", style="dim")
    table.add_column("Genre")
    table.add_column("Price", justify="right")
    table.add_column("Audio", justify="right")

    for b in books:
        total = totals.get(b.id, 0)
        up = uploaded.get(b.id, 0)
        if total == 0:
            audio_str = "[dim]—[/dim]"
        elif up == total:
            audio_str = f"[green]{up}/{total}[/green]"
        elif up > 0:
            audio_str = f"[yellow]{up}/{total}[/yellow]"
        else:
            audio_str = f"[red]{up}/{total}[/red]"

        table.add_row(b.id, b.title, b.author, b.genre, f"${b.price:.2f}", audio_str)

    console.print(table)
    console.print(f"\nTotal: {len(books)} book{'s' if len(books) != 1 else ''}")
