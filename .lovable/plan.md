
# BitraHub — Arquitetura Definitiva

> Documento de arquitetura. Nenhum código será escrito antes da sua aprovação.

> **Fase 1 em andamento** — fundação criada:
> - `tenants.type` (`personal|teacher|institution`) — default `institution`
> - Papel `coordenador` no enum `app_role`
> - Tabela `plan_entitlements` + função SQL `entitlements_can`
> - `src/core/entitlements/` (serviço + `FEATURES`)
> - `src/core/rbac/permissions.ts` (matriz central + `can()`)
> - Módulo piloto **`portal`** migrado: `src/modules/portal/{server,components}` + rota `/app/portal`
>
> **Fase 2 em andamento** — sistema acadêmico:
> - `is_tenant_staff` agora inclui `coordenador`
> - Bucket privado `submissions` + policies de leitura (dono ou staff) e escrita (dono)
> - Tabela `submission_files` (metadados dos anexos das entregas) com RLS
> - Server fns: `bulkImportStudents`, `attachSubmissionFile`, `listSubmissionFiles`, `deleteSubmissionFile`
> - UI Alunos: **Importar CSV** e **Exportar CSV** (com matrícula automática por nome de turma)
> - `session.isCoordenador` exposto no client

---

## 1. Visão de Produto

BitraHub é um **SaaS modular de educação** com uma única base de código atendendo três públicos:

- **P1 — Estudante Individual**: Portal do Aluno + Bitra AI + Biblioteca. Sem vínculo institucional.
- **P2 — Professor Particular**: cria sua própria "micro-escola" (alunos, cursos, turmas, chamada, materiais, IA).
- **P3 — Instituição**: hierarquia Admin → Coordenador → Professor → Aluno, com todos os módulos.

Princípio fundador: **o mesmo Core serve os três públicos**; o que muda é o **plano** (o que está liberado) e o **papel** (o que a pessoa pode fazer).

---

## 2. Camadas da Arquitetura

```text
┌─────────────────────────────────────────────────────────┐
│                       MÓDULOS                           │
│  Academic │ Portal │ Library │ AI │ Community │ Reports │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ (usam apenas serviços do Core)
                          │
┌─────────────────────────────────────────────────────────┐
│                        CORE                             │
│  Auth │ Tenancy │ RBAC │ Billing │ Credits │ Entitlements│
│  Notifications │ Audit │ Storage │ Events (bus)         │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│                       SHARED                            │
│  UI kit │ hooks │ utils │ types │ design tokens         │
└─────────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────────┐
│              PLATAFORMA (TanStack Start + Cloud)        │
│  DB (Postgres+RLS) │ Auth │ Storage │ Edge │ pgvector   │
└─────────────────────────────────────────────────────────┘
```

**Regra de ouro**: módulos **nunca** importam de outro módulo. Se precisam se comunicar, usam:
1. **Serviços do Core** (ex.: `credits.consume()`, `notifications.emit()`), ou
2. **Event Bus** interno (ex.: `activity.graded` → Portal atualiza, Gamification concede XP).

---

## 3. Modelo de Tenancy (chave para os 3 públicos)

Toda entidade "de negócio" pertence a um **tenant**. O que muda é o **tipo de tenant**:

| Tipo tenant     | Público                | Criado quando                          | Contém                          |
| --------------- | ---------------------- | -------------------------------------- | ------------------------------- |
| `personal`      | Estudante individual   | signup público sem convite             | 1 usuário (dono), sem alunos    |
| `teacher`       | Professor particular   | signup público "sou professor"         | dono + alunos + turmas          |
| `institution`   | Escola/universidade    | criado por super_admin ou self-serve   | hierarquia completa             |

Vantagem: **uma única árvore de RLS** (`tenant_id`) resolve isolamento para os três casos. Nada de código condicional "se for aluno individual, faz outra query".

---

## 4. Módulos (o que existe e responsabilidade)

Cada módulo é **desacoplado**: tem suas próprias rotas, componentes, server functions e (quando faz sentido) suas próprias tabelas.

| Módulo         | Responsabilidade                                                        | Depende do Core                     |
| -------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| **academic**   | Cursos, turmas, matrículas, chamada, atividades, notas                  | Auth, RBAC, Notifications, Audit    |
| **portal**     | Visão do aluno: minhas atividades, minhas notas, meu perfil, meu progresso | Auth, RBAC, Events                 |
| **library**    | Biblioteca colaborativa, upload, busca, reputação, moderação            | Storage, Credits, Audit             |
| **ai**         | Bitra AI (chat, memória, quizzes, planos de estudo)                     | Credits, Entitlements, Events       |
| **community**  | Perguntas, respostas, grupos, ranking, votos                            | RBAC, Credits (recompensas), Audit  |
| **billing**    | Planos, assinaturas, faturas, pagamentos                                | Auth, Entitlements                  |
| **reports**    | Dashboards e exports (CSV/PDF)                                          | Academic (leitura), Portal (leitura)|
| **admin**      | Super Admin (tenants globais, moderação global)                         | Todos (leitura)                     |

---

## 5. Estrutura de Pastas Alvo

```text
src/
  core/
    auth/                  # sessão, roles helpers, guards
    tenancy/               # current_tenant, tipo de tenant, quotas
    rbac/                  # has_role, has_permission, matrix
    entitlements/          # can_use_module, plan → módulos
    billing/               # planos, assinaturas (serviço)
    credits/               # ledger, wallets, consume/grant
    notifications/         # emit + templates
    audit/                 # audit_log service
    events/                # event bus interno (pub/sub client)
    storage/               # upload helpers, signed urls
  modules/
    academic/
      students/ classes/ courses/ enrollments/
      attendance/ activities/ grades/
      routes/ components/ server/          # *.functions.ts
    portal/
      dashboard/ activities/ grades/ profile/ progress/
      routes/ components/ server/
    library/
      catalog/ upload/ moderation/ ratings/ reputation/
      routes/ components/ server/
    ai/
      chat/ memory/ quizzes/ study-plans/ prompts/
      routes/ components/ server/
    community/
      threads/ answers/ groups/ ranking/
      routes/ components/ server/
    billing/
      plans/ checkout/ invoices/ webhooks/
      routes/ components/ server/
    reports/
    admin/
  shared/
    ui/                    # design system (shadcn wrapping)
    components/            # componentes verdadeiramente cross-módulo
    hooks/
    lib/                   # utils puros
    types/
  routes/                  # TanStack file-based (importa dos módulos)
  integrations/supabase/   # gerado, não editar
```

**Regras estruturais**:
- `modules/X` **não** importa `modules/Y`. Se precisa, passa pelo Core.
- `shared/` só código sem regra de negócio.
- `routes/` são finas: importam a página do módulo correspondente.

---

## 6. RBAC — Papéis e Permissões

**Papéis** (enum `app_role`):
`super_admin`, `admin_instituicao`, `coordenador`, `professor`, `aluno`.

Papéis são **por tenant** (exceto `super_admin`, que é global). Um mesmo usuário pode ter papéis em tenants diferentes (ex.: professor numa escola e aluno individual em seu tenant pessoal).

**Modelo**: RBAC estático + **permission matrix** central (não espalhar `if role === ...` pelo código).

```text
Recurso        | super | admin | coord | prof | aluno
---------------|-------|-------|-------|------|------
class.manage   |   ✓   |   ✓   |   ✓   |  ✓*  |  —
grade.write    |   ✓   |   ✓   |   ✓   |  ✓*  |  —
attendance.take|   ✓   |   ✓   |   ✓   |  ✓*  |  —
activity.submit|   —   |   —   |   —   |   —  |  ✓
library.upload |   ✓   |   ✓   |   ✓   |  ✓   |  ✓
ai.chat        |   ✓   |   ✓   |   ✓   |  ✓   |  ✓
```
`*` = restrito às turmas atribuídas ao professor (via `class_teachers`).

---

## 7. Entitlements (Planos → Módulos)

Sistema **centralizado**. Uma tabela `plan_entitlements` mapeia plano → features. Nenhum módulo verifica plano diretamente; todos chamam `entitlements.can(userId, "ai.chat")`.

| Plano             | Público-alvo      | Módulos liberados                                             |
| ----------------- | ----------------- | ------------------------------------------------------------- |
| **Free**          | Estudante         | Portal, AI (créditos limitados), Library (leitura)            |
| **Student+**      | Estudante         | Free + Library (upload), AI (créditos ampliados), Community   |
| **Teacher**       | Professor particular | Academic (limites), Portal, AI, Library, Community         |
| **Institution**   | Escola            | Tudo, sem limites de módulo (limites quantitativos por tier)  |

**Quotas** (número de alunos, storage, créditos IA/mês) ficam em `plan_limits`, consultadas antes de ações críticas.

---

## 8. Sistema de Créditos

**Modelo de ledger (append-only)** — nunca "descontar" mutando saldo; toda transação é uma linha.

Tabelas:
- `credit_wallets` (uma por usuário, com saldos derivados dos 3 buckets).
- `credit_transactions` (imutável): `user_id`, `bucket` (`free|earned|purchased`), `delta`, `reason`, `ref_type`, `ref_id`, `created_at`.
- `credit_grants` (regras de concessão: renovação mensal do bucket free, recompensa por contribuição, compra Stripe).

**Regras de consumo (ordem)**: `free` → `earned` → `purchased`.
Motivo: gastar primeiro o que expira/renova, preservar o que o usuário conquistou/pagou.

**Buckets**:
| Bucket      | Origem                           | Expira?         |
| ----------- | -------------------------------- | --------------- |
| `free`      | Renovação mensal por plano       | Sim, no ciclo   |
| `earned`    | Contribuições (upload aprovado, resposta bem votada, moderação) | Não |
| `purchased` | Compra via billing               | Não             |

Serviço `credits.consume({ user, amount, feature, ref })` é **atômico** (transação DB), retorna erro se saldo insuficiente e emite evento `credits.consumed`.

---

## 9. Modelo de Dados (por domínio)

### Core
- `tenants` (id, tipo, plan, status, owner_user_id)
- `profiles` (id=auth.uid, tenant_id, full_name, email, avatar_url)
- `user_roles` (user_id, tenant_id, role)
- `invites` (token, tenant_id, email, role, expires_at, status)
- `audit_log` (actor, action, resource_type, resource_id, tenant_id, meta jsonb)
- `notifications` (user_id, channel, template, payload, read_at)
- `subscriptions` (tenant_id, plan, status, current_period_end, stripe_customer_id)
- `plan_entitlements` (plan, feature_key, enabled, limit)
- `credit_wallets`, `credit_transactions`, `credit_grants`
- `events_outbox` (para pub/sub confiável)

### Academic
- `courses`, `classes`, `class_teachers`
- `students`, `enrollments`
- `attendance_sessions`, `attendance_records`
- `activities`, `activity_attachments`, `activity_targets`
- `submissions`, `submission_files`
- `grades` (nota consolidada por atividade+aluno; feedback)

### Portal
- Sem tabelas próprias — projeta em cima do Academic.
- `student_progress` (agregados materializados: % de atividades, média, presença).

### Library
- `library_items` (tenant_id nullable = global, title, description, subject, level, language, license, author, institution)
- `library_files` (storage_key, size, mime)
- `library_tags` + `library_item_tags`
- `library_ratings` (user, item, rating, review)
- `library_stats` (views, downloads, ai_summaries)
- `library_reports` (denúncias)
- `library_moderation` (status, moderator, decision)
- `content_hashes` (evitar duplicidade — hash SHA-256 do arquivo)
- `user_reputation` (score, badges) — usado em Library e Community

### Bitra AI
- `ai_conversations` (user, tenant, title, module_context)
- `ai_messages` (conversation, role, content, tokens, credits_spent)
- `ai_memory` (user, kind: `preference|weakness|topic_studied|goal`, key, value jsonb, updated_at)
- `ai_embeddings` (owner_type, owner_id, embedding vector, source) — via **pgvector**
- `ai_quizzes` (user, subject, difficulty, questions jsonb)
- `ai_quiz_attempts` (score, breakdown)
- `study_plans` (user, goal, schedule jsonb, progress)

### Community
- `threads`, `posts`, `votes`, `groups`, `group_members`
- `bounties` (créditos oferecidos por resposta)
- `reports` (moderação)

### Gamificação
- `xp_events` (user, source, amount)
- `user_levels` (derivado)
- `achievements`, `user_achievements`
- `streaks` (user, kind, current, longest, last_at)
- `challenges`, `challenge_progress`
- `leaderboards` (view materializada por período)

---

## 10. Bitra AI — Treinador Pessoal

Não é chatbot; é **memória + planejamento**.

**Camadas**:
1. **Short-term**: últimas N mensagens da conversa atual (janela de contexto).
2. **Long-term semântica**: `ai_embeddings` com pgvector (materiais estudados, resumos gerados, dúvidas recorrentes).
3. **Long-term estruturada**: `ai_memory` com fatos-chave (`weakness: "derivadas"`, `goal: "ENEM 2026"`, `preference: "explicações visuais"`).
4. **Sinais de desempenho**: `ai_quiz_attempts`, `student_progress` → alimenta escolhas de revisão.

**Fluxo de uma pergunta**:
```text
user → retrieve(ai_memory + top-k embeddings) → compose prompt
     → LLM (via AI Gateway) → resposta
     → update ai_memory (extrai fatos) + append embedding
     → debita créditos (bucket order) → emit ai.message.sent
```

**Isolamento**: memória é **por usuário**, nunca vaza entre tenants. RLS estrita.

---

## 11. Biblioteca Inteligente

**Metadados ricos** (ver seção 9). **Busca**: full-text (`tsvector`) + embeddings semânticos.

**Anti-duplicidade**: `content_hashes` — antes de aceitar upload, hash do arquivo é comparado; se existir, sugere o item existente e permite "curtir/salvar" em vez de duplicar.

**Moderação**:
- Fila `library_moderation` (status: `pending|approved|rejected`).
- Denúncias entram em `library_reports` com motivo (direito autoral, conteúdo ofensivo, spam).
- Ação de moderador é registrada no `audit_log`.
- Uploads suspeitos (arquivo grande + autor sem reputação + palavras-chave) entram em pré-moderação automática.

**Reputação** (`user_reputation`): sobe com uploads aprovados, avaliações positivas, contribuições comunitárias; cai com denúncias procedentes. Limites de upload/dia escalam com reputação.

**Licenciamento**: campo `license` obrigatório (CC-BY, CC-BY-SA, autoral com permissão, domínio público). Uploads "autoral" exigem checkbox de declaração — registrado no `audit_log`.

---

## 12. Gamificação

- **XP** por: entregar atividade no prazo, acertar quiz, ajudar na comunidade, streak diária.
- **Níveis** derivados de XP (fórmula simples: `level = floor(sqrt(xp / 100))`).
- **Conquistas** (`achievements`): "Primeira nota 10", "7 dias seguidos", "Contribuiu com material aprovado".
- **Streaks**: por atividade diária no portal ou no AI.
- **Metas**: usuário define; sistema acompanha.
- **Ranking**: por turma, por escola, global (opt-in por privacidade).
- **Integração com créditos**: certas conquistas concedem `earned` credits (loop virtuoso).

---

## 13. Escalabilidade

Decisões que sustentam milhares de instituições/milhões de itens:

1. **Multi-tenant single-DB com RLS**: barato de operar; particiona por `tenant_id` quando alguma tabela crescer demais (Postgres partitioning por hash).
2. **Índices críticos** já no design: `(tenant_id, created_at)`, `(class_id, session_date)`, `(user_id, feature)` no ledger.
3. **Ledger append-only** para créditos e XP: escrita rápida, saldo agregado por materialized view refrescada em janelas.
4. **pgvector com HNSW** para embeddings; particionamento por `owner_type`.
5. **Event Bus via outbox pattern** (`events_outbox`): server function grava evento no mesmo commit; worker consome e dispara notificações/gamificação. Nada de dependência síncrona entre módulos.
6. **Edge functions apenas para webhooks/cron**; app-internal usa `createServerFn` (TanStack Start).
7. **Cache**: TanStack Query no cliente; agregados de dashboard em views materializadas.
8. **Storage**: buckets por domínio (`library`, `submissions`, `avatars`) com policies próprias e URLs assinadas.
9. **Rate limiting** por rota crítica (login, invite, ai.chat, library.upload) — tabela `rate_limits` ou headers do gateway.
10. **Observabilidade**: Sentry (erros) + logs estruturados nas server functions + PostHog (produto).

---

## 14. Segurança Transversal

- RLS em **toda** tabela pública; GRANTs explícitos por role.
- Funções `SECURITY DEFINER` centralizadas: `current_tenant_id`, `has_role`, `has_permission`, `teaches_class`, `is_tenant_admin`, `is_super_admin`.
- Papéis **nunca** no `profiles` — sempre em `user_roles`.
- Auditoria obrigatória em: criar/deletar tenant, mudar plano, promover/rebaixar role, moderar biblioteca, revogar convite, ajuste manual de créditos.
- HIBP (leaked password) + Google OAuth + reset flow.
- CSP e headers no host.

---

## 15. Roadmap Técnico (10 fases)

| Fase | Nome                             | Objetivo                                                                                          | Entregáveis-chave                                                                 |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | **Refatoração da arquitetura**   | Adotar `src/modules/*` + `core/*`, extrair `entitlements`, matriz RBAC, event bus, tipos de tenant | Nova pasta, migração incremental sem quebra, `plan_entitlements`, `tenant.type`   |
| 2    | **Sistema acadêmico maduro**     | Fechar lacunas: import CSV, coordenador, uploads em atividades/entregas, boletim                  | Papel `coordenador`, storage bucket, CSV import, export PDF                       |
| 3    | **Portal do aluno completo**     | Portal 100% real (sem mock), progresso agregado, notificações                                     | `student_progress`, notificações in-app                                           |
| 4    | **Professor Particular**         | Signup público "sou professor" → tenant `teacher`, onboarding, limites                            | Fluxo de cadastro, wizard, `plan_limits`                                          |
| 5    | **Aluno Individual**             | Signup público "sou estudante" → tenant `personal`, Portal + AI básico                            | Onboarding leve, entitlements para plano Free                                     |
| 6    | **Sistema de Créditos**          | Ledger, wallets, 3 buckets, consumo atômico, renovação mensal                                     | Tabelas + `credits.consume`, UI de saldo                                          |
| 7    | **Biblioteca Inteligente**       | Upload, metadados, busca, moderação, reputação, anti-duplicidade                                  | Tabelas library, storage, fila de moderação, busca híbrida                        |
| 8    | **Bitra AI**                     | Chat + memória curta/longa + embeddings + quizzes + planos de estudo                              | pgvector, `ai_memory`, integração AI Gateway, cobrança por créditos               |
| 9    | **Comunidade + Gamificação**     | Q&A, votos, bounties em créditos, XP, conquistas, streaks, ranking                                | Tabelas community + gamificação, event handlers                                   |
| 10   | **Marketplace (avaliar)**        | Venda de cursos/materiais premium por criadores, split de receita                                 | Só após dados de tração; requer billing avançado                                  |

**Pré-condições cruzadas**:
- Fase 6 (Créditos) precisa existir **antes** da Fase 8 (AI) para controlar custo.
- Fase 1 (Refatoração) **antes** de qualquer módulo novo — evita retrabalho.
- Fase 4 e 5 dependem de entitlements funcionando (Fase 1).

---

## 16. O que **não** vou fazer sem sua aprovação explícita

- Mover arquivos existentes para `src/modules/*` (mudança estrutural grande).
- Introduzir novas tabelas (créditos, biblioteca, AI, gamificação).
- Adicionar `tenant.type` (`personal|teacher|institution`) e o papel `coordenador`.
- Ligar pgvector, event outbox ou qualquer nova extensão.

---

## Próximo passo (após sua aprovação)

Iniciar **Fase 1 — Refatoração da Arquitetura**, na seguinte ordem incremental (sem quebrar o app em uso):

1. Criar `src/core/` e `src/modules/` vazios, mover 1 módulo piloto (sugestão: `portal`) para validar o padrão.
2. Introduzir `plan_entitlements` + serviço `entitlements` (sem forçar planos ainda — tudo liberado por padrão).
3. Introduzir `tenant.type` com default `institution` para os existentes.
4. Extrair matriz RBAC central e substituir checks espalhados.
5. Depois, migrar módulo por módulo (`academic`, `library` só quando existir, etc.).

Aguardo sua aprovação (ou ajustes) para começar pela Fase 1.
