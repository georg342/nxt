import re

from db.genres import GenreCatalog, genre_color, genre_key, slugify

TECHNO = {
    "id": "techno-id",
    "name": "Techno",
    "slug": "techno",
    "color": "#5CE1E6",
    "parent_id": None,
}
HOUSE = {
    "id": "house-id",
    "name": "House",
    "slug": "house",
    "color": "#FF914D",
    "parent_id": None,
}


class FakeRepo:
    def __init__(self) -> None:
        self.created: list[dict] = []

    def create_genre(self, row: dict) -> dict:
        self.created.append(row)
        return {"id": f"new-{len(self.created)}", **row}


def test_existing_genre_matches_case_and_slug():
    repo = FakeRepo()
    catalog = GenreCatalog([TECHNO, HOUSE])

    assert catalog.resolve("techno", repo) == "techno-id"
    assert catalog.resolve("TECHNO", repo) == "techno-id"
    assert catalog.resolve("house", repo) == "house-id"
    assert repo.created == []


def test_missing_genre_becomes_a_child_of_a_matching_parent():
    repo = FakeRepo()
    catalog = GenreCatalog([TECHNO, HOUSE])

    genre_id = catalog.resolve("Hard Techno", repo)

    assert genre_id == "new-1"
    assert repo.created[0]["parent_id"] == "techno-id"
    assert repo.created[0]["color"] is None
    assert repo.created[0]["slug"] == "hard-techno"


def test_unknown_genre_becomes_a_parent_with_a_new_color():
    repo = FakeRepo()
    catalog = GenreCatalog([TECHNO])

    catalog.resolve("Phonk", repo)

    row = repo.created[0]
    assert row["parent_id"] is None
    assert re.match(r"^#[0-9A-F]{6}$", row["color"])
    assert row["slug"] == "phonk"


def test_resolving_the_same_name_twice_creates_it_once():
    repo = FakeRepo()
    catalog = GenreCatalog([TECHNO])

    first = catalog.resolve("Phonk", repo)
    second = catalog.resolve("phonk", repo)

    assert first == second == "new-1"
    assert len(repo.created) == 1


def test_genre_color_is_stable_per_name():
    assert genre_color("Phonk") == genre_color("phonk")
    assert genre_color("Phonk") != genre_color("Ambient")


def test_genre_key_ignores_accents_and_case():
    assert genre_key("Drum & Bass") == genre_key("drum & bass")
    assert genre_key("Techno") == genre_key("techno")
    assert slugify("Drum & Bass") == "drum-bass"
    assert slugify("Minimal / Deep Tech") == "minimal-deep-tech"


def test_name_and_slug_both_resolve_to_the_same_genre():
    repo = FakeRepo()
    catalog = GenreCatalog(
        [
            {
                "id": "dnb",
                "name": "Drum & Bass",
                "slug": "drum-and-bass",
                "color": "#FB7185",
                "parent_id": None,
            }
        ]
    )

    assert catalog.resolve("Drum & Bass", repo) == "dnb"
    assert catalog.resolve("drum-and-bass", repo) == "dnb"
    assert repo.created == []
