# Modules

Cada módulo é auto-contido: rotas, componentes e server functions.

**Regra de ouro**: módulos não importam de outros módulos. Se precisam se
comunicar, usam serviços do `core/` (ex.: `entitlements.can`, event bus).

Módulos planejados:

- `academic/` — cursos, turmas, chamada, atividades, notas
- `portal/` — visão do aluno (módulo piloto da refatoração)
- `library/` — biblioteca colaborativa
- `ai/` — Bitra AI
- `community/` — Q&A, grupos, ranking
- `billing/` — planos e faturas
- `reports/` — dashboards e exports
- `admin/` — super admin