
# Sprint MVP Acadêmico — Fluxo Ponta-a-Ponta

Entendido e alinhado. Direção estratégica **sua**; arquitetura **minha**. Nada de reescrita. Vamos consolidar o que já existe até o fluxo abaixo funcionar sem falhas em produção:

```text
Workspace → Admin → Cursos → Turmas → Professores → Alunos
  → Matrículas → Chamada → Atividades → Entrega → Notas
  → Portal do Aluno → Relatórios → Dashboard
```

Professor Particular, Estudante Individual, Bitra AI, Biblioteca, Créditos, Comunidade e Gamificação **permanecem apenas como arquitetura** (tabelas/flags/permissões já existentes ou a criar sem UI). Sem telas, sem consumo, sem código morto na interface.

---

## Princípios desta sprint

1. **Zero features novas** fora do fluxo acadêmico.
2. **Refatorar só quando um bug ou inconsistência exigir.**
3. Toda ideia nova → registrada em `.lovable/roadmap.md`, não implementada.
4. Cada etapa entrega algo utilizável antes de passar para a próxima.
5. Feature flags (`plan_entitlements`) já existentes controlam módulos não-MVP → mantidos `enabled=false`.

---

## Fase 0 — Auditoria (antes de tocar em código)

Objetivo: mapear exatamente o estado atual do fluxo, sem suposições.

- Varredura de cada rota `_authenticated.app.*` já existente (cursos, turmas, alunos, chamada, atividades, notas, relatórios, portal).
- Para cada tela: identificar (a) botões que não fazem nada, (b) estados de erro não tratados, (c) queries quebradas, (d) permissões inconsistentes, (e) loading/empty states faltando.
- Verificar RLS e GRANTs de todas as tabelas do fluxo (`courses`, `classes`, `class_teachers`, `students`, `enrollments`, `attendance_sessions`, `attendance_records`, `activities`, `submissions`, `submission_files`).
- Saída: checklist priorizado em `.lovable/plan.md` (seção "MVP Acadêmico — Backlog"), sem escrever código ainda.

## Fase 1 — Fundamentos do Workspace

- Garantir onboarding do admin: ao criar tenant institucional, redirecionar para setup mínimo (nome da escola, primeiro ano letivo).
- Tela `/app` (dashboard raiz) deve refletir estado real: nº de cursos, turmas, professores, alunos, atividades pendentes.
- Convites (`invites`): validar fluxo completo admin → professor → aluno. Corrigir estados órfãos (convite expirado, e-mail já cadastrado, papel duplicado).

## Fase 2 — Estrutura acadêmica (Cursos → Turmas → Vínculos)

- CRUD de **Cursos**: já existe, revisar UX (validações, confirmações de exclusão, estados vazios).
- CRUD de **Turmas** vinculadas a curso e ano letivo.
- Vínculo **Professor ↔ Turma** (`class_teachers`) com UI clara: adicionar/remover, ver turmas do professor.
- Import CSV de alunos → já existe; garantir mensagens de erro linha-a-linha e preview antes de confirmar.
- Matrículas (`enrollments`): mover aluno entre turmas, desativar matrícula, histórico.

## Fase 3 — Operação diária (Chamada + Atividades + Entregas + Notas)

- **Chamada**: sessão por data/turma, marcação em lote, edição de sessão passada com audit.
- **Atividades**: criar com prazo, anexo do professor, rubrica simples (nota máxima).
- **Entrega**: aluno faz upload no bucket `submissions` (já existe), professor vê lista consolidada com status (entregue/atrasado/faltando).
- **Correção + Nota**: professor atribui nota e feedback textual; aluno vê no portal.
- Regras: professor só vê turmas dele (`teaches_class`), coordenador/admin veem tudo do tenant, aluno só o próprio.

## Fase 4 — Portal do Aluno

- Já existe stub (`PortalOverview`). Preencher com dados reais:
  - Minhas atividades (a fazer / entregues / corrigidas).
  - Minhas notas por matéria.
  - Minha frequência (% presença por turma).
  - Próximos prazos.
- Sem gamificação, sem IA, sem biblioteca. Só o essencial.

## Fase 5 — Relatórios + Dashboard

- **Dashboard institucional** (admin/coordenador): total de alunos ativos, taxa média de presença, taxa de entrega de atividades, alunos em risco (baixa presença ou notas).
- **Dashboard do professor**: suas turmas, entregas pendentes de correção, média por turma.
- **Relatórios exportáveis**:
  - Frequência por turma (CSV).
  - Notas por turma / por aluno (CSV).
  - Boletim simples do aluno (PDF, layout único; se PDF virar risco de escopo, adiar para pós-MVP e entregar HTML imprimível).

## Fase 6 — Estabilização

- Testes manuais roteirizados dos 3 papéis (admin, professor, aluno) do início ao fim.
- Correção de bugs encontrados.
- Loading/empty/error states padronizados.
- Documentação em `.lovable/architecture.md`: decisões, RLS, matriz RBAC, feature flags.

---

## Arquitetura "prevista mas desligada" (sem UI, sem código de consumo)

Apenas migrações estruturais quando necessário para não quebrar o modelo depois. Nada disso ganha tela nesta sprint.

- **Bitra AI**: tabelas `ai_conversations`, `ai_messages`, `ai_usage_events` + entitlement `ai.chat` desligado. Nenhum client, nenhuma edge function.
- **Biblioteca**: tabelas `library_items`, `library_item_tags`, `library_reviews` + entitlements `library.read/upload` desligados.
- **Créditos**: tabelas `credit_wallets`, `credit_ledger` (append-only) + função `credits_consume` — criadas mas não chamadas por lugar nenhum.
- **Comunidade**: `community_posts`, `community_answers`, `community_votes` — só schema.
- **Gamificação**: `achievements`, `user_achievements`, `streaks` — só schema.

Essas migrações **só entram se e quando** uma fase do MVP as tornar realmente necessárias para não travar depois. Preferência: **nem criar agora** — deixar em `.lovable/roadmap.md` como "schema pronto para escrever". Só antecipar o que tenha risco alto de acoplar com o fluxo acadêmico.

---

## Detalhes técnicos

- Stack existente: TanStack Start + Supabase (Lovable Cloud), server functions com `requireSupabaseAuth`, RBAC via `src/core/rbac` e entitlements via `src/core/entitlements`.
- Padrão de dados: sempre `ensureQueryData` no loader + `useSuspenseQuery` no componente.
- Toda tabela nova → GRANTs + RLS + policies na mesma migração.
- Nada de `supabaseAdmin` para leitura comum.
- Sidebar continua com gates declarativos (`usePermission` / `useEntitlement`) — módulos desligados somem automaticamente.

---

## Entregável desta resposta

Aprovação do plano. Depois disso, executo **Fase 0 (auditoria)** e volto com o backlog priorizado antes de tocar em qualquer código de feature. Nenhum módulo fora do MVP receberá UI nesta sprint.
