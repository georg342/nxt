import httpx
import pytest
import respx

from db.supabase import ExistingEvents, SupabaseError, SupabaseEventsRepository

BASE = "https://proj.supabase.co/rest/v1"


def make_repo(logger=None) -> SupabaseEventsRepository:
    client = httpx.Client(
        base_url=BASE,
        headers={
            "apikey": "service-role-key",
            "Authorization": "Bearer service-role-key",
            "Content-Type": "application/json",
        },
    )
    return SupabaseEventsRepository("https://proj.supabase.co", "service-role-key", logger, client)


EVENTS_PAYLOAD = [
    {
        "id": "1",
        "title": "Trance Sanctuary",
        "start_date": "2026-11-13T02:00:00+00:00",
        "link": "https://example.com/e/1",
    },
    {
        "id": "2",
        "title": "Tech House Party",
        "start_date": "2026-11-14T02:00:00+00:00",
        "link": "https://example.com/e/2?utm_source=ig",
    },
]


@respx.mock
def test_existing_events_builds_dedup_index():
    respx.get(f"{BASE}/events").mock(return_value=httpx.Response(200, json=EVENTS_PAYLOAD))

    index = make_repo().existing_events("2026-11-01", "2026-11-30")

    assert isinstance(index, ExistingEvents)
    assert index.contains("qualquer", "2020-01-01", "https://example.com/e/1")
    assert index.contains("qualquer", "2020-01-01", "https://EXAMPLE.com/e/1?utm_source=x")
    assert index.contains("trance  sanctuary", "2026-11-13", None)
    assert not index.contains("outro", "2026-11-13", "https://example.com/e/9")


@respx.mock
def test_existing_events_uses_date_window_filter():
    route = respx.get(f"{BASE}/events").mock(
        return_value=httpx.Response(200, json=EVENTS_PAYLOAD)
    )
    make_repo().existing_events("2026-11-01", "2026-11-30")
    url = str(route.calls[0].request.url)
    assert "start_date=gte.2026-11-01" in url
    assert "start_date=lte.2026-11-30" in url


@respx.mock
def test_existing_events_raises_on_error():
    respx.get(f"{BASE}/events").mock(
        return_value=httpx.Response(401, text="permission denied")
    )
    with pytest.raises(SupabaseError) as error:
        make_repo().existing_events("2026-11-01", "2026-11-30")
    assert "401" in str(error.value)


@respx.mock
def test_insert_event_returns_created_row():
    route = respx.post(f"{BASE}/events").mock(
        return_value=httpx.Response(201, json=[{"id": "abc", "status": "pending"}])
    )
    row = {"title": "X", "status": "pending"}
    created = make_repo().insert_event(row)

    assert created["id"] == "abc"
    assert route.calls[0].request.headers["prefer"] == "return=representation"


@respx.mock
def test_insert_event_raises_on_rls_error():
    respx.post(f"{BASE}/events").mock(
        return_value=httpx.Response(403, text="new row violates row-level security policy")
    )
    with pytest.raises(SupabaseError) as error:
        make_repo().insert_event({"title": "X", "status": "pending"})
    assert "403" in str(error.value)
