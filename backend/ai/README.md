## IA local do QAchado

Este módulo expõe funções para resumo, remediação, resumo executivo e checagem de duplicidade usando um servidor local do Ollama.

### Variáveis de ambiente

- `OLLAMA_URL`: URL do endpoint de geração do Ollama.
- `OLLAMA_MODEL`: nome do modelo local, por padrão `llama3`.
- `OLLAMA_TIMEOUT`: tempo limite em segundos para a chamada HTTP.
- `SENTENCE_TRANSFORMER_MODEL`: modelo usado na deduplicação, por padrão `all-MiniLM-L6-v2`.
- `AI_API_HOST`: host do servidor HTTP local.
- `AI_API_PORT`: porta do servidor HTTP local.

### Endpoints

- `GET /health`
- `POST /ai/summarize` com `{ "text": "..." }`
- `POST /ai/remediation` com `{ "text": "..." }`
- `POST /ai/executive-summary` com `{ "findings": ["...", "..."] }`
- `POST /ai/duplicate-check` com `{ "candidate": "...", "existing_findings": ["...", "..."] }`

### Execução

```bash
python -m backend.ai.api
```
