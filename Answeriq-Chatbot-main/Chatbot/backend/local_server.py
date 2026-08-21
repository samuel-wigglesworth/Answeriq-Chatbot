"""
Local development server for the AnswerIQ Python evaluator.
Run: python local_server.py
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

from evaluate import evaluate_answer

PORT = int(os.environ.get("PORT", "5000"))


class EvaluateHandler(BaseHTTPRequestHandler):
    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "OPTIONS, POST")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802
        if self.path not in ("/evaluate", "/api/evaluate"):
            self.send_response(404)
            self._cors()
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8")
        try:
            payload = json.loads(raw)
            result = evaluate_answer(
                payload.get("question", ""),
                payload.get("reference_answer", ""),
                payload.get("user_answer_1", ""),
                payload.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY"),
            )
            body = json.dumps(result).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(body)
        except ValueError as exc:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[AnswerIQ] {self.address_string()} - {fmt % args}")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), EvaluateHandler)
    print(f"AnswerIQ evaluator running at http://localhost:{PORT}/evaluate")
    server.serve_forever()
