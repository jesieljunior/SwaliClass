# Checklist para colocar o BitraHub em produção

Panorama rápido: o app tem multi-tenant, auth, chamada, alunos, turmas, cursos e relatórios reais + módulo de Atividades/Notas/Perfil em **mock**. Auth de aluno, persistência de atividades, e-mails, PWA offline, pagamentos e observabilidade ainda não existem.

## 1. Persistência real do módulo Atividades (hoje é 100% mock)
- Tabelas: `activities`, `activity_targets` (turma/aluno), `submissions` (com `grade`, `feedback`, `status`), `activity_comments`.
- RLS por tenant + policies de aluno (só vê próprias entregas) e professor (só das suas turmas).
- Server functions: criar/listar/editar atividade, marcar como concluída, lançar nota + comentário.
- Substituir `mock-activities.ts` nas telas `/atividades`, `/notas`, `/perfil`.
- Upload de arquivos (bucket `submissions`) — postergado, mas planejar o bucket + policies agora.

## 2. Portal do Aluno de verdade
- Hoje o "modo Aluno" é só um toggle de simulação (`view-mode.tsx`). Falta:
  - Papel `aluno` no enum `app_role` + `user_roles`.
  - Vincular `students.id` ao `auth.users.id` (coluna `user_id` opcional em `students`).
  - Fluxo de convite/self-signup do aluno (link enviado pela escola).
  - Gate real por role no roteamento (`/notas`, `/perfil` só para aluno; `/chamada`, `/turmas` só para professor/admin).
  - Remover ou esconder o `ViewModeToggle` em produção.

## 3. Papel de Professor
- Adicionar role `professor` e tabela de vínculo `class_teachers` (ou usar `classes.teacher_id` já existente).
- Policies: professor só vê/edita turmas e atividades onde é titular.
- Filtros de "minhas turmas" nas listas.

## 4. Convites e e-mails transacionais
- Hoje `createTenant` gera `invite_token` mas não envia e-mail — o super admin precisa copiar o link manualmente.
- Configurar domínio de e-mail (Resend/SES via connector) e enviar: convite de admin, convite de professor, convite de aluno, reset de senha, notificação de nova atividade / nota lançada.
- Template do e-mail com URL absoluta apontando para `/accept-invite?token=…`.

## 5. Auth hardening
- Ativar **Leaked Password Protection (HIBP)**.
- Configurar Google OAuth (hoje só e-mail/senha).
- Rate limit no `acceptInvite` e no login (Supabase Auth já tem, mas revisar).
- Página de reset de senha existe — validar fluxo ponta-a-ponta em produção.
- Confirmar que o `redirect_uri` do OAuth aponta para rota pública (`/auth/callback`), não protegida.

## 6. Billing / planos
- `tenants.plan` existe (starter/professional/business/enterprise) mas não há cobrança.
- Integrar Stripe: checkout, webhook `/api/public/webhooks/stripe`, atualização de `tenants.status` (trial → active → past_due → canceled).
- Enforcement de limites por plano (nº de alunos, turmas, storage).
- Página `/app/plano` para o admin ver/mudar plano e ver fatura.

## 7. Dashboard e Relatórios
- Dashboard já usa `getDashboardStats` real ✅.
- Relatórios: revisar performance com muitos alunos (paginação, índices em `attendance_records(session_id)`, `attendance_records(student_id, session_date)`).
- Export CSV/PDF de boletim de frequência por aluno/turma.

## 8. PWA e mobile
- Manifest + ícones ✅.
- **Falta:** Service Worker (Workbox/vite-plugin-pwa) com cache de shell + fila offline para chamada (IndexedDB → sincroniza quando volta online). Esse era o próximo passo antes do desvio para Atividades.
- Testar "Adicionar à tela inicial" em iOS/Android reais.

## 9. Observabilidade e operação
- Error tracking (Sentry) no client e nos server functions.
- Logs estruturados nos server functions críticos (invite, tenant create, billing webhook).
- Analytics de produto (PostHog ou Plausible) em rotas públicas.
- Backup do banco: confirmar retenção do Lovable Cloud e documentar restore.
- Página `/status` ou health check público.

## 10. Segurança
- Última varredura foi ok, mas antes do go-live: rodar `security--run_security_scan` de novo, checar linter Supabase.
- Revisar todas as policies TO anon (hoje só `invites` sem token, o resto é `authenticated`).
- CSP/headers de segurança no `__root.tsx` (X-Frame-Options via meta é limitado — configurar no host se possível).
- Auditoria (tabela `audit_log`) para ações sensíveis: criar/deletar tenant, promover role, revogar convite.

## 11. Conteúdo público e legal
- Landing page (`/`) — hoje existe mas revisar copy final, screenshots, preço.
- Páginas: `/precos`, `/sobre`, `/contato`, `/termos`, `/privacidade`, `/lgpd` (com DPO/contato).
- Meta tags og:image por rota pública (usar `imagegen` para gerar hero).
- Cookie banner (se usar analytics com cookies).

## 12. SEO e domínio
- Comprar/conectar domínio (`bitrahub.com.br` ou similar) via Project Settings → Domains.
- `robots.txt` liberando só rotas públicas; `sitemap.xml` gerado.
- `og:image` absoluta por rota pública.

## 13. Onboarding do novo tenant
- Wizard após aceitar o convite: nome da escola confirmado → criar 1º curso → 1ª turma → importar alunos (CSV).
- Import CSV de alunos (hoje só cadastro 1 a 1).
- Tour guiado (opcional, Shepherd/react-joyride).

## 14. Qualidade e QA
- Testes E2E críticos com Playwright: signup → convite → chamada → relatório.
- Verificar build de produção (`bun run build`) sem warnings.
- Lighthouse ≥ 90 em mobile na landing e no `/app`.
- Testar em Safari iOS (PWA) e Chrome Android.

## 15. Documentação
- README com setup local + variáveis.
- Guia do usuário final (Notion/página `/ajuda`).
- Runbook interno: como criar tenant, como reenviar convite, como pausar assinatura.

---

## Ordem sugerida de execução (MVP para 1ª escola paga)
1. **Persistência de Atividades** (item 1) — desbloqueia o valor principal.
2. **Portal do Aluno real** (item 2) + **Professor** (item 3).
3. **E-mails transacionais** (item 4) — sem isso convite não escala.
4. **Auth hardening** (item 5) e nova varredura de segurança.
5. **Billing Stripe** (item 6) — só depois que houver escola pagante confirmada.
6. **Observabilidade** (item 9) e **QA E2E** (item 14).
7. **PWA offline** (item 8) e **Import CSV** (item 13).
8. **Landing + legal + domínio** (itens 11, 12) e **publish**.

Posso começar por qualquer item — meu voto é seguir por 1 → 2 → 4, que é o caminho crítico para uma primeira escola usar de verdade.
