import typer
from rich.console import Console
from rich.table import Table

from booksmanager.db import get_session
from booksmanager.models import Book

console = Console()


def show(book_id: str = typer.Argument(..., help="Book slug ID")):
    """Show details for a single audiobook including chapter audio status."""
    with get_session() as db:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            typer.echo(f"Error: book '{book_id}' not found.", err=True)
            raise typer.Exit(1)

        chapters = sorted(book.chapters, key=lambda c: c.idx)
        # Extract data while session is open
        book_data = {
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "narrator": book.narrator,
            "genre": book.genre,
            "year": book.year,
            "price": book.price,
            "duration_secs": book.duration_secs,
            "rating_avg": book.rating_avg,
            "reviews_count": book.reviews_count,
            "tags": list(book.tags or []),
            "blurb": book.blurb or "",
        }
        ch_rows = [
            {
                "idx": c.idx,
                "title": c.title,
                "start_secs": c.start_secs,
                "length_secs": c.length_secs,
                "audio_key": c.audio_key,
            }
            for c in chapters
        ]

    console.print(f"\n[bold]{book_data['title']}[/bold]  [dim]({book_data['id']})[/dim]")
    console.print(f"  Author   : {book_data['author']}")
    console.print(f"  Narrator : {book_data['narrator'] or '[dim]—[/dim]'}")
    console.print(f"  Genre    : {book_data['genre']}")
    console.print(f"  Year     : {book_data['year']}")
    console.print(f"  Price    : ${book_data['price']:.2f}")
    console.print(f"  Duration : {_fmt_duration(book_data['duration_secs'])}")
    console.print(f"  Rating   : {book_data['rating_avg']} ({book_data['reviews_count']} reviews)")
    if book_data["tags"]:
        console.print(f"  Tags     : {', '.join(book_data['tags'])}")
    if book_data["blurb"]:
        blurb = book_data["blurb"]
        console.print(f"  Blurb    : {blurb[:120]}{'...' if len(blurb) > 120 else ''}")

    if not ch_rows:
        console.print("\n[dim]No chapters.[/dim]")
        return

    table = Table(show_lines=False, header_style="bold")
    table.add_column("#", style="dim", width=4)
    table.add_column("Title")
    table.add_column("Start", justify="right")
    table.add_column("Length", justify="right")
    table.add_column("Audio", justify="center")

    for c in ch_rows:
        audio_col = "[green]✓[/green]" if c["audio_key"] else "[red]✗[/red]"
        table.add_row(
            str(c["idx"]),
            c["title"],
            _fmt_hms(c["start_secs"]),
            _fmt_ms(c["length_secs"]),
            audio_col,
        )

    uploaded = sum(1 for c in ch_rows if c["audio_key"])
    console.print()
    console.print(table)
    console.print(f"\nAudio: {uploaded}/{len(ch_rows)} chapters uploaded")


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
