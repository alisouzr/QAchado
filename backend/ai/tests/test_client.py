from __future__ import annotations

import json
import unittest
from unittest.mock import patch

from backend.ai import client


class ClientTests(unittest.TestCase):
    def test_summarize_builds_url(self) -> None:
        with patch.object(client, "_request_json", return_value={"summary": "Resumo"}) as mocked:
            result = client.summarize("http://localhost:8000/", "Falha crítica")

        self.assertEqual(result, "Resumo")
        mocked.assert_called_once_with(
            "http://localhost:8000/ai/summarize",
            {"text": "Falha crítica"},
        )

    def test_duplicate_check_returns_payload(self) -> None:
        expected = {"duplicate": True, "score": 0.91, "best_match": "Falha parecida"}

        with patch.object(client, "_request_json", return_value=expected) as mocked:
            result = client.duplicate_check(
                "http://localhost:8000",
                "SQL injection",
                ["SQL injection no login"],
            )

        self.assertEqual(result, expected)
        mocked.assert_called_once_with(
            "http://localhost:8000/ai/duplicate-check",
            {"candidate": "SQL injection", "existing_findings": ["SQL injection no login"]},
        )


if __name__ == "__main__":
    unittest.main()