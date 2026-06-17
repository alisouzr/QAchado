from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib import error, request

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "60"))

BASE_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = BASE_DIR / "prompts"


class OllamaError(RuntimeError):
    pass


@dataclass(frozen=True)
class DuplicateMatch:
    text: str
    score: float

    @property
    def is_duplicate(self) -> bool:
        return self.score >= 0.82


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Prompt não encontrado: {path}")
    content = path.read_text(encoding="utf-8").strip()
    if content:
        return content
    return "Você é um especialista em Application Security.\n\nTexto:\n{{TEXT}}"


def _render_prompt(template: str, text: str) -> str:
    return template.replace("{{TEXT}}", text.strip())


def _post_json(url: str, payload: dict, timeout: float) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=timeout) as response:
            response_body = response.read().decode("utf-8")
    except error.URLError as exc:
        raise OllamaError(f"Falha ao chamar Ollama em {url}: {exc}") from exc

    try:
        return json.loads(response_body)
    except json.JSONDecodeError as exc:
        raise OllamaError("Resposta inválida recebida do Ollama.") from exc


def _generate(prompt: str, *, model: str | None = None, url: str | None = None, timeout: float | None = None) -> str:
    payload = {
        "model": model or OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    data = _post_json(url or OLLAMA_URL, payload, timeout or OLLAMA_TIMEOUT)
    response_text = data.get("response")
    if not isinstance(response_text, str) or not response_text.strip():
        raise OllamaError("Ollama não retornou texto de resposta.")
    return response_text.strip()


def summarize(text: str, *, model: str | None = None, url: str | None = None, timeout: float | None = None) -> str:
    prompt = _render_prompt(_load_prompt("summarizeFinding.txt"), text)
    return _generate(prompt, model=model, url=url, timeout=timeout)


def suggest_remediation(text: str, *, model: str | None = None, url: str | None = None, timeout: float | None = None) -> str:
    prompt = _render_prompt(_load_prompt("remediationSuggestion.txt"), text)
    return _generate(prompt, model=model, url=url, timeout=timeout)


def executive_summary(findings: Iterable[str], *, model: str | None = None, url: str | None = None, timeout: float | None = None) -> str:
    finding_lines = [f"- {finding.strip()}" for finding in findings if finding and finding.strip()]
    if not finding_lines:
        raise ValueError("Pelo menos um achado precisa ser informado.")
    prompt = _render_prompt(_load_prompt("executiveSummary.txt"), "\n".join(finding_lines))
    return _generate(prompt, model=model, url=url, timeout=timeout)


def _tokenize(text: str) -> set[str]:
    normalized = "".join(character.lower() if character.isalnum() else " " for character in text)
    return {token for token in normalized.split() if len(token) > 2}


def _jaccard_similarity(left: str, right: str) -> float:
    left_tokens = _tokenize(left)
    right_tokens = _tokenize(right)
    if not left_tokens or not right_tokens:
        return 0.0
    intersection = left_tokens & right_tokens
    union = left_tokens | right_tokens
    return len(intersection) / len(union)


def _embedding_similarity(candidate: str, existing_findings: Iterable[str]) -> DuplicateMatch:
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np
    except Exception:
        best_text = ""
        best_score = 0.0
        for finding in existing_findings:
            score = _jaccard_similarity(candidate, finding)
            if score > best_score:
                best_text = finding
                best_score = score
        return DuplicateMatch(text=best_text, score=best_score)

    findings = [finding.strip() for finding in existing_findings if finding and finding.strip()]
    if not findings:
        return DuplicateMatch(text="", score=0.0)

    model = SentenceTransformer(os.getenv("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2"))
    embeddings = model.encode([candidate, *findings], normalize_embeddings=True)
    candidate_vector = embeddings[0]
    finding_vectors = embeddings[1:]
    similarities = np.dot(finding_vectors, candidate_vector)
    best_index = int(np.argmax(similarities))
    return DuplicateMatch(text=findings[best_index], score=float(similarities[best_index]))


def check_duplicate(candidate: str, existing_findings: Iterable[str]) -> DuplicateMatch:
    return _embedding_similarity(candidate, existing_findings)