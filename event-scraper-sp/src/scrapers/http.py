"""HTTP fetching with robots.txt checks, polite delays and bounded retries."""

from __future__ import annotations

import time
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser

import httpx

RETRY_STATUS = {429, 500, 502, 503, 504}


class FetchError(RuntimeError):
    """Raised when a page cannot be fetched (network, HTTP error or robots deny)."""


class HttpFetcher:
    """Small wrapper around httpx that every scraper shares.

    - one connection pool and one User-Agent for the whole run;
    - `REQUEST_DELAY_SECONDS` sleeps between requests to the same host;
    - retries 429/5xx/transport errors with exponential backoff;
    - refuses URLs disallowed by the host's robots.txt.
    """

    def __init__(
        self,
        user_agent: str,
        timeout: float = 25.0,
        delay: float = 3.0,
        max_retries: int = 3,
        logger=None,
        client: httpx.Client | None = None,
        sleep=time.sleep,
    ) -> None:
        self._client = client or httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            headers={
                "User-Agent": user_agent,
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            },
        )
        self._delay = delay
        self._max_retries = max(1, max_retries)
        self._logger = logger
        self._sleep = sleep
        self._last_request_at = 0.0
        self._robots: dict[str, RobotFileParser | None] = {}

    def close(self) -> None:
        self._client.close()

    # -- robots ---------------------------------------------------------
    def _robots_for(self, url: str) -> RobotFileParser | None:
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin in self._robots:
            return self._robots[origin]

        parser = RobotFileParser()
        parser.set_url(f"{origin}/robots.txt")
        try:
            response = self._client.get(f"{origin}/robots.txt")
            content_type = response.headers.get("content-type", "")
            if response.status_code >= 400 or "html" in content_type:
                # Missing/unavailable robots.txt (SPAs often answer with HTML).
                self._log("warn", "robots_unavailable", url=f"{origin}/robots.txt",
                          status=response.status_code, content_type=content_type)
                self._robots[origin] = None
                return None
            parser.parse(response.text.splitlines())
        except httpx.HTTPError as exc:
            self._log("warn", "robots_fetch_failed", url=f"{origin}/robots.txt",
                      error_type=type(exc).__name__, error_message=str(exc))
            self._robots[origin] = None
            return None

        self._robots[origin] = parser
        return parser

    def robots_allows(self, url: str) -> bool:
        parser = self._robots_for(url)
        if parser is None:
            return True
        return parser.can_fetch(self._client.headers.get("user-agent", "*"), url)

    # -- fetch ----------------------------------------------------------
    def _wait_turn(self) -> None:
        elapsed = time.monotonic() - self._last_request_at
        remaining = self._delay - elapsed
        if remaining > 0:
            self._sleep(remaining)
        self._last_request_at = time.monotonic()

    def get(self, url: str) -> str:
        return self._request("GET", url)

    def post(self, url: str, payload: dict | None = None) -> dict:
        """POST JSON (RA's GraphQL); same robots, delay and retry rules."""
        return self._request("POST", url, payload)

    def _request(self, method: str, url: str, payload: dict | None = None):
        if not self.robots_allows(url):
            raise FetchError(f"robots.txt disallows {url}")

        body = {} if payload is None else {"json": payload}
        last_error: Exception | None = None
        for attempt in range(1, self._max_retries + 1):
            self._wait_turn()
            try:
                response = self._client.request(method, url, **body)
                if response.status_code in RETRY_STATUS:
                    raise httpx.HTTPStatusError(
                        f"retryable status {response.status_code}",
                        request=response.request,
                        response=response,
                    )
                response.raise_for_status()
                return response.text if method == "GET" else response.json()
            except (httpx.TransportError, httpx.HTTPStatusError) as exc:
                last_error = exc
                if attempt >= self._max_retries:
                    break
                backoff = min(2 ** attempt, 30)
                self._log(
                    "warn",
                    "retry",
                    url=url,
                    attempt=attempt,
                    backoff_seconds=backoff,
                    error_type=type(exc).__name__,
                    error_message=str(exc),
                )
                self._sleep(backoff)

        raise FetchError(
            f"{method} {url} failed after {self._max_retries} attempts: {last_error}"
        ) from last_error

    def _log(self, level: str, message: str, **context) -> None:
        if self._logger is None:
            return
        getattr(self._logger, level)(message, source="http", event_stage="fetch", **context)
