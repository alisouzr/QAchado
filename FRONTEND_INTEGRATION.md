# Integração do Frontend com a IA do QAchado

Este documento explica como o frontend deve conversar com a IA local do QAchado.

## Visão geral

A IA do projeto funciona como um serviço local separado da interface.

Fluxo principal:

1. O frontend envia os dados do achado para a API local.
2. A API monta um texto de contexto com os campos recebidos.
3. O serviço de IA escolhe o prompt correto.
4. O Ollama local gera a resposta.
5. A API devolve o resultado em JSON para o frontend.

Isso permite que o frontend use a IA sem conhecer a lógica interna de prompts ou do modelo.

## Endpoints disponíveis

Base URL padrão:

http://127.0.0.1:8000

Rotas:

- GET /health
- POST /ai/summarize
- POST /ai/remediation
- POST /ai/executive-summary
- POST /ai/duplicate-check

## Como o frontend deve chamar a API

O frontend só precisa enviar JSON com Content-Type application/json.

Exemplo de chamada para resumo:

```json
{
  "title": "Falha de autenticação",
  "severity": "Alta",
  "description": "Sem rate limit no login",
  "impact": "Tentativas ilimitadas de acesso",
  "text": "Falha de autenticação sem rate limit"
}
```

Exemplo de resposta:

```json
{
  "summary": "Texto resumido gerado pelo Ollama"
}
```

## Payloads esperados

### 1. Resumo do achado

Rota:

POST /ai/summarize

Campos aceitos:

- text
- title
- severity
- description
- evidence
- recommendation
- impact
- status
- extra_notes

O frontend pode mandar apenas text, mas o ideal é enviar os campos estruturados para melhorar a qualidade do texto gerado.

### 2. Sugestão de remediação

Rota:

POST /ai/remediation

Campos aceitos:

- text
- title
- severity
- description
- evidence
- recommendation
- impact
- status
- extra_notes

### 3. Resumo executivo

Rota:

POST /ai/executive-summary

Payload:

```json
{
  "findings": [
    "Falha de autenticação sem rate limit",
    "XSS em campo de comentário"
  ]
}
```

### 4. Checagem de duplicidade

Rota:

POST /ai/duplicate-check

Payload mínimo:

```json
{
  "candidate": "Falha de autenticação sem rate limit",
  "existing_findings": [
    "Falha de login sem limitação de tentativas",
    "XSS em campo de comentário"
  ]
}
```

Também é possível enviar contexto estruturado do achado no campo candidate usando os mesmos campos de resumo.

## Exemplo de consumo no frontend

Fluxo sugerido no JavaScript:

1. Ler os campos do formulário.
2. Montar o objeto JSON.
3. Fazer fetch com method POST.
4. Exibir o campo summary, remediation ou duplicate na interface.
5. Tratar erros mostrando a mensagem retornada pela API.

Exemplo lógico:

```text
botão clicado
  -> montar payload
  -> chamar endpoint
  -> receber JSON
  -> renderizar resultado
```

## Exemplo de uso na tela de cadastro

Se a tela final tiver campos como título, descrição, severidade e evidência, o frontend deve enviar esses dados para a IA na hora do clique no botão "Gerar Resumo com IA".

Sugestão:

- usar /ai/summarize para gerar um resumo curto do achado;
- usar /ai/remediation para sugerir correção;
- usar /ai/duplicate-check antes de salvar um novo achado;
- usar /ai/executive-summary no relatório consolidado do projeto.

## Exemplo de resposta de duplicidade

```json
{
  "duplicate": false,
  "score": 0.25,
  "best_match": "Falha de login sem limitação de tentativas"
}
```

Interpretação:

- duplicate indica se a IA considerou o achado duplicado;
- score mostra a similaridade;
- best_match mostra o item mais parecido da lista.

## Como iniciar para testes locais

1. Subir a API da IA:

```bash
python -m backend.ai.api
```

2. Garantir que o Ollama está instalado e respondendo:

```bash
ollama --version
curl http://127.0.0.1:11434/api/tags
```

3. Abrir a tela de teste do frontend:

frontend/index.html

4. Testar os botões da interface.

## Observação importante

A tela atual em frontend é uma demonstração de integração. Quando o frontend final da equipe estiver pronto, a mesma lógica de chamadas deve ser reaproveitada dentro das telas reais do projeto.

## Arquivos relevantes

- backend/ai/api.py
- backend/ai/services/summarize.py
- backend/ai/prompts/summarizeFinding.txt
- backend/ai/prompts/remediationSuggestion.txt
- backend/ai/prompts/executiveSummary.txt
- backend/ai/prompts/duplicateCheck.txt
- frontend/app.js
- frontend/index.html