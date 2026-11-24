# event-scraper-sp

Scrapes electronic music events in São Paulo and inserts them into WNXT's
`public.events` table as `approved` rows, straight into the public calendar.

Sources:

- **Techno Airlines** (`technoairlines.com/events/sao-paulo`): listing rows, then
  the schema.org `MusicEvent` JSON-LD of each event page for end time, ticket URL,
  lineup, description and organizer.
- **Plurstation** (`plurstation.com.br/eventos`): listing cards only (detail pages
  are client-rendered), filtered by a city allowlist.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows; source .venv/bin/activate elsewhere
pip install -e ".[dev]"
cp .env.example .env            # then fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` is mandatory: the scraper has no session, and the
service role is what lets it write `approved` rows. The key bypasses RLS, so it
never leaves this machine and never enters the repo (`.env` is git-ignored). The
anon key does not work here.

## Commands

```bash
python src/main.py                              # scrape, dedup, insert
python src/main.py --dry-run                    # scrape and log, never write
python src/main.py --sources plurstation --limit 10 --no-enrich
python -m pytest                                # unit tests, no network
python -m ruff check src tests
```

Run from this directory: `config.py` reads `.env` relative to the cwd.

## Behaviour

- Dedup against the `link` and (`title`, `start_date`) of the events already in the
  scraped date window, plus duplicates inside the same run. No `source`/`external_id`
  columns exist in `events`, so `link` and the date pair are the identity.
- Rows always land as `approved`; `location` follows the `Venue, City - ST` shape.
- One failing source never stops the others. Exit code is 1 if a source or an
  insert failed.
- Polite fetching: `robots.txt` check, `REQUEST_DELAY_SECONDS` between requests,
  bounded retries with backoff.
- Logs: one JSON object per line on stdout and in
  `logs/<timestamp>-<run_id>.log`. Service keys, JWTs and `Authorization` values
  are redacted before they reach a line.

## Adding a source

Subclass `scrapers.base.BaseScraper`: set `name` and `start_url`, implement
`parse(html, now)`, register it in `main.build_scrapers`, and add a real HTML
fixture under `tests/fixtures/<source>/`.
