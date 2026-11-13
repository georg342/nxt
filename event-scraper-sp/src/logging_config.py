"""Structured JSON logging with credential sanitisation.

One JSON object per line, written to stdout and to `logs/<ts>-<run_id>.log`.
Every line carries the `run_id` (bound once per execution); scraper code binds
`source` and, once known, `event_hash` / `event_title` on top of that.
"""

from __future__ import annotations

import logging
import os
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

import structlog

REDACTED = "[REDACTED]"

# Keys whose value is never safe to print.
SENSITIVE_KEY = re.compile(
    r"(authorization|api[-_]?key|apikey|service[-_]?role|token|secret|password|cookie)",
    re.IGNORECASE,
)
# JWT-shaped strings (Supabase keys are JWTs) that leak inside free text.
JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_\-]{4,}\.[A-Za-z0-9_\-]{4,}\.[A-Za-z0-9_\-]{4,}")
BEARER_PATTERN = re.compile(r"Bearer\s+[A-Za-z0-9._\-]+", re.IGNORECASE)

_SECRET_ENV_SUFFIXES = ("SERVICE_ROLE_KEY", "ANON_KEY", "API_KEY", "TOKEN", "PASSWORD")


def _secret_values() -> list[str]:
    """Values from the environment that must never reach a log line."""
    values = [
        value
        for name, value in os.environ.items()
        if name.upper().endswith(_SECRET_ENV_SUFFIXES) and len(value) >= 8
    ]
    return sorted(values, key=len, reverse=True)


def sanitize_text(value: str, secrets: list[str]) -> str:
    for secret in secrets:
        if secret and secret in value:
            value = value.replace(secret, REDACTED)
    value = JWT_PATTERN.sub(REDACTED, value)
    return BEARER_PATTERN.sub(f"Bearer {REDACTED}", value)


def sanitize_value(value, secrets: list[str]):
    if isinstance(value, str):
        return sanitize_text(value, secrets)
    if isinstance(value, dict):
        return {
            key: (
                REDACTED
                if SENSITIVE_KEY.search(str(key))
                else sanitize_value(item, secrets)
            )
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple, set)):
        return [sanitize_value(item, secrets) for item in value]
    return value


def sanitize_processor(_logger, _method_name, event_dict: dict) -> dict:
    """structlog processor: redacts secrets by key and by value."""
    secrets = _secret_values()
    return {
        key: (
            REDACTED
            if SENSITIVE_KEY.search(str(key))
            else sanitize_value(value, secrets)
        )
        for key, value in event_dict.items()
    }


def add_timestamp(_logger, _method_name, event_dict: dict) -> dict:
    event_dict["timestamp"] = datetime.now(tz=UTC).isoformat(timespec="milliseconds")
    return event_dict


class _TeeStream:
    """Write once, land on stdout and on the per-run log file."""

    def __init__(self, *streams):
        self._streams = streams

    def write(self, data: str) -> int:
        for stream in self._streams:
            stream.write(data)
        return len(data)

    def flush(self) -> None:
        for stream in self._streams:
            stream.flush()


def log_file_path(log_dir: str, run_id: str, now: datetime | None = None) -> Path:
    stamp = (now or datetime.now(tz=UTC)).strftime("%Y-%m-%dT%H-%M-%SZ")
    return Path(log_dir) / f"{stamp}-{run_id}.log"


def configure_logging(level: str = "INFO", log_dir: str = "logs", run_id: str = "") -> Path:
    """Configure structlog; returns the log file path for this run."""
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    path = log_file_path(log_dir, run_id or "norun")

    file_handle = open(path, "a", encoding="utf-8")  # noqa: SIM115 - lives for the process
    tee = _TeeStream(sys.stdout, file_handle)

    # A new run must never inherit the previous run's bound context (run_id).
    structlog.contextvars.clear_contextvars()
    if run_id:
        structlog.contextvars.bind_contextvars(run_id=run_id)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            add_timestamp,
            sanitize_processor,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(ensure_ascii=False),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(numeric_level),
        logger_factory=structlog.PrintLoggerFactory(file=tee),
        cache_logger_on_first_use=False,
    )
    return path


def get_logger(name: str = "scraper"):
    return structlog.get_logger(name)
