
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

---

## MVP Acadêmico — Backlog priorizado (Fase 0 concluída)

Legenda: **[P0]** trava o fluxo. **[P1]** UX quebrada mas fluxo funciona. **[P2]** polimento.
Cada item vira commit próprio, na ordem abaixo. Nada fora dessa lista até o MVP fechar.

### Fase 1 — Fundamentos do workspace
1. ✅ [P0] **AppLayout redireciona aluno para longe do próprio portal.**
   `alunoAllowed` = `/app/(atividades|notas|perfil)` mas a sidebar oferece `/app/portal`. Aluno é jogado em `/app/atividades` toda vez. Incluir `portal` no regex e revisar a lista canônica de rotas do aluno num único lugar.
2. ✅ [P0] **Sidebar tenant hardcoded "COLÉGIO ALPHA"** e topbar avatar hardcoded "JD". Puxar `tenant.name` e iniciais do usuário via `useSession`.
3. [P1] **Onboarding do admin novo:** hoje cai num dashboard vazio sem próximos passos. Adicionar cartão "Primeiros passos" no `/app` (criar curso → turma → aluno → convidar professor) quando `totalStudents=0`. Sem wizard modal, apenas checklist inline.
4. [P1] **Convites — estados órfãos.** Botão "Convidar" no aluno regenera token mesmo se já houver convite pendente/aceito, sem aviso. Server fn deve retornar status (`pending`/`accepted`/`expired`) e a UI mostrar o estado antes de gerar novo link.
5. [P2] **Dashboard não filtra por professor.** Professor vê números do tenant inteiro. `getDashboardStats` deve escopar por `teaches_class` quando o usuário for professor (não admin).

### Fase 2 — Estrutura acadêmica
6. [P1] **Cursos**: sem confirmação clara ao excluir curso com turmas dentro. Verificar `class_count > 0` no server e bloquear com mensagem explícita.
7. [P1] **Turmas**: filtro por curso ausente; lista vira ruim com > 20 turmas. Adicionar seletor de curso + busca por nome.
8. [P1] **Turmas ↔ Professor**: o vínculo funciona no diálogo, mas não existe visão inversa "turmas deste professor". Adicionar seção simples em `perfil` do professor / ou aba na lista de professores. (Se ficar grande, adiar para Fase 5.)
9. [P1] **Import CSV alunos**: erros retornam apenas em toast agregado. Mostrar tabela dos erros linha-a-linha após import + preview antes de confirmar (client-side parse já existe).
10. [P2] **Matrícula histórico**: `enrollments.active` existe mas UI só permite matricular/remover — sem "desativar mantendo histórico". Trocar botão "Remover" por "Desativar matrícula" (soft) e um "Excluir matrícula" secundário.

### Fase 3 — Operação diária
11. ✅ [P0] **Entrega de atividade com arquivo real.** Aluno anexa arquivos (até 20 MB) no drawer da atividade; upload direto ao bucket `submissions` + `attachSubmissionFile`. Professor vê e baixa via signed URL (10 min) no drawer de correção. Sem preview embutido.
12. [P1] **Atividades — rubrica mínima.** Hoje nota é livre 0-10; sem `max_grade`. Adicionar coluna `max_grade numeric` (default 10) em `activities`, respeitar no `gradeSubmission` (validação server) e exibir "X / max" nas telas.
13. [P1] **Chamada — edição de sessão passada** funciona, mas não há indicação de "editado em". Adicionar `updated_at` visível + toast "Chamada atualizada".
14. [P1] **Chamada — status default**: alunos sem marca hoje viram `ausente` no `saveAttendance`. Explícito no UI: rótulo "Não marcado → contará como ausente".
15. [P2] **Atividades — filtro por turma/status** para o professor com muitas turmas. Selector simples no header.

### Fase 4 — Portal do aluno
16. [P1] **Portal sem frequência.** `getMyPortalOverview` não retorna % de presença por turma. Somar via `attendance_records` do próprio aluno e mostrar barra por turma.
17. [P1] **Portal — próximos prazos vs atividades já entregues** não distingue. Buscar submissão do aluno para cada atividade upcoming e esconder as entregues.
18. [P2] **Aluno — página `/app/notas`** duplica parcialmente o portal. Manter, mas linkar do Portal ("Ver todas as notas").

### Fase 5 — Relatórios + Dashboard
19. [P1] **Relatório de notas** inexistente. Reaproveitar padrão de `getReportData` para gerar `getGradesReport(class_id?, student_id?, period?)` com export CSV/Excel/PDF (já usa jspdf e xlsx). Sem boletim formatado ainda.
20. [P2] **Boletim simples do aluno (HTML imprimível)** — agrupar por matéria/turma, média por período. Sem PDF fancy; usar `window.print()` com CSS de impressão. Adiar PDF dedicado.
21. [P2] **Dashboard do professor**: entregas pendentes de correção, média por turma. Card único no `/app` visível quando `isProfessor && !isAdmin`.

### Fase 6 — Estabilização
22. 🟡 [P0] **Rotas sem `errorComponent`/`notFoundComponent`.** `defaultErrorComponent` + `defaultNotFoundComponent` adicionados no `createRouter` — cobre todas as rotas sem override. Boundaries específicos por rota podem ser adicionados sob demanda.
23. [P1] **`session.isAdmin` e `isAluno` espalhados** ainda existem em `alunos.tsx`, `chamada.tsx`, `notas.tsx`. Migrar para `usePermission` conforme os arquivos forem tocados.
24. [P1] **Empty/loading/error states padronizados** — extrair `<EmptyState/>`, `<LoadingBlock/>`, `<ErrorBlock/>` em `src/components/ui/`.
25. [P2] **`.lovable/architecture.md`** documentando decisões, RLS por tabela, matriz RBAC e feature flags atuais.

### Achados de banco (não bloqueantes, mas registrados)
- Todas as tabelas do fluxo já têm RLS + GRANT ao `authenticated` e políticas por tenant/role. OK.
- `activities` não tem `max_grade` (item 12).
- `enrollments.active` existe mas UI ignora (item 10).
- `attendance_sessions.updated_at` deve ser adicionado se ainda não existir (item 13).
- Storage `submissions` já é privado com signed URLs (10min). Já pronto para item 11.

### Fora do MVP (roadmap.md)
Bitra AI · Biblioteca · Créditos · Comunidade · Gamificação · Marketplace · Portal do responsável · SSO · Boletim PDF elaborado · Professor Particular UI · Estudante Individual UI.
