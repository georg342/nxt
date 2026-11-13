import json

import structlog

from logging_config import configure_logging, get_logger, sanitize_processor, sanitize_text

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signaturepart"


def test_sanitize_text_removes_jwt_and_bearer():
    text = f"Authorization: Bearer {SERVICE_KEY} and raw {SERVICE_KEY}"
    cleaned = sanitize_text(text, [SERVICE_KEY])
    assert SERVICE_KEY not in cleaned
    assert "[REDACTED]" in cleaned


def test_sanitize_processor_redacts_sensitive_keys_and_nested_values():
    event = {
        "message": "insert",
        "headers": {"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY},
        "token": SERVICE_KEY,
        "nested": {"items": [SERVICE_KEY]},
    }
    cleaned = sanitize_processor(None, "info", event)
    dumped = json.dumps(cleaned)
    assert SERVICE_KEY not in dumped
    assert cleaned["token"] == "[REDACTED]"
    assert cleaned["headers"]["Authorization"] == "[REDACTED]"
    assert cleaned["headers"]["apikey"] == "[REDACTED]"


def test_log_file_never_contains_the_service_key(tmp_path, monkeypatch, capsys):
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY)
    log_path = configure_logging("DEBUG", str(tmp_path), "run-123")
    logger = get_logger("test")
    structlog.contextvars.bind_contextvars(run_id="run-123")

    logger.info(
        "insert_attempt",
        source="supabase",
        event_stage="insert",
        headers={"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY},
        error_message=f"failed with Bearer {SERVICE_KEY}",
    )

    stdout = capsys.readouterr().out
    file_content = log_path.read_text(encoding="utf-8")

    for content in (stdout, file_content):
        assert SERVICE_KEY not in content
        assert "REDACTED" in content

    line = json.loads(file_content.strip().splitlines()[-1])
    assert line["level"] == "info"
    assert line["timestamp"].endswith("+00:00")
    assert line["run_id"] == "run-123"
    assert line["source"] == "supabase"
    assert line["event_stage"] == "insert"


def test_log_level_filters_debug(tmp_path, monkeypatch, capsys):
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    log_path = configure_logging("INFO", str(tmp_path), "run-456")
    logger = get_logger("test")

    logger.debug("invisible")
    logger.info("visible")

    file_content = log_path.read_text(encoding="utf-8")
    assert "invisible" not in file_content
    assert "visible" in file_content


def test_one_json_object_per_line(tmp_path, capsys):
    log_path = configure_logging("INFO", str(tmp_path), "run-789")
    logger = get_logger("test")
    logger.info("first", source="a")
    logger.warning("second", source="b", event_hash="abc")

    lines = [line for line in log_path.read_text(encoding="utf-8").splitlines() if line]
    assert len(lines) == 2
    parsed = [json.loads(line) for line in lines]
    assert parsed[0]["event"] == "first"
    assert parsed[1]["event_hash"] == "abc"
    assert parsed[0]["run_id"] == "run-789"
