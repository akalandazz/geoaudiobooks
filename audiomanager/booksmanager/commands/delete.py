import typer
from rich.console import Console
from sqlalchemy.exc import IntegrityError

from booksmanager.config import settings
from booksmanager.db import get_session
from booksmanager.models import Book

console = Console()


def delete(
    book_id: str = typer.Argument(..., help="Book slug ID"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation prompt"),
):
    """Delete an audiobook and all its chapters from the database."""
    with get_session() as db:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            typer.echo(f"Error: book '{book_id}' not found.", err=True)
            raise typer.Exit(1)

        n_chapters = len(book.chapters)
        title = book.title

        if not yes:
            confirmed = typer.confirm(
                f"Delete '{title}' ({book_id}) and all {n_chapters} chapters?",
                default=False,
            )
            if not confirmed:
                typer.echo("Aborted.")
                return

        try:
            db.delete(book)
            db.commit()
        except IntegrityError:
            db.rollback()
            typer.echo(
                f"Error: cannot delete '{book_id}' — it is referenced by existing orders or user libraries. "
                "Remove those records first.",
                err=True,
            )
            raise typer.Exit(1)

    console.print(f"[green]Deleted: {title} ({book_id})[/green]")
    console.print(
        f"[dim]Note: audio files in MinIO were not deleted. "
        f"Remove them manually from bucket '{settings.minio_bucket}' under prefix '{book_id}/'.[/dim]"
    )
