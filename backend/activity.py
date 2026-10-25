"""MySQL activity log for IPO X-Ray 360.

Records everything a user does:
  * api_requests - every HTTP call hitting the backend (method, path, query, request body,
                   response status/body, timing, IP, user agent, visitor id)
  * ui_events    - everything the browser reports: page views, route changes, clicks,
                   form inputs, submits, scrolls, errors, tab focus/blur
  * visitors     - one row per browser (first/last seen, user agent, IP, event counts)

Writes go through a background thread so a slow or missing MySQL never blocks a request.
Connection settings come from MYSQL_* env vars; the schema and tables are created on startup.
Open the `ipo_xray_activity` schema in MySQL Workbench to browse it.
"""
import json
import os
import queue
import threading
import time
from datetime import datetime

import pymysql

MAX_BODY_CHARS = 1_000_000   # request/response bodies are stored up to ~1 MB each
SKIP_PATHS = ("/api/activity",)  # the event-ingest endpoint is logged as ui_events, not as requests
VISITOR_COOKIE = "xray_vid"

_queue: "queue.Queue[tuple[str, dict]]" = queue.Queue(maxsize=50_000)
_worker: threading.Thread | None = None
enabled = False

SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS visitors (
        visitor_id   VARCHAR(64) PRIMARY KEY,
        first_seen   DATETIME(3) NOT NULL,
        last_seen    DATETIME(3) NOT NULL,
        first_ip     VARCHAR(64),
        last_ip      VARCHAR(64),
        user_agent   TEXT,
        request_count INT NOT NULL DEFAULT 0,
        event_count  INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,
    """
    CREATE TABLE IF NOT EXISTS api_requests (
        id            BIGINT AUTO_INCREMENT PRIMARY KEY,
        created_at    DATETIME(3) NOT NULL,
        visitor_id    VARCHAR(64),
        session_id    VARCHAR(64),
        client_ip     VARCHAR(64),
        user_agent    TEXT,
        referer       TEXT,
        method        VARCHAR(10) NOT NULL,
        path          VARCHAR(1024) NOT NULL,
        query_string  TEXT,
        request_headers JSON,
        content_type  VARCHAR(255),
        request_body  LONGTEXT,
        request_bytes INT,
        status_code   INT,
        response_type VARCHAR(255),
        response_body LONGTEXT,
        response_bytes BIGINT,
        duration_ms   DOUBLE,
        error         TEXT,
        INDEX idx_req_time (created_at),
        INDEX idx_req_visitor (visitor_id),
        INDEX idx_req_path (path(191))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,
    """
    CREATE TABLE IF NOT EXISTS ui_events (
        id          BIGINT AUTO_INCREMENT PRIMARY KEY,
        created_at  DATETIME(3) NOT NULL,
        client_time DATETIME(3),
        visitor_id  VARCHAR(64),
        session_id  VARCHAR(64),
        client_ip   VARCHAR(64),
        user_agent  TEXT,
        event_type  VARCHAR(64) NOT NULL,
        page        VARCHAR(1024),
        target      TEXT,
        value       LONGTEXT,
        details     JSON,
        INDEX idx_ev_time (created_at),
        INDEX idx_ev_visitor (visitor_id),
        INDEX idx_ev_session (session_id),
        INDEX idx_ev_type (event_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,
]


def _settings() -> dict:
    return dict(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        charset="utf8mb4",
        autocommit=True,
        connect_timeout=5,
    )


def _db_name() -> str:
    return os.getenv("MYSQL_DATABASE", "ipo_xray_activity")


def _connect():
    return pymysql.connect(database=_db_name(), **_settings())


def init():
    """Create the schema and tables, then start the writer thread. Never raises."""
    global enabled, _worker
    try:
        conn = pymysql.connect(**_settings())
        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{_db_name()}` CHARACTER SET utf8mb4")
            cur.execute(f"USE `{_db_name()}`")
            for ddl in SCHEMA:
                cur.execute(ddl)
        conn.close()
    except Exception as e:
        print(f"activity: MySQL unavailable ({e}); user activity will not be stored")
        return
    enabled = True
    if _worker is None:
        _worker = threading.Thread(target=_run, name="activity-writer", daemon=True)
        _worker.start()
    print(f"activity: logging all user activity to MySQL schema `{_db_name()}`")


def _now() -> datetime:
    return datetime.now()


def clip(text: str | None) -> str | None:
    if text is None or len(text) <= MAX_BODY_CHARS:
        return text
    return text[:MAX_BODY_CHARS] + f"... [truncated, {len(text)} chars total]"


def log_request(row: dict):
    _put("request", row)


def log_events(events: list[dict]):
    for e in events:
        _put("event", e)


def _put(kind: str, row: dict):
    if not enabled:
        return
    try:
        _queue.put_nowait((kind, row))
    except queue.Full:
        pass  # better to drop a log line than to stall the app


# ---- writer thread -------------------------------------------------------------------------------

def _run():
    conn = None
    while True:
        item = _queue.get()
        batch = [item]
        while len(batch) < 200:          # drain whatever else is waiting into one round trip
            try:
                batch.append(_queue.get_nowait())
            except queue.Empty:
                break
        for attempt in range(2):
            try:
                if conn is None:
                    conn = _connect()
                _write(conn, batch)
                break
            except Exception as e:
                try:
                    conn and conn.close()
                except Exception:
                    pass
                conn = None
                if attempt:
                    print(f"activity: dropped {len(batch)} rows ({e})")
                    time.sleep(2)


def _write(conn, batch):
    with conn.cursor() as cur:
        for kind, r in batch:
            if kind == "request":
                cur.execute(
                    """INSERT INTO api_requests (created_at, visitor_id, session_id, client_ip, user_agent,
                         referer, method, path, query_string, request_headers, content_type, request_body,
                         request_bytes, status_code, response_type, response_body, response_bytes,
                         duration_ms, error)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (r["created_at"], r.get("visitor_id"), r.get("session_id"), r.get("client_ip"),
                     r.get("user_agent"), r.get("referer"), r["method"], r["path"][:1024],
                     r.get("query_string"), json.dumps(r.get("request_headers") or {}),
                     (r.get("content_type") or "")[:255], r.get("request_body"), r.get("request_bytes"),
                     r.get("status_code"), (r.get("response_type") or "")[:255], r.get("response_body"),
                     r.get("response_bytes"), r.get("duration_ms"), r.get("error")),
                )
                _touch_visitor(cur, r, "request_count")
            else:
                cur.execute(
                    """INSERT INTO ui_events (created_at, client_time, visitor_id, session_id, client_ip,
                         user_agent, event_type, page, target, value, details)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (r["created_at"], r.get("client_time"), r.get("visitor_id"), r.get("session_id"),
                     r.get("client_ip"), r.get("user_agent"), str(r.get("event_type") or "unknown")[:64],
                     (r.get("page") or "")[:1024], r.get("target"), clip(r.get("value")),
                     json.dumps(r.get("details") or {}, default=str)),
                )
                _touch_visitor(cur, r, "event_count")


def _touch_visitor(cur, r, counter):
    if not r.get("visitor_id"):
        return
    cur.execute(
        f"""INSERT INTO visitors (visitor_id, first_seen, last_seen, first_ip, last_ip, user_agent, {counter})
            VALUES (%s,%s,%s,%s,%s,%s,1)
            ON DUPLICATE KEY UPDATE last_seen=VALUES(last_seen), last_ip=VALUES(last_ip),
                                    user_agent=VALUES(user_agent), {counter}={counter}+1""",
        (r["visitor_id"], r["created_at"], r["created_at"], r.get("client_ip"), r.get("client_ip"),
         r.get("user_agent")),
    )


# ---- ASGI middleware: logs every HTTP request with its bodies -----------------------------------

_REDACT_HEADERS = {"authorization", "cookie", "x-api-key"}


class ActivityMiddleware:
    """Pure ASGI so streaming responses (SSE) keep streaming; the row is written when they finish."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or not enabled or scope["path"].startswith(SKIP_PATHS):
            return await self.app(scope, receive, send)

        started = time.perf_counter()
        headers = {k.decode("latin-1").lower(): v.decode("latin-1") for k, v in scope.get("headers", [])}
        req_chunks: list[bytes] = []
        resp_chunks: list[bytes] = []
        resp_size = 0
        status = {"code": None, "type": None}

        async def recv():
            msg = await receive()
            if msg["type"] == "http.request" and msg.get("body"):
                req_chunks.append(msg["body"])
            return msg

        async def snd(msg):
            nonlocal resp_size
            if msg["type"] == "http.response.start":
                status["code"] = msg["status"]
                for k, v in msg.get("headers", []):
                    if k.lower() == b"content-type":
                        status["type"] = v.decode("latin-1")
            elif msg["type"] == "http.response.body" and msg.get("body"):
                body = msg["body"]
                resp_size += len(body)
                if resp_size - len(body) < MAX_BODY_CHARS:
                    resp_chunks.append(body)
            await send(msg)

        error = None
        try:
            await self.app(scope, recv, snd)
        except Exception as e:
            error = repr(e)
            raise
        finally:
            log_request({
                "created_at": _now(),
                "visitor_id": _cookie(headers.get("cookie", ""), VISITOR_COOKIE),
                "session_id": headers.get("x-session-id"),
                "client_ip": client_ip(scope, headers),
                "user_agent": headers.get("user-agent"),
                "referer": headers.get("referer"),
                "method": scope["method"],
                "path": scope["path"],
                "query_string": scope.get("query_string", b"").decode("latin-1") or None,
                "request_headers": {k: ("[redacted]" if k in _REDACT_HEADERS else v) for k, v in headers.items()},
                "content_type": headers.get("content-type"),
                "request_body": _body_text(b"".join(req_chunks), headers.get("content-type")),
                "request_bytes": sum(len(c) for c in req_chunks),
                "status_code": status["code"] or (500 if error else None),
                "response_type": status["type"],
                "response_body": _body_text(b"".join(resp_chunks), status["type"], resp_size),
                "response_bytes": resp_size,
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                "error": error,
            })


def _body_text(raw: bytes, content_type: str | None, total: int | None = None) -> str | None:
    if not raw:
        return None
    ct = (content_type or "").lower()
    if not any(t in ct for t in ("json", "text", "form-urlencoded", "multipart", "xml", "event-stream")) and ct:
        return f"[binary {ct}, {total or len(raw)} bytes]"
    if "multipart" in ct:
        return _multipart_summary(raw, ct)
    text = raw.decode("utf-8", errors="replace")
    if total and total > len(raw):
        text += f"... [truncated, {total} bytes total]"
    return clip(text)


def _multipart_summary(raw: bytes, ct: str) -> str:
    """Keeps text fields verbatim; uploaded files are recorded by name, type and size."""
    boundary = ct.split("boundary=")[-1].strip('"').encode()
    parts = {}
    for part in raw.split(b"--" + boundary):
        head, _, body = part.partition(b"\r\n\r\n")
        head_s = head.decode("latin-1", errors="replace")
        if "name=" not in head_s:
            continue
        name = head_s.split('name="', 1)[1].split('"', 1)[0]
        body = body.rstrip(b"\r\n-")
        if 'filename="' in head_s:
            fname = head_s.split('filename="', 1)[1].split('"', 1)[0]
            parts[name] = {"file": fname, "bytes": len(body)}
        else:
            parts[name] = clip(body.decode("utf-8", errors="replace"))
    return json.dumps(parts)


def _cookie(cookie_header: str, name: str) -> str | None:
    for piece in cookie_header.split(";"):
        k, _, v = piece.strip().partition("=")
        if k == name:
            return v[:64] or None
    return None


def client_ip(scope, headers) -> str | None:
    fwd = headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    client = scope.get("client")
    return client[0] if client else None


def visitor_from(headers) -> str | None:
    return _cookie(headers.get("cookie", ""), VISITOR_COOKIE)
