# Modules

Cada módulo é auto-contido: componentes e server functions.

**Estrutura de pastas por módulo:**

- `components/` — UI do módulo
- `*.functions.ts` — server functions (NÃO usar pasta `server/` — bloqueada pelo import-protection do TanStack Start)
- `*.server.ts` — helpers 100% server-only (bloqueados no bundle client)

**Regra de ouro**: módulos não importam de outros módulos. Se precisam se
comunicar, usam serviços do `core/` (ex.: `entitlements.can`, event bus).

Módulos planejados:

- `academic/` — cursos, turmas, chamada, atividades, notas
- `portal/` — visão do aluno (módulo piloto da refatoração)
- `library/` — biblioteca colaborativa
- `ai/` — Swali AI
- `community/` — Q&A, grupos, ranking
- `billing/` — planos e faturas
- `reports/` — dashboards e exports
- `admin/` — super admin
