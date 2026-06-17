from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

from backend.ai.services import summarize as ai_service


def _json_response(status: HTTPStatus, payload: dict[str, Any]) -> tuple[int, dict[str, str], bytes]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": str(len(body)),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    return status.value, headers, body


def _empty_response(status: HTTPStatus) -> tuple[int, dict[str, str], bytes]:
    headers = {
        "Content-Length": "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    return status.value, headers, b""


def _error(status: HTTPStatus, message: str) -> tuple[int, dict[str, str], bytes]:
    return _json_response(status, {"error": message})


def _read_json(body: bytes) -> dict[str, Any]:
    if not body:
        return {}
    try:
        data = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("JSON inválido.") from exc
    if not isinstance(data, dict):
        raise ValueError("O corpo precisa ser um objeto JSON.")
    return data


def handle_request(method: str, path: str, body: bytes = b"") -> tuple[int, dict[str, str], bytes]:
    parsed_path = urlparse(path).path.rstrip("/") or "/"

    if method == "GET" and parsed_path == "/health":
        return _json_response(HTTPStatus.OK, {"status": "ok"})

    if method == "OPTIONS":
        return _empty_response(HTTPStatus.NO_CONTENT)

    if method != "POST":
        return _error(HTTPStatus.METHOD_NOT_ALLOWED, "Método não permitido.")

    try:
        payload = _read_json(body)
    except ValueError as exc:
        return _error(HTTPStatus.BAD_REQUEST, str(exc))

    try:
        if parsed_path == "/ai/summarize":
            text = payload.get("text", "")
            if not isinstance(text, str) or not text.strip():
                return _error(HTTPStatus.BAD_REQUEST, "O campo 'text' é obrigatório.")
            summary = ai_service.summarize(text)
            return _json_response(HTTPStatus.OK, {"summary": summary})

        if parsed_path == "/ai/remediation":
            text = payload.get("text", "")
            if not isinstance(text, str) or not text.strip():
                return _error(HTTPStatus.BAD_REQUEST, "O campo 'text' é obrigatório.")
            suggestion = ai_service.suggest_remediation(text)
            return _json_response(HTTPStatus.OK, {"remediation": suggestion})

        if parsed_path == "/ai/executive-summary":
            findings = payload.get("findings", [])
            if not isinstance(findings, list):
                return _error(HTTPStatus.BAD_REQUEST, "O campo 'findings' precisa ser uma lista.")
            summary = ai_service.executive_summary(findings)
            return _json_response(HTTPStatus.OK, {"executive_summary": summary})

        if parsed_path == "/ai/duplicate-check":
            candidate = payload.get("candidate", "")
            existing_findings = payload.get("existing_findings", [])
            if not isinstance(candidate, str) or not candidate.strip():
                return _error(HTTPStatus.BAD_REQUEST, "O campo 'candidate' é obrigatório.")
            if not isinstance(existing_findings, list):
                return _error(HTTPStatus.BAD_REQUEST, "O campo 'existing_findings' precisa ser uma lista.")
            match = ai_service.check_duplicate(candidate, existing_findings)
            return _json_response(
                HTTPStatus.OK,
                {
                    "duplicate": match.is_duplicate,
                    "score": round(match.score, 4),
                    "best_match": match.text,
                },
            )

        return _error(HTTPStatus.NOT_FOUND, "Rota não encontrada.")
    except ai_service.OllamaError as exc:
        return _error(HTTPStatus.BAD_GATEWAY, str(exc))
    except ValueError as exc:
        return _error(HTTPStatus.BAD_REQUEST, str(exc))


class AIRequestHandler(BaseHTTPRequestHandler):
    def _write(self, status: int, headers: dict[str, str], body: bytes) -> None:
        self.send_response(status)
        for key, value in headers.items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        status, headers, body = handle_request("GET", self.path)
        self._write(status, headers, body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        status, headers, body = handle_request("OPTIONS", self.path)
        self._write(status, headers, body)

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b""
        status, headers, response_body = handle_request("POST", self.path, body)
        self._write(status, headers, response_body)

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return


def run_server(host: str | None = None, port: int | None = None) -> None:
    server_host = host or os.getenv("AI_API_HOST", "0.0.0.0")
    server_port = port or int(os.getenv("AI_API_PORT", "8000"))
    server = ThreadingHTTPServer((server_host, server_port), AIRequestHandler)
    print(f"IA local disponível em http://{server_host}:{server_port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()