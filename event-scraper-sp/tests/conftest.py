import pathlib

import pytest

FIXTURES = pathlib.Path(__file__).parent / "fixtures"


def read_fixture(*parts: str) -> str:
    return FIXTURES.joinpath(*parts).read_text(encoding="utf-8", errors="replace")


@pytest.fixture
def fixture_html():
    return read_fixture


class RecordingLogger:
    """Stand-in for a structlog logger; keeps every call for assertions."""

    def __init__(self, context: dict | None = None, calls: list | None = None) -> None:
        self.context = context or {}
        # Bound loggers share the root call log, like structlog forwards to one sink.
        self.calls: list[tuple[str, str, dict]] = calls if calls is not None else []

    def bind(self, **context):
        return RecordingLogger({**self.context, **context}, self.calls)

    def _record(self, level: str):
        def record(message: str, **context):
            self.calls.append((level, message, {**self.context, **context}))

        return record

    debug = property(lambda self: self._record("debug"))
    info = property(lambda self: self._record("info"))
    warn = property(lambda self: self._record("warn"))
    warning = property(lambda self: self._record("warn"))
    error = property(lambda self: self._record("error"))

    def messages(self, level: str | None = None) -> list[str]:
        return [
            message
            for call_level, message, _ in self.calls
            if level is None or call_level == level
        ]


@pytest.fixture
def recording_logger():
    return RecordingLogger()
