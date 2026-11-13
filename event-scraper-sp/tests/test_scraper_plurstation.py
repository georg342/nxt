from datetime import datetime

from models.event import normalize_for_match
from scrapers.base import SAO_PAULO
from scrapers.plurstation import PlurstationScraper

SP_CITIES = {"sao paulo", "carapicuiba"}


def parse(html: str, allowlist=SP_CITIES):
    scraper = PlurstationScraper(fetcher=None, logger=None, city_allowlist=allowlist)
    return scraper.parse(html, now=datetime(2026, 11, 13, 12, 0, tzinfo=SAO_PAULO))


def test_parse_listing_extracts_sp_events(fixture_html):
    events = parse(fixture_html("plurstation", "listing.html"))

    assert events, "fixture has São Paulo cards"
    for event in events:
        assert event.source == "plurstation"
        assert event.source_url.startswith("https://plurstation.com.br/evento/")
        assert normalize_for_match(event.city or "") in SP_CITIES
        assert event.city != "Porto Alegre"


def test_parse_listing_reads_image_and_location(fixture_html):
    events = parse(fixture_html("plurstation", "listing.html"))
    first = events[0]
    assert first.image_url and first.image_url.startswith("https://")
    assert first.venue and not first.venue.startswith("·")
    assert first.location_line


def test_city_filter_skips_everything_when_allowlist_is_empty(fixture_html):
    html = fixture_html("plurstation", "listing.html")
    strict = parse(html, allowlist={"curitiba"})
    assert strict == []


def test_date_range_is_parsed(fixture_html):
    events = parse(fixture_html("plurstation", "listing.html"), allowlist=set())
    ranged = [event for event in events if event.end_datetime]
    assert ranged, "fixture has events with a date range"
    for event in ranged:
        assert event.end_datetime > event.start_datetime


def test_unparseable_date_increments_parse_errors():
    html = """
    <article class="event-entry">
      <h3><a href="/evento/1/x">Sem data</a></h3>
      <div class="event-date">em breve</div>
      <p class="event-location">São Paulo<span class="venue">· Club</span></p>
    </article>
    """
    scraper = PlurstationScraper(fetcher=None, logger=None, city_allowlist=set())
    events = scraper.parse(html)
    assert events == []
    assert scraper.parse_errors == 1


def test_single_date_without_range():
    scraper = PlurstationScraper(fetcher=None, logger=None)
    parsed = scraper._parse_dates("13 de nov. de 2026 01:00")
    assert parsed is not None
    start, end = parsed
    assert start.hour == 1 and end is None


def test_unknown_month_is_rejected():
    scraper = PlurstationScraper(fetcher=None, logger=None)
    assert scraper._parse_dates("13 de xxx. de 2026 01:00") is None
