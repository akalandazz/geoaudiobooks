"""
Seed the database with the 12 books and their chapters.
Run with: python -m app.seed
"""
from app.database import SessionLocal, engine
from app import models

models.Base.metadata.create_all(bind=engine)

CHAPTER_TITLES = {
    "Literary": ["Prologue", "The First Map", "Tidewater", "Northern Reach", "Brine & Bone", "The Drowned Atlas", "Soundings", "What the Sea Keeps", "Meridian", "Epilogue"],
    "Thriller": ["Cold Open", "The Return", "Undertow", "Person of Interest", "The Witness", "Closing Ranks", "Pursuit", "The Reveal", "Reckoning", "Aftermath"],
    "Sci-Fi": ["Boot Sequence", "The Courier", "Lower Levels", "The File", "Syndicate", "Ghost Protocol", "Uplink", "The Wolves", "Override", "Daybreak"],
    "Romance": ["The Inheritance", "First Letter", "The Glasshouse", "Roots", "Correspondence", "Bloom", "Frost", "Unsigned", "The Last Letter", "Spring"],
    "Mystery": ["The Body", "Seventy-Two Hours", "The Witness", "Dry Sea", "Borderline", "The Manifest", "Interrogation", "Impossible", "The Inspector", "Closed"],
    "Nonfiction": ["Introduction", "Migration", "Magnetic North", "The Flyway", "Attention", "Loss", "Navigation", "Field Notes", "Homing", "Afterword"],
    "Fantasy": ["Overture", "The Conservatory", "The Last Singer", "Apprentice", "First Movement", "Ashfall", "The Sonata", "Crescendo", "Silence", "Coda"],
    "Adventure": ["The Factory", "Blueprints", "Launch Day", "Cardboard & Spite", "Orbit", "The Promise", "Re-Entry", "Return", "The Rocket", "Splashdown"],
    "Historical": ["The Workshop", "The Pigment", "Revolution", "Exile", "The Dock", "Inheritance", "Debt", "The Color", "Generations", "Vermillion"],
}

BOOKS = [
    {"id": "salt", "title": "The Salt Cartographer", "author": "Mira Vandel", "narrator": "Imogen Hale", "genre": "Literary", "duration_secs": 42120, "rating_avg": 4.8, "reviews_count": 2841, "price": 18.99, "palette": ["#1b3a4b", "#3b6978", "#c9d6c5"], "motif": "lines", "year": 2025, "tags": ["Literary", "Mystery", "Atmospheric"], "blurb": "A reclusive mapmaker is hired to chart a coastline that refuses to stay still. As tides rewrite the land each night, she begins to suspect the sea is keeping a record of its own — and that her own past is drawn somewhere in its margins."},
    {"id": "hollow", "title": "Hollow Tide", "author": "J. R. Okonkwo", "narrator": "Daniel Voss", "genre": "Thriller", "duration_secs": 33480, "rating_avg": 4.6, "reviews_count": 5120, "price": 16.99, "palette": ["#0b1b2b", "#16425b", "#2e6f95"], "motif": "wave", "year": 2024, "tags": ["Thriller", "Crime", "Suspense"], "blurb": "When a detective returns to the fishing town that raised her, a string of disappearances pulls her back into the undertow of a case everyone wanted forgotten. The closer she gets to the truth, the more the town closes ranks."},
    {"id": "neon", "title": "Neon Wolves", "author": "Dax Pereira", "narrator": "Reyna Cole", "genre": "Sci-Fi", "duration_secs": 47100, "rating_avg": 4.7, "reviews_count": 3960, "price": 19.99, "palette": ["#1a0b2e", "#6b1f8a", "#e94bd0"], "motif": "grid", "year": 2025, "tags": ["Sci-Fi", "Cyberpunk", "Action"], "blurb": "In a megacity that sells dreams by the hour, a courier of illegal memories stumbles onto a file that could topple the syndicates. To survive the night, she'll have to outrun the very wolves she used to run with."},
    {"id": "glass", "title": "The Glasshouse Letters", "author": "Elena Sorokin", "narrator": "Cora Whitfield", "genre": "Romance", "duration_secs": 31860, "rating_avg": 4.5, "reviews_count": 4310, "price": 15.99, "palette": ["#3a1220", "#8a3346", "#e8b7a0"], "motif": "soft", "year": 2023, "tags": ["Romance", "Historical", "Drama"], "blurb": "Two strangers inherit a derelict botanical garden — and a box of unsigned love letters written fifty years apart. Restoring the glasshouse, they begin a correspondence of their own, unsure where the old story ends and theirs begins."},
    {"id": "aralsk", "title": "Midnight in Aralsk", "author": "Tomas Breza", "narrator": "Anton Marek", "genre": "Mystery", "duration_secs": 37620, "rating_avg": 4.6, "reviews_count": 1980, "price": 17.99, "palette": ["#10131c", "#26324a", "#5b6b8c"], "motif": "lines", "year": 2024, "tags": ["Mystery", "Noir", "Cold War"], "blurb": "A rusting ship sits in the middle of a vanished sea, and inside it, a body that shouldn't exist. A disgraced inspector has seventy-two hours and one unreliable witness to explain the impossible before the border closes."},
    {"id": "birds", "title": "A Theory of Birds", "author": "Naomi Aldous", "narrator": "Naomi Aldous", "genre": "Nonfiction", "duration_secs": 27180, "rating_avg": 4.4, "reviews_count": 1240, "price": 14.99, "palette": ["#14301f", "#2f6b46", "#a8d5b5"], "motif": "soft", "year": 2025, "tags": ["Nonfiction", "Science", "Memoir"], "blurb": "Part field journal, part memoir, a naturalist traces a decade spent following migrations across four continents — and what the impossible navigation of birds taught her about grief, attention, and finding the way home."},
    {"id": "machine", "title": "The Quiet Machine", "author": "Cyrus Mbeki", "narrator": "Theo Adeyemi", "genre": "Sci-Fi", "duration_secs": 44040, "rating_avg": 4.9, "reviews_count": 6720, "price": 21.99, "palette": ["#0a0f14", "#1f2d3a", "#4fd1c5"], "motif": "grid", "year": 2026, "tags": ["Sci-Fi", "Literary", "AI"], "blurb": "The first machine to pass for human did not announce itself. It took a job, made a friend, and waited. Told across three voices and forty years, this is the story of the quietest revolution in history."},
    {"id": "ashfall", "title": "Ashfall Sonata", "author": "Lina Caldera", "narrator": "Beatrix Lund", "genre": "Fantasy", "duration_secs": 56340, "rating_avg": 4.8, "reviews_count": 5540, "price": 22.99, "palette": ["#2a0e0e", "#7a2418", "#e7762f"], "motif": "wave", "year": 2025, "tags": ["Fantasy", "Epic", "Adventure"], "blurb": "A volcano has slept beneath the conservatory for a thousand years, lulled by an unbroken song. When the last singer dies mid-note, an untrained apprentice must learn the sonata that holds back the ash — before the silence finishes it."},
    {"id": "paper", "title": "Paper Astronauts", "author": "Wendell Hsu", "narrator": "Min-jun Park", "genre": "Adventure", "duration_secs": 24420, "rating_avg": 4.3, "reviews_count": 990, "price": 13.99, "palette": ["#0d1b2a", "#2a4d6e", "#f0c987"], "motif": "soft", "year": 2024, "tags": ["Adventure", "Coming of Age", "YA"], "blurb": "The summer the factory closed, four kids built a spaceship out of cardboard, spite, and a stolen physics textbook. Decades later, one of them returns to find the rocket still standing — and a promise still owed."},
    {"id": "vermillion", "title": "Vermillion", "author": "Anya Petrova", "narrator": "Sasha Ivanov", "genre": "Historical", "duration_secs": 50520, "rating_avg": 4.7, "reviews_count": 3120, "price": 20.99, "palette": ["#2b0a14", "#5e1126", "#c83e4d"], "motif": "lines", "year": 2023, "tags": ["Historical", "Saga", "War"], "blurb": "A pigment worth more than gold binds three generations of a dye-making family across revolution and exile. From a Venetian workshop to a Shanghai dock, Vermillion is a sweeping saga of color, debt, and inheritance."},
    {"id": "lighthouse", "title": "The Last Lighthouse", "author": "Saoirse Doyle", "narrator": "Fiona Brennan", "genre": "Literary", "duration_secs": 35760, "rating_avg": 4.6, "reviews_count": 2210, "price": 17.49, "palette": ["#0c1f2c", "#1d4e63", "#e6c35c"], "motif": "wave", "year": 2025, "tags": ["Literary", "Family", "Coastal"], "blurb": "The automation order arrives the same week as the storm. The last keeper of a soon-obsolete light must decide what to save from a life measured in beams and fog signals — and whether the daughter he lost can still find her way back."},
    {"id": "cobalt", "title": "Cobalt", "author": "Marcus Vale", "narrator": "Errol Banks", "genre": "Thriller", "duration_secs": 29340, "rating_avg": 4.5, "reviews_count": 4480, "price": 16.49, "palette": ["#06121f", "#0f3057", "#2978b5"], "motif": "grid", "year": 2026, "tags": ["Thriller", "Techno", "Espionage"], "blurb": "A battery breakthrough worth trillions goes missing in the forty minutes between a lab and a boardroom. The analyst who flagged the anomaly becomes the only person both sides want silenced — and the only one who knows where it went."},
]


def make_chapters(book_id: str, genre: str, duration_secs: int):
    titles = CHAPTER_TITLES.get(genre, CHAPTER_TITLES["Literary"])
    n = len(titles)
    base = duration_secs // n
    acc = 0
    chapters = []
    for i, title in enumerate(titles):
        length = (duration_secs - acc) if i == n - 1 else base + (i % 3) * 180
        chapters.append(models.Chapter(
            book_id=book_id,
            idx=i,
            title=title if i == 0 else f"{i}. {title}",
            length_secs=length,
            start_secs=acc,
        ))
        acc += length
    return chapters


def seed():
    db = SessionLocal()
    try:
        if db.query(models.Book).count() > 0:
            print("Database already seeded.")
            return

        for data in BOOKS:
            book = models.Book(**data)
            db.add(book)
            for chapter in make_chapters(data["id"], data["genre"], data["duration_secs"]):
                db.add(chapter)

        db.commit()
        print(f"Seeded {len(BOOKS)} books with chapters.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
