from datetime import datetime

import pytest

from db.supabase import ExistingEvents, SupabaseError
from models.event import ScrapedEvent
from pipeline import run_pipeline
from scrapers.base import SAO_PAULO


def make_event(title: str, day: int = 13, url: str = "https://src/1") -> ScrapedEvent:
    return ScrapedEvent(
        source="fake",
        title=title,
        source_url=url,
        start_datetime=datetime(2026, 11, day, 23, 0, tzinfo=SAO_PAULO),
        venue="Club",
        city="São Paulo",
    )


class FakeSource:
    name = "fake"
    start_url = "https://src/events"

    def __init__(self, events=None, error: Exception | None = None) -> None:
        self.events = events or []
        self.error = error
        self.parse_errors = 0

    def fetch(self):
        if self.error:
            raise self.error
        return self.events


class FakeRepo:
    def __init__(self, index: ExistingEvents | None = None, fail_titles: set[str] | None = None):
        self.index = index or ExistingEvents()
        self.fail_titles = fail_titles or set()
        self.inserted: list[dict] = []

    def existing_events(self, date_from, date_to):
        return self.index

    def insert_event(self, row):
        if row["title"] in self.fail_titles:
            raise SupabaseError("boom")
        self.inserted.append(row)
        return {"id": f"id-{len(self.inserted)}"}


def test_inserts_new_events(recording_logger):
    repo = FakeRepo()
    source = FakeSource([make_event("A"), make_event("B", day=14, url="https://src/2")])

    result = run_pipeline([source], repo, recording_logger)

    assert len(repo.inserted) == 2
    assert result.total["inserted"] == 2
    assert result.total["skipped_duplicates"] == 0
    assert all(row["status"] == "pending" for row in repo.inserted)


def test_skips_duplicates_within_the_same_run(recording_logger):
    repo = FakeRepo()
    source = FakeSource([make_event("A"), make_event("A")])

    result = run_pipeline([source], repo, recording_logger)

    assert len(repo.inserted) == 1
    assert result.total["skipped_duplicates"] == 1
    assert "duplicate_skipped" in recording_logger.messages("info")


def test_skips_events_already_in_the_database(recording_logger):
    index = ExistingEvents(links={"https://src/1"})
    repo = FakeRepo(index=index)
    source = FakeSource([make_event("A")])

    result = run_pipeline([source], repo, recording_logger)

    assert repo.inserted == []
    assert result.total["skipped_duplicates"] == 1


def test_one_failing_source_does_not_stop_the_others(recording_logger):
    good = FakeSource([make_event("Boa")])
    bad = FakeSource(error=RuntimeError("site fora do ar"))
    bad.name = "quebrada"

    result = run_pipeline([bad, good], FakeRepo(), recording_logger)

    assert result.failed_sources == ["quebrada"]
    assert result.total["inserted"] == 1
    errors = recording_logger.messages("error")
    assert "source_failed" in errors


def test_insert_error_is_counted_and_logged(recording_logger):
    repo = FakeRepo(fail_titles={"Ruim"})
    source = FakeSource([make_event("Ruim"), make_event("Boa", day=14, url="https://src/2")])

    result = run_pipeline([source], repo, recording_logger)

    assert result.total["insert_errors"] == 1
    assert result.total["inserted"] == 1
    assert "insert_failed" in recording_logger.messages("error")


def test_dry_run_never_calls_insert(recording_logger):
    repo = FakeRepo()
    source = FakeSource([make_event("A")])

    result = run_pipeline([source], repo, recording_logger, dry_run=True)

    assert repo.inserted == []
    assert result.total["inserted"] == 0
    assert "dry_run_event" in recording_logger.messages("info")


def test_dry_run_without_repo_still_dedups_locally(recording_logger):
    source = FakeSource([make_event("A"), make_event("A")])

    result = run_pipeline([source], repo=None, logger=recording_logger, dry_run=True)

    assert result.total["skipped_duplicates"] == 1


def test_max_per_source_limits_collected_events(recording_logger):
    repo = FakeRepo()
    source = FakeSource(
        [make_event("A"), make_event("B", day=14, url="https://src/2"), make_event("C", day=15, url="https://src/3")]
    )

    result = run_pipeline([source], repo, recording_logger, max_per_source=2)

    assert result.total["found"] == 3
    assert result.total["inserted"] == 2


def test_parse_errors_from_source_are_reported(recording_logger):
    source = FakeSource([make_event("A")])
    source.parse_errors = 2

    result = run_pipeline([source], FakeRepo(), recording_logger)

    assert result.total["parse_errors"] == 2


def test_dedup_index_failure_propagates(recording_logger):
    class BrokenRepo(FakeRepo):
        def existing_events(self, date_from, date_to):
            raise SupabaseError("indisponível")

    with pytest.raises(SupabaseError):
        run_pipeline([FakeSource([make_event("A")])], BrokenRepo(), recording_logger)
