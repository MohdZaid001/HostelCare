"""Minimal local health endpoint for HostelCare.

The application data path is Supabase Auth + PostgreSQL RLS. This service is
only a health check; it does not receive SQL or user data and therefore does
not need a database/service-role secret.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json


HOST = "127.0.0.1"
PORT = 8000


class Handler(BaseHTTPRequestHandler):
    server_version = "HostelCareHealth/1.0"
    sys_version = ""

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/api/health":
            self._send_json(200, {"status": "ok", "service": "HostelCare"})
            return
        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        self._send_json(405, {"error": "Method not allowed"})

    def do_PUT(self) -> None:
        self._send_json(405, {"error": "Method not allowed"})

    def do_PATCH(self) -> None:
        self._send_json(405, {"error": "Method not allowed"})

    def do_DELETE(self) -> None:
        self._send_json(405, {"error": "Method not allowed"})

    def log_message(self, format: str, *args) -> None:
        # Avoid logging request data into terminal output.
        return


if __name__ == "__main__":
    print(f"HostelCare health API running at http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
