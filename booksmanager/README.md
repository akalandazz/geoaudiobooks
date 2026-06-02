# booksmanager

CLI tool for managing audiobooks on GeoAudiobooks — adds books to the database and uploads audio files to MinIO.

## Install

```powershell
cd booksmanager
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
```

Reads `backend/.env` automatically. No extra config needed for local dev.

## Commands

```
booksmanager add <book.yaml>                              Add a book and upload its audio
booksmanager add <book.yaml> --dry-run                    Validate and preview without writing
booksmanager list                                         List all books with audio status
booksmanager list --missing-audio                         Only books with missing audio
booksmanager show <id>                                    Book details and per-chapter audio status
booksmanager upload <id> --dir <dir>                      Bulk re-upload MP3s for a book
booksmanager upload <id> --file <f> --chapter <n>         Upload a single chapter
booksmanager delete <id>                                  Delete a book (prompts for confirmation)
```

## Book YAML format

```yaml
id: "my-book"           # slug, used as MinIO prefix (e.g. my-book/000.mp3)
title: "My Book Title"
author: "Author Name"
narrator: "Narrator Name"
genre: "Literary"
price: 17.99
year: 2025
tags: ["Literary", "Atmospheric"]
blurb: "A short description."
palette: ["#1b3a4b", "#3b6978", "#c9d6c5"]   # exactly 3 hex colors
motif: "lines"                                 # lines | wave | grid | soft

chapters:
  - title: "Prologue"
    length_secs: 1800
    audio_file: "./audio/000.mp3"   # relative to this YAML file
  - title: "1. The Journey Begins"
    length_secs: 3600
    audio_file: "./audio/001.mp3"
```

`duration_secs` is computed automatically from the sum of chapter lengths.

## Audio storage

Files are stored in MinIO bucket `audiobooks` under `{book-id}/{idx:03d}.mp3` (e.g. `my-book/000.mp3`). The backend streams audio via pre-signed URLs.
