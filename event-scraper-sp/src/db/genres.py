"""Maps scraped genre names onto `public.genres`, creating what is missing.

A name that is not in the catalog becomes a child of an existing parent when it
contains that parent's words ("hard techno" -> Techno); otherwise it becomes a
new parent with a color derived from its own name, so the same genre always
lands on the same color.
"""

from __future__ import annotations

import hashlib
import re

from models.event import normalize_for_match

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def genre_key(value: str) -> str:
    """Comparison key: accent/case insensitive, `-` and `/` read as spaces."""
    return normalize_for_match(value).replace("-", " ").replace("/", " ")


def slugify(value: str) -> str:
    return _NON_ALNUM.sub("-", normalize_for_match(value)).strip("-")


def _hsl_to_hex(hue: float, saturation: float, lightness: float) -> str:
    a = (saturation / 100) * min(lightness / 100, 1 - lightness / 100)
    channels = []
    for n in (0, 8, 4):
        k = (n + hue / 30) % 12
        value = lightness / 100 - a * max(-1, min(k - 3, 9 - k, 1))
        channels.append(round(255 * value))
    return "#" + "".join(f"{channel:02X}" for channel in channels)


def genre_color(name: str) -> str:
    """Stable hex color for a new parent genre, derived from its own name."""
    digest = hashlib.sha256(name.casefold().encode("utf-8")).hexdigest()
    return _hsl_to_hex(int(digest[:8], 16) % 360, 75, 60)


class GenreCatalog:
    """In-memory index of `genres`, loaded once per run."""

    def __init__(self, rows: list[dict] | None = None) -> None:
        self._ids: dict[str, str] = {}
        self._parents: list[tuple[str, str]] = []
        for row in rows or []:
            self.add(row)

    def add(self, row: dict) -> None:
        name_key = genre_key(row.get("name") or "")
        if name_key:
            self._ids[name_key] = row["id"]
        slug_key = genre_key(row.get("slug") or "")
        if slug_key:
            self._ids.setdefault(slug_key, row["id"])
        if name_key and not row.get("parent_id"):
            self._parents.append((name_key, row["id"]))

    def resolve(self, name: str, repo) -> str | None:
        """Existing id for `name`, or a new genre created through `repo`."""
        key = genre_key(name)
        if not key:
            return None
        if key in self._ids:
            return self._ids[key]

        tokens = set(key.split())
        parent = max(
            (candidate for candidate in self._parents if set(candidate[0].split()) <= tokens),
            key=lambda candidate: len(candidate[0]),
            default=None,
        )
        row = repo.create_genre(
            {
                "name": name,
                "slug": slugify(name),
                "parent_id": parent[1] if parent else None,
                "color": None if parent else genre_color(name),
            }
        )
        self.add(row)
        return row.get("id")
