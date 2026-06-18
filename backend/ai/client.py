from __future__ import annotations

import argparse
import json
from urllib import error, request


class ClientError(RuntimeError):
    pass


def _request_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=60) as response:
            raw = response.read().decode("utf-8")
    except error.URLError as exc:
        raise ClientError(f"Falha ao acessar {url}: {exc}") from exc

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ClientError("Resposta inválida da API.") from exc


def summarize(api_base_url: str, text: str) -> str:
    data = _request_json(f"{api_base_url.rstrip('/')}/ai/summarize", {"text": text})
    return data["summary"]


def remediation(api_base_url: str, text: str) -> str:
    data = _request_json(f"{api_base_url.rstrip('/')}/ai/remediation", {"text": text})
    return data["remediation"]


def duplicate_check(api_base_url: str, candidate: str, existing_findings: list[str]) -> dict:
    return _request_json(
        f"{api_base_url.rstrip('/')}/ai/duplicate-check",
        {"candidate": candidate, "existing_findings": existing_findings},
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Cliente local da IA do QAchado")
    parser.add_argument("--api-base-url", default="http://127.0.0.1:8000")

    subparsers = parser.add_subparsers(dest="command", required=True)

    summarize_parser = subparsers.add_parser("summarize")
    summarize_parser.add_argument("text")

    remediation_parser = subparsers.add_parser("remediation")
    remediation_parser.add_argument("text")

    duplicate_parser = subparsers.add_parser("duplicate-check")
    duplicate_parser.add_argument("candidate")
    duplicate_parser.add_argument("existing_findings", nargs="+")

    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()

    try:
        if args.command == "summarize":
            print(summarize(args.api_base_url, args.text))
            return 0

        if args.command == "remediation":
            print(remediation(args.api_base_url, args.text))
            return 0

        if args.command == "duplicate-check":
            result = duplicate_check(args.api_base_url, args.candidate, args.existing_findings)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 0

        parser.error("Comando inválido.")
    except ClientError as exc:
        parser.exit(status=1, message=f"{exc}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())