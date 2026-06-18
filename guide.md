## IA local do QAchado

Este módulo expõe funções para resumo, remediação, resumo executivo e checagem de duplicidade usando um servidor local do Ollama.

## Como a IA funciona

O fluxo é este:

1. O frontend envia o achado para a API local.
2. A API monta o contexto do achado e escolhe o prompt adequado.
3. O serviço chama o Ollama local em `http://127.0.0.1:11434`.
4. O Ollama gera a resposta com base no prompt e no texto recebido.
5. A API devolve o JSON para o frontend ou para o cliente de teste.

Na checagem de duplicidade, o módulo tenta comparar semanticamente os achados usando `sentence-transformers`. Se essa biblioteca não estiver disponível, ele usa um fallback simples por similaridade de palavras.

## Instalação do Ollama

No Linux, o caminho usado neste projeto foi:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Depois de instalar, confirme a versão:

```bash
ollama --version
```

E verifique se o serviço está respondendo:

```bash
curl http://127.0.0.1:11434/api/tags
```

## Baixar o modelo

O projeto usa `llama3` por padrão. Para baixar o modelo:

```bash
ollama pull llama3
```

Se quiser testar o modelo diretamente:

```bash
ollama run llama3
```

Exemplo de prompt:

```text
Resuma em uma linha: falha de autenticação sem rate limit.
```

### Variáveis de ambiente

- `OLLAMA_URL`: URL do endpoint de geração do Ollama.
- `OLLAMA_MODEL`: nome do modelo local, por padrão `llama3`.
- `OLLAMA_TIMEOUT`: tempo limite em segundos para a chamada HTTP.
- `SENTENCE_TRANSFORMER_MODEL`: modelo usado na deduplicação, por padrão `all-MiniLM-L6-v2`.
- `AI_API_HOST`: host do servidor HTTP local.
- `AI_API_PORT`: porta do servidor HTTP local.

Exemplo de configuração:

```bash
export OLLAMA_URL=http://127.0.0.1:11434/api/generate
export OLLAMA_MODEL=llama3
export OLLAMA_TIMEOUT=60
export SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
export AI_API_HOST=0.0.0.0
export AI_API_PORT=8000
```

### Endpoints

- `GET /health`
- `POST /ai/summarize`
- `POST /ai/remediation`
- `POST /ai/executive-summary`
- `POST /ai/duplicate-check`

Os endpoints de achado aceitam tanto `text` quanto contexto estruturado, por exemplo:

```json
{
	"title": "Falha de autenticação",
	"severity": "Alta",
	"description": "Sem rate limit no login",
	"impact": "Tentativas ilimitadas de acesso",
	"text": "Falha de autenticação sem rate limit"
}
```

### Execução

Inicie a API do módulo:

```bash
python -m backend.ai.api
```

Teste a API com `curl`:

```bash
curl -sS http://127.0.0.1:8000/health

curl -sS -X POST http://127.0.0.1:8000/ai/summarize \
	-H 'Content-Type: application/json' \
	-d '{"title":"Falha de autenticação","severity":"Alta","description":"Sem rate limit no login","impact":"Tentativas ilimitadas de acesso","text":"Falha de autenticação sem rate limit"}'
```

### Cliente de teste

Você também pode usar o cliente CLI para testar as rotas sem o frontend:

```bash
python -m backend.ai.client summarize "Falha de autenticação sem rate limit"
python -m backend.ai.client remediation "Falha de autenticação sem rate limit"
python -m backend.ai.client duplicate-check "SQL injection no login" "SQL injection no formulário" "XSS na tela"
```

### Dependência opcional para duplicidade inteligente

Se quiser a comparação semântica mais precisa, instale:

```bash
pip install sentence-transformers
```

Essa dependência é opcional. Se ela não estiver presente, o sistema continua funcionando com o fallback por similaridade de palavras.
