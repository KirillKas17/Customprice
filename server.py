import json
import os
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "server_config.json"


def load_config():
    with CONFIG_PATH.open("r", encoding="utf-8") as fh:
        config = json.load(fh)
    return config


def resolve_db_path(config):
    raw_path = config.get("database_path") or "data/promo_manager.sqlite3"
    db_path = Path(raw_path)
    if not db_path.is_absolute():
        db_path = ROOT / db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_path


CONFIG = load_config()
DB_PATH = resolve_db_path(CONFIG)


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL;")
    connection.execute("PRAGMA busy_timeout=5000;")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            version INTEGER NOT NULL,
            updated_at TEXT NOT NULL,
            payload TEXT NOT NULL
        )
        """
    )
    return connection


class PromoRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _send_json(self, status_code, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            with get_connection() as connection:
                row = connection.execute("SELECT version, updated_at, payload FROM app_state WHERE id = 1").fetchone()
            if not row:
                self._send_json(404, {"error": "state_not_initialized"})
                return
            self._send_json(
                200,
                {
                    "version": row["version"],
                    "updated_at": row["updated_at"],
                    "state": json.loads(row["payload"]),
                },
            )
            return
        return super().do_GET()

    def do_PUT(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/state":
            self._send_json(404, {"error": "not_found"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "invalid_json"})
            return

        base_version = body.get("baseVersion")
        state = body.get("state")
        updated_at = body.get("updatedAt")

        if state is None or updated_at is None:
            self._send_json(400, {"error": "missing_fields"})
            return

        payload = json.dumps(state, ensure_ascii=False)

        with get_connection() as connection:
            row = connection.execute("SELECT version, updated_at, payload FROM app_state WHERE id = 1").fetchone()

            if not row:
                if base_version not in (None, 0):
                    self._send_json(409, {"error": "version_conflict", "version": None})
                    return
                connection.execute(
                    "INSERT INTO app_state (id, version, updated_at, payload) VALUES (1, 1, ?, ?)",
                    (updated_at, payload),
                )
                connection.commit()
                self._send_json(200, {"version": 1, "updated_at": updated_at})
                return

            current_version = row["version"]
            if base_version != current_version:
                self._send_json(
                    409,
                    {
                        "error": "version_conflict",
                        "version": current_version,
                        "updated_at": row["updated_at"],
                        "state": json.loads(row["payload"]),
                    },
                )
                return

            next_version = current_version + 1
            connection.execute(
                "UPDATE app_state SET version = ?, updated_at = ?, payload = ? WHERE id = 1",
                (next_version, updated_at, payload),
            )
            connection.commit()
            self._send_json(200, {"version": next_version, "updated_at": updated_at})


def main():
    server = ThreadingHTTPServer((CONFIG.get("host", "127.0.0.1"), int(CONFIG.get("port", 8000))), PromoRequestHandler)
    print(f"Promo Manager Pro server started at http://{CONFIG.get('host', '127.0.0.1')}:{int(CONFIG.get('port', 8000))}")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
