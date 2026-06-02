import typer

from booksmanager.commands.add import add
from booksmanager.commands.delete import delete
from booksmanager.commands.list_books import list_books
from booksmanager.commands.show import show
from booksmanager.commands.upload import upload

app = typer.Typer(
    name="booksmanager",
    help="GeoAudiobooks content management CLI — add, list, show, upload, and delete audiobooks.",
    no_args_is_help=True,
)

app.command("add")(add)
app.command("list")(list_books)
app.command("show")(show)
app.command("upload")(upload)
app.command("delete")(delete)

if __name__ == "__main__":
    app()
