# SwaliClass — Arquitetura de Software e Engenharia de Sistema

> **Autor:** Jesiel Amaro Junior ([@jesieljunior](https://github.com/jesieljunior))  
> **Status:** Em desenvolvimento ativo — Próxima geração evolutiva do [ClassCheck](https://github.com/jesieljunior/classcheck-case-study)  
> **Stack Principal:** C# (.NET 9), Entity Framework Core 9, PostgreSQL 16, React 19, TypeScript, Docker.

---

## 1. Visão Geral da Arquitetura

O **SwaliClass** é uma plataforma SaaS corporativa **multi-tenant** desenhada sob os princípios da **Clean Architecture** (Arquitetura Limpa / Onion Architecture). A solução foi projetada para garantir desacoplamento entre regras de negócio, persistência de dados e camadas de entrega HTTP.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        APRESENTAÇÃO / CLIENTS                          │
│     React 19 + TypeScript + Vite (Port 3000) / Blazor WebAssembly     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON + JWT Bearer)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  CAMADA DE ENTRADA (WebApi / Host)                     │
│   • ASP.NET Core Controllers (/api/v1/*)                               │
│   • GlobalExceptionMiddleware & Request Pipeline                       │
│   • Swagger / OpenAPI 3.0 Documentation                                │
│   • Authentication & Authorization Middleware                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                 CAMADA DE APLICAÇÃO (Application)                      │
│   • Interfaces de Serviços (ICurrentUserService, IJwtTokenGenerator)  │
│   • Data Transfer Objects (DTOs) & Contracts                           │
│   • Regras de Orquestração, Casos de Uso & Validações                  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼─────────────┐   ┌──────────────▼───────────────────┐
│     DOMÍNIO (Domain Core)       │   │   INFRAESTRUTURA (Infrastructure) │
│ • Entidades de Negócio          │   │ • BitraHubDbContext (EF Core 9)  │
│   (Tenant, User, Course, Class, │   │ • PostgreSQL Provider (Npgsql)   │
│    Student, Attendance, Grade)  │   │ • Global Query Filters (Tenant)  │
│ • Enums & Value Objects         │   │ • BCrypt Hashing & JWT Services  │
│ • BaseEntity & TenantEntity     │   │ • Migrations & Database Seeding  │
└─────────────────────────────────┘   └──────────────────┬───────────────┘
                                                         │
                                      ┌──────────────────▼───────────────┐
                                      │    PERSISTÊNCIA (PostgreSQL 16)  │
                                      │   Isolamento Row-Level por Tenant │
                                      └──────────────────────────────────┘
```

---

## 2. As Quatro Camadas do Backend (.NET 9)

### 2.1. Domain (Núcleo Puro)
- **Localização:** `backend/csharp/BitraHub.Domain/`
- **Responsabilidade:** Define as entidades do domínio, interfaces fundamentais e contratos que independem de qualquer framework ou banco de dados.
- **Entidades Centrais:**
  - `Tenant`: Representa a organização educacional (instituição, polo ou franquia).
  - `User`: Usuário autenticado com credenciais seguras e papel atribuído (`Roles.SuperAdmin`, `Roles.Admin`, `Roles.Teacher`, `Roles.Student`).
  - `Course` & `ClassGroup`: Estrutura acadêmica e alocação de turmas/professores.
  - `Student` & `Enrollment`: Cadastro dos estudantes e matrículas ativas.
  - `AttendanceSession` & `AttendanceRecord`: Sessões diárias de chamada com status de presença (`Present`, `Absent`, `Late`, `Excused`) e justificativas.
  - `Activity` & `Submission`: Avaliações, entregas de alunos, notas e cálculo de médias ponderadas.
- **Regra:** Não referencia nenhum outro projeto ou pacote externo.

### 2.2. Application (Contratos e Casos de Uso)
- **Localização:** `backend/csharp/BitraHub.Application/`
- **Responsabilidade:** Contém as interfaces de serviços de infraestrutura (`ICurrentUserService`, `IJwtTokenGenerator`) e os DTOs para tráfego seguro de dados.
- **Dependências:** Referencia apenas o `Domain`.

### 2.3. Infrastructure (Implementações Técnicas)
- **Localização:** `backend/csharp/BitraHub.Infrastructure/`
- **Responsabilidade:** Implementa a persistência via **Entity Framework Core 9**, provedor **Npgsql**, hashing criptográfico com **BCrypt.Net** e emissão de tokens JWT.
- **Destaque:** `BitraHubDbContext.cs` centraliza a aplicação dos filtros multi-tenant e o ciclo de vida de persistência.

### 2.4. WebApi (Camada de Entrega)
- **Localização:** `backend/csharp/BitraHub.WebApi/`
- **Responsabilidade:** Ponto de entrada HTTP (`Program.cs`), injeção de dependências, configuração de CORS, autenticação JWT Bearer, documentação interativa Swagger e Controllers RESTful.

---

## 3. Estratégia de Multi-Tenancy (Isolamento por Organização)

Em instituições de ensino, o vazamento de dados de frequência ou notas entre diferentes organizações parceiras é inaceitável. O SwaliClass adota a estratégia **Shared Database, Shared Schema com Row-Level Isolation**:

```
Requisição HTTP (com Header Authorization: Bearer <JWT>)
   │
   ▼
[JwtBearer Middleware] ──── Valida assinatura criptográfica e expiração
   │
   ▼
[CurrentUserService] ───── Extrai a claim "tenant_id" do ClaimsPrincipal
   │
   ▼
[EF Core DbContext] ────── Aplica Global Query Filter automaticamente:
                          e.TenantId == _currentUserService.TenantId
   │
   ▼
[PostgreSQL Database] ──── Consulta SQL executada sempre com WHERE "TenantId" = @tenantId
```

### Mecanismos de Proteção:
1. **Global Query Filters no EF Core:**
   Todas as entidades que herdam de `TenantEntity` possuem o filtro configurado no `OnModelCreating`:
   ```csharp
   modelBuilder.Entity<Student>()
       .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);
   ```
   Isso impossibilita que um professor ou gestor da Instituição A acesse dados da Instituição B, mesmo se esquecer de filtrar manualmente na query LINQ.
2. **Preenchimento Automático em Gravações (`SaveChangesAsync`):**
   Ao persistir novos registros, caso o `TenantId` não tenha sido explicitamente atribuído, o `DbContext` injeta o identificador do tenant atual extraído da sessão autenticada.
3. **Bypass Auditor de SuperAdmin:**
   Contas com a role `SuperAdmin` possuem privilégio para consolidar métricas de todas as unidades sem quebrar o isolamento das consultas de usuários regulares.

---

## 4. Fluxo de Autenticação e Segurança (RBAC + JWT)

```
[Cliente (Frontend/Mobile)]             [SwaliClass WebApi]                 [PostgreSQL]
             │                                    │                              │
             ├─────── 1. POST /auth/login ───────>│                              │
             │        { email, password }         ├──── 2. Busca Usuário ───────>│
             │                                    │<─── Retorna Hash BCrypt ─────┤
             │                                    │                              │
             │                                    ├─── 3. Valida BCrypt.Verify() │
             │                                    ├─── 4. Constrói Claims:       │
             │                                    │       sub, email, role,      │
             │                                    │       tenant_id, tenant_name │
             │                                    ├─── 5. Assina Token JWT       │
             │<────── 6. 200 OK + JWT Token ──────┤                              │
             │                                    │                              │
             ├─────── 7. GET /api/v1/students ───>│                              │
             │        Authorization: Bearer <JWT> ├─── 8. Injeta no TenantFilter │
             │                                    ├──── 9. SELECT com TenantId ─>│
             │                                    │<─── Registros Isolados ──────┤
             │<────── 10. 200 OK + Estudantes ────┤                              │
```

---

## 5. De ClassCheck para SwaliClass: A Evolução Arquitetural

O **ClassCheck** foi desenvolvido e validado em ambiente de produção real no **Instituto da Oportunidade Social (IOS) / Percorre**, atendendo 5 estados brasileiros (SP, MG, RS, RJ, PE). 

O **SwaliClass** surge como a próxima geração arquitetural dessa plataforma, escalando o aprendizado prático para um padrão corporativo enterprise:

| Dimensão Técnica | ClassCheck (1ª Geração) | SwaliClass (Geração Atual) | Por que a Mudança? |
| :--- | :--- | :--- | :--- |
| **Linguagem Backend** | Python 3.11 | **C# (.NET 9)** | Maior throughput, compilação fortemente tipada e memory safety em cenários concorrentes. |
| **Framework API** | FastAPI + Motor (Async) | **ASP.NET Core WebApi** | Ecossistema maduro para governança corporativa, injeção de dependências nativa e Clean Architecture. |
| **Banco de Dados** | MongoDB (NoSQL) | **PostgreSQL 16 (Relacional)** | Integridade referencial estrita e transações ACID. Histórico de faltas e notas acadêmicas exigem consistência forte, não tolerando anomalias de agregação eventual. |
| **ORM / Persistência** | Queries customizadas em Motor / PyMongo | **Entity Framework Core 9 (EF Core)** | Migrations declarativas com versionamento de schema e **Global Query Filters** nativos para multi-tenancy. |
| **Multi-Tenancy** | Filtros manuais aplicados endpoint a endpoint | **Filtros Globais em tempo de execução** | Eliminação completa de erro humano de vazamento de dados entre polos e escolas parceiras. |
| **Frontend** | React SPA | **React 19 + TypeScript + TanStack** | Componentes desacoplados por módulos de domínio, tipagem rigorosa alinhada aos DTOs do backend. |
| **Cobertura de Testes** | Validações manuais e testes de rota | **xUnit + FluentAssertions + Moq** | Testes automatizados cobrindo isolamento de tenants, validação de JWT e cálculo do limiar crítico de evasão (< 75%). |

---

## 6. Cobertura de Testes Automatizados

O projeto `SwaliClass.Tests` possui suítes focadas nos componentes mais críticos do sistema:

1. **`TenantIsolationTests.cs`:**
   - Garante que consultas de uma instituição nunca retornem dados de outra.
   - Valida que `SaveChangesAsync` injeta o `TenantId` da sessão em novas entidades.
   - Verifica o acesso irrestrito controlado para SuperAdmins.
2. **`AuthSecurityTests.cs`:**
   - Validação de geração e verificação de hashes BCrypt.
   - Emissão de tokens JWT com verificação de claims de tenant e permissões de perfil.
   - Validação estrita via `TokenValidationParameters` e chaves HMAC-SHA256.
3. **`AttendanceEvaluationTests.cs`:**
   - Cálculo de taxas de frequência ponderando presenças, ausências e justificativas.
   - Validação da regra pedagógica de risco crítico de evasão quando frequência cai abaixo de **75%**.
   - Cálculo de médias ponderadas de atividades e notas.

Para executar todos os testes localmente:
```bash
dotnet test backend/csharp/SwaliClass.sln
```
