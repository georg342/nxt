import httpx
import pytest
import respx

from scrapers.http import FetchError, HttpFetcher

UA = "WNXT-Test/1.0"
BASE = "https://fonte.example"
ROBOTS_URL = f"{BASE}/robots.txt"
PAGE_URL = f"{BASE}/eventos"
GRAPHQL_URL = f"{BASE}/graphql"


def make_fetcher(logger=None, retries: int = 3) -> HttpFetcher:
    client = httpx.Client(headers={"User-Agent": UA}, follow_redirects=True)
    return HttpFetcher(
        UA,
        delay=0,
        max_retries=retries,
        logger=logger,
        client=client,
        sleep=lambda seconds: None,
    )


def robots(body: str, content_type: str = "text/plain"):
    return httpx.Response(200, text=body, headers={"content-type": content_type})


@respx.mock
def test_get_returns_page_when_robots_allows():
    respx.get(ROBOTS_URL).mock(return_value=robots("User-agent: *\nDisallow: /private"))
    respx.get(PAGE_URL).mock(return_value=httpx.Response(200, text="<html>ok</html>"))

    assert make_fetcher().get(PAGE_URL) == "<html>ok</html>"


@respx.mock
def test_get_refuses_when_robots_disallows():
    respx.get(ROBOTS_URL).mock(return_value=robots("User-agent: *\nDisallow: /eventos"))
    page = respx.get(PAGE_URL).mock(return_value=httpx.Response(200, text="nope"))

    with pytest.raises(FetchError) as error:
        make_fetcher().get(PAGE_URL)
    assert "robots.txt disallows" in str(error.value)
    assert not page.called


@respx.mock
def test_robots_served_as_html_is_treated_as_missing(recording_logger):
    respx.get(ROBOTS_URL).mock(return_value=robots("<!doctype html>", "text/html"))
    respx.get(PAGE_URL).mock(return_value=httpx.Response(200, text="ok"))

    fetcher = make_fetcher(logger=recording_logger)
    assert fetcher.get(PAGE_URL) == "ok"
    assert "robots_unavailable" in recording_logger.messages("warn")


@respx.mock
def test_retries_transient_status_then_succeeds(recording_logger):
    respx.get(ROBOTS_URL).mock(return_value=robots("User-agent: *\nDisallow:"))
    respx.get(PAGE_URL).mock(
        side_effect=[
            httpx.Response(503, text="busy"),
            httpx.Response(200, text="<html>ok</html>"),
        ]
    )

    fetcher = make_fetcher(logger=recording_logger)
    assert fetcher.get(PAGE_URL) == "<html>ok</html>"
    assert "retry" in recording_logger.messages("warn")


@respx.mock
def test_raises_after_exhausting_retries():
    respx.get(ROBOTS_URL).mock(return_value=robots("User-agent: *\nDisallow:"))
    respx.get(PAGE_URL).mock(return_value=httpx.Response(500, text="boom"))

    with pytest.raises(FetchError) as error:
        make_fetcher(retries=2).get(PAGE_URL)
    assert "after 2 attempts" in str(error.value)


@respx.mock
def test_post_sends_json_and_returns_parsed_body():
    respx.get(ROBOTS_URL).mock(return_value=robots("User-agent: *\nDisallow: /private"))
    route = respx.post(GRAPHQL_URL).mock(
        return_value=httpx.Response(200, json={"data": {"event": {"lineup": "X"}}})
    )

    payload = make_fetcher().post(GRAPHQL_URL, {"query": "{ event(id: 1) { lineup } }"})

    assert payload == {"data": {"event": {"lineup": "X"}}}
    assert "event(id: 1)" in route.calls[0].request.content.decode()


@respx.mock
def test_post_refuses_when_robots_disallows():
    respx.get(ROBOTS_URL).mock(return_value=robots("User-agent: *\nDisallow: /graphql"))
    post = respx.post(GRAPHQL_URL).mock(return_value=httpx.Response(200, json={}))

    with pytest.raises(FetchError):
        make_fetcher().post(GRAPHQL_URL, {"query": "{ ping }"})
    assert not post.called


@respx.mock
def test_robots_fetch_error_still_allows_page(recording_logger):
    respx.get(ROBOTS_URL).mock(side_effect=httpx.ConnectError("dns"))
    respx.get(PAGE_URL).mock(return_value=httpx.Response(200, text="ok"))

    fetcher = make_fetcher(logger=recording_logger)
    assert fetcher.get(PAGE_URL) == "ok"
    assert "robots_fetch_failed" in recording_logger.messages("warn")
