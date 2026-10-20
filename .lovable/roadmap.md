# BitraHub — Roadmap (parqueado)

Ideias e módulos **fora do MVP acadêmico atual**.
Cada item permanece aqui até que o usuário autorize explicitamente sua implementação.

## Módulos não-MVP (arquitetura opcional, sem UI)

### Bitra AI

- Tabelas planejadas: `ai_conversations`, `ai_messages`, `ai_usage_events`.
- Entitlement: `ai.chat`, `ai.generate_exercises`, `ai.summarize`.
- Integrações: Lovable AI Gateway (chat/completions, embeddings).
- Gate: `useEntitlement("ai.chat")`. Feature flag `enabled=false` por padrão.
- Não criar tabelas até que a Fase 1 do MVP feche e o usuário aprove.

### Biblioteca

- Tabelas: `library_items`, `library_item_tags`, `library_reviews`, `library_reports`.
- Storage: bucket `library` privado com signed URLs; público via CDN só após aprovação.
- Serviços: hash SHA-256 + embeddings pgvector (v2), busca full-text PT-BR.
- Moderação: fila `pending → approved/rejected`, reputação por usuário.

### Créditos

- Tabelas: `credit_wallets` (buckets `free`/`earned`/`purchased`), `credit_ledger` append-only.
- Função `credits_consume(_user_id, _amount, _reason)` atômica.
- Renovação mensal do bucket `free` via pg_cron (v2).
- Integração billing (Stripe/Paddle) em v1.2.

### Comunidade

- Tabelas: `community_posts`, `community_answers`, `community_votes`.
- Reputação compartilhada com Biblioteca.
- Bounties em créditos (v2).

### Gamificação

- Tabelas: `achievements`, `user_achievements`, `streaks`.
- Streak simples pode chegar antes; XP/níveis só em v2.

## Público-alvo não-MVP

### Professor Particular

- Arquitetura já suporta (`tenant.type='teacher'`, plano `teacher`).
- Sem UI dedicada. Onboarding, marca própria e billing Teacher Start → v1.1.

### Estudante Individual

- `tenant.type='personal'`, plano `free`.
- Sem UI. Landing, cadastro solo, upload PDF → v1.1.

### Instituição — extensões

- Portal do responsável.
- SSO (Google Workspace / Microsoft).
- Import Google Classroom.
- Boletim PDF formatado (v1.2 usa HTML imprimível).

## Melhorias adiadas (podem entrar após MVP)

- Chat interno professor/aluno.
- Notificações por e-mail (convite, atividade nova, correção).
- Mobile app nativo.
- API pública / SDK.
- Marketplace de cursos (v3).

## Regra

Nada deste arquivo vira código sem pedido explícito do usuário.
Quando o usuário aprovar um item, mover para `.lovable/plan.md` como fase nova.
