"""CLI entrypoint: `python src/main.py` (from the `event-scraper-sp` directory)."""

from __future__ import annotations

import argparse
import sys
import uuid

import structlog

from config import Settings
from db.supabase import SupabaseError, SupabaseEventsRepository
from logging_config import configure_logging, get_logger
from pipeline import run_pipeline
from scrapers.http import HttpFetcher
from scrapers.plurstation import PlurstationScraper
from scrapers.technoairlines import TechnoAirlinesScraper


def build_scrapers(settings: Settings, fetcher: HttpFetcher, logger) -> list:
    registry = {
        "technoairlines": lambda: TechnoAirlinesScraper(
            fetcher,
            logger,
            enrich=settings.technoairlines_enrich,
            max_enrich=settings.technoairlines_max_enrich,
        ),
        "plurstation": lambda: PlurstationScraper(
            fetcher, logger, city_allowlist=settings.city_allowlist
        ),
    }

    scrapers = []
    for name in settings.source_names:
        factory = registry.get(name)
        if factory is None:
            logger.error(
                "unknown_source",
                event_stage="fetch",
                source=name,
                known=sorted(registry),
            )
            continue
        scrapers.append(factory())
    return scrapers


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape electronic music events in São Paulo into WNXT's Supabase."
    )
    parser.add_argument("--dry-run", action="store_true", help="scrape and log, never write")
    parser.add_argument("--sources", help="comma separated subset of sources")
    parser.add_argument("--limit", type=int, help="max events per source")
    parser.add_argument("--no-enrich", action="store_true", help="skip detail pages")
    parser.add_argument("--log-level", help="DEBUG|INFO|WARNING|ERROR")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    settings = Settings()
    if args.dry_run:
        settings.dry_run = True
    if args.sources:
        settings.sources = args.sources
    if args.limit:
        settings.max_events_per_source = args.limit
    if args.no_enrich:
        settings.technoairlines_enrich = False
    if args.log_level:
        settings.log_level = args.log_level.upper()

    run_id = str(uuid.uuid4())
    log_path = configure_logging(settings.log_level, settings.log_dir, run_id)
    structlog.contextvars.bind_contextvars(run_id=run_id)
    logger = get_logger("main")

    logger.info(
        "run_start",
        event_stage="summary",
        source="all",
        dry_run=settings.dry_run,
        sources=settings.source_names,
        log_file=str(log_path),
    )

    repo = None
    fetcher = None
    try:
        if not settings.dry_run:
            settings.require_supabase()
            repo = SupabaseEventsRepository(
                settings.supabase_url,
                settings.supabase_service_role_key,
                logger=get_logger("supabase"),
            )

        fetcher = HttpFetcher(
            user_agent=settings.scraper_user_agent,
            timeout=settings.request_timeout_seconds,
            delay=settings.request_delay_seconds,
            max_retries=settings.max_retries,
            logger=get_logger("http"),
        )
        sources = build_scrapers(settings, fetcher, logger)
        if not sources:
            logger.error("no_sources_selected", event_stage="summary", source="all")
            return 2

        result = run_pipeline(
            sources,
            repo=repo,
            logger=logger,
            dry_run=settings.dry_run,
            max_per_source=settings.max_events_per_source,
        )
    except SupabaseError as exc:
        logger.error(
            "run_failed",
            event_stage="insert",
            source="supabase",
            error_type=type(exc).__name__,
            error_message=str(exc),
        )
        return 1
    except Exception as exc:  # noqa: BLE001 - top level must log, never swallow
        logger.error(
            "run_crashed",
            event_stage="summary",
            source="all",
            error_type=type(exc).__name__,
            error_message=str(exc),
            exc_info=True,
        )
        return 1
    finally:
        if fetcher is not None:
            fetcher.close()
        if repo is not None:
            repo.close()

    logger.info("run_end", event_stage="summary", source="all", log_file=str(log_path))
    has_failures = bool(result.failed_sources) or result.total.get("insert_errors", 0) > 0
    return 1 if has_failures else 0


if __name__ == "__main__":
    sys.exit(main())
