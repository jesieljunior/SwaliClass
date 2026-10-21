# Contexto Técnico: Pasta `supabase/` no Repositório

## Qual é o banco de dados oficial do SwaliClass?
O backend de produção oficial do **SwaliClass** é construído em **C# (.NET 9) com Entity Framework Core (EF Core 9) e PostgreSQL 16**, adotando **Clean Architecture** e isolamento rigoroso via **Global Query Filters** multi-tenant por organização (`TenantId`).

## Por que os arquivos do Supabase existem aqui?
Durante o ciclo inicial de prototipagem rápida e desenvolvimento da interface de usuário em React/TypeScript, o Supabase foi utilizado como camada de emulação de banco e geração ágil de schemas SQL relacionais.

No frontend atual:
1. **Ambiente Standalone / Demonstração Web:** O frontend conta com um mock client em memória (`src/integrations/supabase/mock-client.ts`) que espelha os schemas destas migrações, permitindo testar a interface de forma rápida sem exigir o container do PostgreSQL em execução.
2. **Ambiente de Produção / Docker Compose:** O frontend se conecta diretamente aos endpoints REST da API .NET 9 (`/api/v1/*`), onde todas as operações de persistência, autenticação JWT, controle de frequência e cálculo de evasão são executadas com garantia ACID no PostgreSQL via EF Core.

Os arquivos nesta pasta (`config.toml` e migrações SQL) são mantidos como **referência histórica de modelagem** e apoio para ambientes de teste estáticos.
