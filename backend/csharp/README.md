# SwaliClass Backend — C# .NET 9 & Clean Architecture

Backend corporativo multi-tenant em **C# (.NET 9)** desenvolvido com princípios de **Clean Architecture**, **Entity Framework Core 9**, **PostgreSQL** e testes automatizados com **xUnit**.

[![Build & Test](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![EF Core](https://img.shields.io/badge/EF%20Core-9.0-512BD4)](https://learn.microsoft.com/ef/core/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/xUnit-Passed-success?logo=xunit)](./SwaliClass.Tests)

---

## 🏛️ Clean Architecture (Organização da Solução)

A solução (`SwaliClass.sln`) é estruturada em 4 camadas desacopladas com fluxo unidirecional de dependências:

```
┌─────────────────────────────────────────────────────────────┐
│                      BitraHub.WebApi                        │
│   ASP.NET Core 9 · Controllers REST · JWT Bearer · Swagger  │
└──────────────────────────────┬──────────────────────────────┘
                               │ depende de
┌──────────────────────────────▼──────────────────────────────┐
│                    BitraHub.Application                    │
│      DTOs · Contratos de Caso de Uso · Interfaces ICurrent  │
└──────────────────────────────┬──────────────────────────────┘
                               │ depende de
┌──────────────────────────────▼──────────────────────────────┐
│                      BitraHub.Domain                        │
│    Entidades de Domínio · TenantEntity · Enums · Regras     │
└──────────────────────────────▲──────────────────────────────┘
                               │ implementa
┌──────────────────────────────┴──────────────────────────────┐
│                  BitraHub.Infrastructure                    │
│   EF Core 9 · Npgsql · DbContext · BCrypt · Token JWT       │
└─────────────────────────────────────────────────────────────┘
```

### 1. `BitraHub.Domain` (Núcleo Puro)
- **Entidades:** `Tenant`, `User`, `Student`, `Course`, `ClassGroup`, `AttendanceSession`, `AttendanceRecord`, `Activity`, `Submission`, `Invite`.
- **Base:** `TenantEntity` (garante que todo registro pertença a um `TenantId` obrigatório).
- **Zero dependências externas:** Independente de bancos de dados ou frameworks HTTP.

### 2. `BitraHub.Application` (Regras de Aplicação & Contratos)
- **DTOs:** Registros imutáveis (`record`) para requisições e respostas de alto desempenho.
- **Interfaces:** `ICurrentUserService` (extrai o inquilino atual do JWT), `IJwtTokenGenerator`.

### 3. `BitraHub.Infrastructure` (Persistência & Segurança)
- **EF Core 9 com Npgsql:** Mapeamento relacional contra PostgreSQL 16.
- **Global Query Filters:** Isolamento automático por organização em todas as consultas LINQ:
  ```csharp
  modelBuilder.Entity<Student>()
      .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);
  ```
- **Auditoria Automática:** O método `SaveChangesAsync` injeta automaticamente o `TenantId` e `CreatedAt` no banco.
- **Segurança:** Hashes com `BCrypt.Net` e emissão de JWT criptografado com HMAC-SHA256.

### 4. `BitraHub.WebApi` (Camada de Apresentação HTTP)
- Controllers RESTful com injeção de dependência nativa do .NET.
- Middleware de tratamento global de exceções (`GlobalExceptionHandlerMiddleware`).
- Documentação interativa via Swagger OpenAPI 3.0 em `/swagger`.

---

## 🧪 Suíte de Testes Automatizados (`SwaliClass.Tests`)

Testes unitários construídos com **xUnit**, **FluentAssertions**, **Moq** e **EF Core In-Memory**:

| Classe de Teste | O que valida |
| :--- | :--- |
| **`TenantIsolationTests.cs`** | Comprova isolamento estrito entre Tenant A e Tenant B, bypass de SuperAdmin e injeção automática de `TenantId`. |
| **`AttendanceEvaluationTests.cs`** | Valida a fórmula de frequência ponderada e a flag de risco de evasão escolar no limiar de **75%**. |
| **`EvasionPredictionTests.cs`** | Valida regras de SLA contra abandono escolar: alerta crítico para **3 faltas consecutivas** e justificativas médicas. |
| **`AuthSecurityTests.cs`** | Valida geração de JWT, integridade das claims de Tenant/Role e validação de tokens via `TokenValidationParameters`. |

### Como rodar os testes:
```bash
dotnet test SwaliClass.sln --logger "console;verbosity=normal"
```

---

## 🚀 Como Rodar o Backend

### Pré-requisitos:
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- PostgreSQL 16 rodando localmente na porta 5432 (ou via Docker)

### Execução direta:
```bash
cd BitraHub.WebApi
dotnet restore
dotnet run
```
A API iniciará em `http://localhost:5000` com documentação Swagger disponível em `http://localhost:5000/swagger`.
