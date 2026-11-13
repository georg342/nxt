"""Scraping -> dedup -> insert pipeline, with one isolated run per source."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import timedelta
from time import monotonic

from db.supabase import SupabaseError
from models.event import ScrapedEvent


@dataclass
class StageStats:
    found: int = 0
    parsed_ok: int = 0
    parse_errors: int = 0
    skipped_duplicates: int = 0
    inserted: int = 0
    insert_errors: int = 0
    duration_ms: int = 0


@dataclass
class RunResult:
    sources: dict[str, dict] = field(default_factory=dict)
    total: dict = field(default_factory=dict)
    failed_sources: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return asdict(self)


def _window(events: list[ScrapedEvent]) -> tuple[str, str]:
    start = min(event.start_datetime for event in events)
    end = max(event.start_datetime for event in events)
    return (
        (start - timedelta(days=1)).date().isoformat(),
        (end + timedelta(days=1)).date().isoformat(),
    )


def run_pipeline(
    sources,
    repo,
    logger,
    dry_run: bool = False,
    max_per_source: int | None = None,
) -> RunResult:
    """Run every source; a failure in one never stops the others."""
    result = RunResult()
    collected: list[ScrapedEvent] = []

    for source in sources:
        started = monotonic()
        stats = StageStats()
        source_log = logger.bind(source=source.name)
        source_log.info("source_start", event_stage="fetch", url=source.start_url)
        try:
            events = source.fetch()
        except Exception as exc:  # noqa: BLE001 - isolation is the point
            stats.duration_ms = int((monotonic() - started) * 1000)
            stats.parse_errors += 1
            result.failed_sources.append(source.name)
            source_log.error(
                "source_failed",
                event_stage="fetch",
                url=source.start_url,
                error_type=type(exc).__name__,
                error_message=str(exc),
                exc_info=True,
            )
            result.sources[source.name] = asdict(stats)
            source_log.info("summary", event_stage="summary", **asdict(stats))
            continue

        stats.found = len(events)
        stats.parsed_ok = len(events)
        stats.parse_errors = source.parse_errors
        if max_per_source:
            events = events[:max_per_source]
        collected.extend(events)

        stats.duration_ms = int((monotonic() - started) * 1000)
        result.sources[source.name] = asdict(stats)
        source_log.info("source_done", event_stage="fetch", events=len(events))

    index = None
    if collected:
        date_from, date_to = _window(collected)
        if repo is not None:
            try:
                index = repo.existing_events(date_from, date_to)
            except SupabaseError as exc:
                # Keep going: an unavailable dedup index means we only dedup
                # inside this run, so the insert step must stay in dry-run mode.
                logger.error(
                    "dedup_index_failed",
                    event_stage="dedup",
                    error_type=type(exc).__name__,
                    error_message=str(exc),
                    window=[date_from, date_to],
                )
                raise

    seen_hashes: set[str] = set()
    for event in collected:
        stats = result.sources[event.source]
        event_log = logger.bind(
            source=event.source,
            event_hash=event.dedup_hash,
            event_title=event.title,
        )

        duplicate = event.dedup_hash in seen_hashes or (
            index is not None
            and index.contains(event.title, event.start_date_key, event.source_url)
        )
        if duplicate:
            stats["skipped_duplicates"] += 1
            event_log.info(
                "duplicate_skipped",
                event_stage="dedup",
                start_date=event.start_date_key,
                url=event.source_url,
            )
            continue
        seen_hashes.add(event.dedup_hash)

        row = event.to_db_row()
        if dry_run or repo is None:
            event_log.info(
                "dry_run_event",
                event_stage="insert",
                start_date=event.start_date_key,
                location=row.get("location"),
                lineup=row.get("lineup"),
                url=row.get("link"),
                price=event.price,
                organizer=event.organizer,
            )
            continue

        try:
            repo.insert_event(row)
        except SupabaseError as exc:
            stats["insert_errors"] += 1
            event_log.error(
                "insert_failed",
                event_stage="insert",
                url=row.get("link"),
                error_type=type(exc).__name__,
                error_message=str(exc),
            )
            continue
        stats["inserted"] += 1

    total = StageStats()
    for stats in result.sources.values():
        for key in (
            "found",
            "parsed_ok",
            "parse_errors",
            "skipped_duplicates",
            "inserted",
            "insert_errors",
        ):
            setattr(total, key, getattr(total, key) + stats[key])
        total.duration_ms = max(total.duration_ms, stats["duration_ms"])
    result.total = asdict(total)

    logger.info(
        "summary",
        event_stage="summary",
        source="all",
        dry_run=dry_run,
        failed_sources=result.failed_sources,
        **result.total,
    )
    return result
