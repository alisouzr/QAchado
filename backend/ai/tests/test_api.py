from __future__ import annotations

import json
import unittest
from unittest.mock import patch

from backend.ai import api


class ApiTests(unittest.TestCase):
    def test_health_route(self) -> None:
        status, headers, body = api.handle_request("GET", "/health")

        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "application/json; charset=utf-8")
        self.assertEqual(json.loads(body.decode("utf-8")), {"status": "ok"})

    def test_summarize_route(self) -> None:
        with patch.object(api.ai_service, "summarize", return_value="Resumo gerado") as mocked:
            status, _, body = api.handle_request(
                "POST",
                "/ai/summarize",
                json.dumps({"text": "Falha de autenticação"}).encode("utf-8"),
            )

        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body.decode("utf-8")), {"summary": "Resumo gerado"})
        mocked.assert_called_once_with("Falha de autenticação")

    def test_duplicate_check_route(self) -> None:
        fake_match = api.ai_service.DuplicateMatch(text="Falha parecida", score=0.91)

        with patch.object(api.ai_service, "check_duplicate", return_value=fake_match) as mocked:
            status, _, body = api.handle_request(
                "POST",
                "/ai/duplicate-check",
                json.dumps(
                    {
                        "candidate": "SQL injection no login",
                        "existing_findings": ["SQL injection no formulário"],
                    }
                ).encode("utf-8"),
            )

        self.assertEqual(status, 200)
        self.assertEqual(
            json.loads(body.decode("utf-8")),
            {"duplicate": True, "score": 0.91, "best_match": "Falha parecida"},
        )
        mocked.assert_called_once()

    def test_validation_errors(self) -> None:
        status, _, body = api.handle_request("POST", "/ai/summarize", json.dumps({}).encode("utf-8"))

        self.assertEqual(status, 400)
        self.assertIn("text", json.loads(body.decode("utf-8"))["error"])


if __name__ == "__main__":
    unittest.main()