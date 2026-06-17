from __future__ import annotations

import unittest
from unittest.mock import patch

from backend.ai.services import summarize as ai_service


class SummarizeServiceTests(unittest.TestCase):
    def test_summarize_builds_prompt_and_reads_response(self) -> None:
        captured = {}

        def fake_post_json(url, payload, timeout):
            captured["url"] = url
            captured["payload"] = payload
            captured["timeout"] = timeout
            return {"response": "Resumo final"}

        with patch.object(ai_service, "_post_json", side_effect=fake_post_json):
            result = ai_service.summarize("Falha de autenticação sem rate limit", url="http://example.com", timeout=12)

        self.assertEqual(result, "Resumo final")
        self.assertEqual(captured["url"], "http://example.com")
        self.assertEqual(captured["payload"]["model"], ai_service.OLLAMA_MODEL)
        self.assertIn("Falha de autenticação sem rate limit", captured["payload"]["prompt"])
        self.assertEqual(captured["timeout"], 12)

    def test_check_duplicate_uses_similarity_score(self) -> None:
        duplicate = ai_service.check_duplicate(
            "SQL injection no campo de login",
            ["Falha de SQL injection no login", "Tela quebrada no dashboard"],
        )

        self.assertTrue(duplicate.text)
        self.assertGreaterEqual(duplicate.score, 0.0)
        self.assertIsInstance(duplicate.is_duplicate, bool)

    def test_executive_summary_requires_items(self) -> None:
        with self.assertRaises(ValueError):
            ai_service.executive_summary([])


if __name__ == "__main__":
    unittest.main()