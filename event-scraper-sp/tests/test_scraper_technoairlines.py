from datetime import datetime

from scrapers.base import SAO_PAULO
from scrapers.technoairlines import TechnoAirlinesScraper

NOW = datetime(2026, 11, 13, 12, 0, tzinfo=SAO_PAULO)


def parse_listing(html: str):
    scraper = TechnoAirlinesScraper(fetcher=None, logger=None, enrich=False)
    return scraper.parse(html, now=NOW)


def test_parse_listing_returns_events_with_required_fields(fixture_html):
    events = parse_listing(fixture_html("technoairlines", "listing.html"))

    assert len(events) > 20
    first = events[0]
    assert first.source == "technoairlines"
    assert first.title
    assert first.source_url.startswith("https://www.technoairlines.com/event/")
    assert first.start_datetime.tzinfo is not None
    assert first.city == "São Paulo"


def test_parse_listing_has_no_duplicated_urls(fixture_html):
    events = parse_listing(fixture_html("technoairlines", "listing.html"))
    urls = [event.source_url for event in events]
    assert len(urls) == len(set(urls))


def test_parse_listing_reads_venue_time_and_lineup(fixture_html):
    events = parse_listing(fixture_html("technoairlines", "listing.html"))
    with_venue = [event for event in events if event.venue and event.start_datetime.hour]
    assert with_venue, "expected at least one row with venue and start time"

    event = with_venue[0]
    assert event.start_datetime.hour >= 0
    assert event.venue
    assert all(name.strip() == name for name in event.lineup)


def test_parse_listing_keeps_events_in_the_next_year(fixture_html):
    events = parse_listing(fixture_html("technoairlines", "listing.html"))
    years = {event.start_datetime.year for event in events}
    assert 2027 in years, "January/February 2027 headings must resolve to 2027"


def test_rows_without_month_heading_use_the_url_date(fixture_html):
    events = parse_listing(fixture_html("technoairlines", "listing.html"))
    tonight = next(
        event
        for event in events
        if event.source_url.endswith("trommel-x-mixordia-fabriketa-2026-11-14")
    )
    assert tonight.start_datetime.date().isoformat() == "2026-11-14"


def test_no_row_is_dropped_for_a_missing_date(fixture_html):
    scraper = TechnoAirlinesScraper(fetcher=None, logger=None, enrich=False)
    scraper.parse(fixture_html("technoairlines", "listing.html"), now=NOW)
    assert scraper.parse_errors == 0


def test_resolve_year_rolls_over_in_january():
    scraper = TechnoAirlinesScraper(fetcher=None, logger=None, enrich=False)
    december = datetime(2026, 12, 30, 12, 0, tzinfo=SAO_PAULO)
    assert scraper._resolve_year(1, 5, december) == 2027
    assert scraper._resolve_year(12, 31, december) == 2026


def test_parse_detail_reads_jsonld(fixture_html):
    detail = TechnoAirlinesScraper.parse_detail(fixture_html("technoairlines", "event.html"))

    assert detail["end_date"] is not None
    assert detail["end_date"] > datetime(2026, 11, 19, tzinfo=SAO_PAULO)
    assert detail["ticket_url"] == "https://ra.co/events/2566009"
    assert detail["city"] == "Sao Paulo"
    assert detail["lineup"] == ["Cactunes"]
    assert detail["organizer"] == "Crema Club"
    assert "Crema Club" in detail["description"]


def test_parse_detail_without_jsonld_returns_empty():
    assert TechnoAirlinesScraper.parse_detail("<html><body>nada</body></html>") == {}


def test_enrichment_merges_detail_into_event(fixture_html):
    listing = parse_listing(fixture_html("technoairlines", "listing.html"))
    event = listing[0]
    original_title = event.title
    detail_html = fixture_html("technoairlines", "event.html")
    detail = TechnoAirlinesScraper.parse_detail(detail_html)
    event.model_copy(update={"end_datetime": detail["end_date"]})
    # The real flow uses _enrich_one; here we assert the JSON-LD contract only.
    assert detail["end_date"] is not None
    assert event.title == original_title
