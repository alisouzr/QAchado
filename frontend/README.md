# 🛡️ QAchado — Guia de Integração Backend

Bem-vindo(a) ao repositório do **QAchado**. O Frontend desta aplicação foi construído em **Next.js** utilizando o **Padrão de Serviços (Service Pattern)**.

> 💡 **O que isso significa?** Toda a comunicação de dados está isolada em arquivos específicos dentro da pasta `app/services/`. Nenhuma página (UI) faz requisições diretas. Para integrar o Backend, você não precisará alterar o código das telas. Basta desligar a simulação (*Mock*) e configurar as rotas (*Endpoints*) da API.

---

## 🚀 1. Configuração Global (A Chave Liga/Desliga)

Atualmente, o projeto está rodando em modo **MOCK** (usando o `localStorage` para simular o banco de dados). Para ativar as requisições HTTP reais, siga estes passos:

1. Crie um arquivo `.env.local` na raiz do projeto Frontend e defina a URL base da sua API:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api

2. Abra cada arquivo dentro de app/services/:
    - aiService.ts

    - dashboardService.ts

    - projectService.ts

    - userService.ts

    - vulnerabilityService.ts

3. Dentro de cada um deles, altere a constante USE_MOCK para false:
    ```env
    TypeScript
    const USE_MOCK = false;

## 🔗 2. Contrato de API (Endpoints Necessários)
Abaixo estão as rotas que o Frontend espera consumir através dos serviços.

### 🧠 IA (Inteligência Artificial) — aiService.ts
Responsável por gerar resumos de vulnerabilidades com base na descrição técnica fornecida.

  - POST /ai/resumo

    - Payload (Body):
      ```env
      JSON
      { "context": "texto detalhado da vulnerabilidade..." }
    
    - Retorno Esperado:
      ```env
      JSON
      { "resumo": "Texto resumido gerado pela IA" }

### 📁 Projetos — projectService.ts
Gerenciamento dos escopos de teste.

- GET /projetos

    - Retorno Esperado: Array de projetos com a propriedade achadosCount (total de vulnerabilidades ativas daquele projeto).

- POST /projetos

    - Payload (Body):
      ```env
      JSON
      { 
        "name": "Nome do Projeto", 
        "description": "Descrição aqui", 
        "aiSummary": "Resumo opcional" 
      }

- PATCH /projetos/:id

    - Payload (Body):
      ```env
      JSON
      { "aiSummary": "Novo resumo atualizado pela IA" }

### 🐛 Vulnerabilidades — vulnerabilityService.ts
O núcleo do fluxo de vida das falhas. O atributo status transita estritamente entre:
'ABERTO', 'ATRIBUÍDO', 'EM PROGRESSO', 'PRONTO PARA RETESTE' e 'CONCLUÍDO'.

- POST /vulnerabilidades → Cadastro de nova falha.

- GET /projetos/:projetoId/vulnerabilidades → Para popular o Kanban do QA.

- GET /vulnerabilidades/abertas → Para o QA selecionar falhas para atribuir aos Devs.

- GET /vulnerabilidades/dev/:initials → Para listar as tarefas na tela do Dev logado.

- PATCH /vulnerabilidades/:id/status → Atualiza a coluna do Kanban/Status.

- PATCH /vulnerabilidades/:id/atribuir

    - Payload (Body):
      ```env
      JSON
      { 
        "assigneeInitials": "AS", 
        "status": "ATRIBUÍDO" 
      }
### 📊 Dashboard — dashboardService.ts
Consolida métricas e dados para os gráficos da aplicação.

- GET /dashboard?role={QA|DEV}&initials={iniciais}

    - Regra de Negócio: Se role=QA, retornar visão global. Se role=DEV, retornar apenas dados das tarefas atribuídas àquele usuário específico através das suas iniciais.

    - Retorno Esperado:
      ```env
      JSON
      {
        "metrics": { 
          "totalProjects": 0, 
          "openVulnerabilities": 0, 
          "criticalVulnerabilities": 0 
        },
        "pieData": [ 
          { "name": "Crítica", "value": 0, "color": "#ef4444" }
        ],
        "lineData": [ 
          { "name": "Jan", "dev": 0 }
        ]
      }
### 👥 Usuários e Devs — userService.ts & Autenticação
- GET /users/devs

    - Retorno Esperado: Array de perfis de Devs contendo as propriedades id, name, initials, specialty e cargaAtual (quantidade de tarefas em andamento deste Dev).

### 🔐 Fluxo de Autenticação (AuthContext.tsx / Login / Cadastro)
O fluxo de login e cadastro atualmente está completamente mockado no frontend (salvo temporariamente em memória). É necessário implementar os endpoints de:

1. POST /auth/register (Cadastro): Incluindo o envio do campo specialty se o cargo (role) selecionado for DEV.

2. POST /auth/login (Login): Retornando o Objeto do usuário autenticado juntamente com um Token/Sessão.

## 📂 3. Estrutura de Pastas do Frontend
Para se guiar pelo repositório e entender onde as integrações acontecem:

    
    app/
    ├── components/   # Componentes visuais isolados (Ex: Menu lateral, Layout base)
    ├── context/      # Lógica de autenticação e sessão global (AuthContext.tsx)
    ├── services/     # 🎯 Seu principal foco. Camada de dados que faz o fetch para a API
    └── (telas)/      # app/vulnerabilidades/, app/projetos/, app/atribuicoes/, etc.
                      # (Páginas do Next.js. Não altere nada de integração de dados aqui)
                      
## ⚠️ Observações Importantes
📁 Upload de Evidências: A tela de criação de vulnerabilidade permite arrastar arquivos de imagem/texto para evidências. Atualmente o Frontend retém isso no estado React evidencias. O Backend precisará definir a estratégia de armazenamento (Ex: Retornar Presigned URLs do S3 ou criar um endpoint que aceite multipart/form-data).

🌐 CORS: Lembre-se de liberar e configurar o CORS da sua API backend para aceitar requisições vindas do endereço do Frontend em ambiente de desenvolvimento (geralmente rodando em http://localhost:3000).