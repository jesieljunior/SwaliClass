# SwaliClass — SaaS Multi-Tenant de Controle de Frequência & Gestão Acadêmica

[![CI Pipeline](https://github.com/jesieljunior/swaliclass/actions/workflows/ci.yml/badge.svg)](https://github.com/jesieljunior/swaliclass/actions)
![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-12.0-239120?logo=c-sharp&logoColor=white)
![EF Core](https://img.shields.io/badge/EF%20Core-9.0-512BD4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

> **Autor:** Jesiel Amaro Junior ([@jesieljunior](https://github.com/jesieljunior))  
> **Status:** Em desenvolvimento ativo — Próxima geração evolutiva da plataforma de produção [ClassCheck](https://github.com/jesieljunior/classcheck-case-study).  
> **Sugestão de Metadados do GitHub:**
> - **Descrição:** *SaaS multi-tenant de controle de frequência e análise de evasão escolar em C# .NET 9, EF Core, PostgreSQL e React.*
> - **Topics:** `dotnet`, `csharp`, `dotnet-core`, `aspnetcore`, `clean-architecture`, `multi-tenant`, `ef-core`, `postgresql`, `jwt`, `react`, `typescript`, `xunit`

---

## 📌 1. Visão Geral do Projeto

O **SwaliClass** é uma plataforma corporativa **SaaS multi-tenant** voltada à gestão acadêmica, controle diário de frequência escolar, acompanhamento de notas e identificação precoce de risco de evasão.

O sistema atende a instituições com múltiplas unidades ou polos parceiros, garantindo isolamento criptográfico e de dados em nível de linha (*Row-Level Isolation* via *Global Query Filters*), controle de acesso baseado em funções (RBAC com 5 perfis) e dashboards analíticos em tempo real.

---

## 🚀 2. A Evolução do ClassCheck: O Contexto

Este projeto é a evolução técnica e arquitetural direta do **[ClassCheck](https://github.com/jesieljunior/classcheck-case-study)** — sistema concebido, desenvolvido e implantado por mim no **Instituto da Oportunidade Social (IOS) / Percorre**, substituindo planilhas manuais e operando em produção real em **5 estados brasileiros (SP, MG, RS, RJ, PE)**.

### Por que migrar de Python/FastAPI/MongoDB para C#/.NET 9/PostgreSQL?

| Requisito de Negócio | ClassCheck (1ª Geração) | SwaliClass (Geração Atual) | Decisão de Engenharia |
| :--- | :--- | :--- | :--- |
| **Consistência de Dados** | MongoDB (NoSQL) | **PostgreSQL 16 (Relacional ACID)** | Histórico escolar, registros de faltas e médias ponderadas demandam integridade referencial rígida e chaves estrangeiras com transações ACID. |
| **Multi-Tenancy Seguro** | Filtro manual em queries | **EF Core Global Query Filters** | O isolamento entre escolas e polos é garantido na camada de dados via filtro global no `DbContext`, eliminando risco de vazamento acidental. |
| **Concorrência e Tipagem** | Python 3.11 / FastAPI | **C# (.NET 9) / ASP.NET Core** | Compilação com tipagem estrita de ponta a ponta, compilação JIT de alta performance e memory safety para grandes volumes simultâneos de chamadas. |
| **Arquitetura** | Modular por features | **Clean Architecture (Onion)** | Separação formal em 4 camadas (`Domain`, `Application`, `Infrastructure`, `WebApi`), permitindo fácil substituição de tecnologias sem tocar nas regras de negócio. |

📖 *Para ler o estudo de caso completo da implantação da 1ª geração em 5 estados, acesse o [ClassCheck Case Study](https://github.com/jesieljunior/classcheck-case-study).*

---

## 🏛️ 3. Arquitetura em Camadas (Clean Architecture)

O backend segue estritamente a **Clean Architecture**, organizada na pasta `backend/csharp/`:

```
┌──────────────────────────────────────────────────────────┐
│                   BitraHub.WebApi                        │
│   Controllers RESTful · Middlewares · Swagger · JWT Bearer│
└────────────────────────────┬─────────────────────────────┘
                             │ depende de
┌────────────────────────────▼─────────────────────────────┐
│                 BitraHub.Application                     │
│      Interfaces (ICurrentUserService) · DTOs · Contratos  │
└────────────────────────────┬─────────────────────────────┘
                             │ depende de
┌────────────────────────────▼─────────────────────────────┐
│                   BitraHub.Domain                        │
│  Entidades · TenantEntity · Enums · Regras de Negócio    │
└────────────────────────────▲─────────────────────────────┘
                             │ implementa
┌────────────────────────────┴─────────────────────────────┐
│               BitraHub.Infrastructure                    │
│   EF Core 9 · Npgsql · DbContext · BCrypt · Token JWT    │
└──────────────────────────────────────────────────────────┘
```

1. **`BitraHub.Domain`**: O núcleo puro do sistema. Contém as entidades (`Tenant`, `User`, `Course`, `ClassGroup`, `Student`, `AttendanceSession`, `AttendanceRecord`, `Activity`, `Submission`) e contratos base (`TenantEntity`). Zero dependências de frameworks externos.
2. **`BitraHub.Application`**: Define contratos de casos de uso, DTOs de transporte seguro e interfaces de infraestrutura (`ICurrentUserService`, `IJwtTokenGenerator`).
3. **`BitraHub.Infrastructure`**: Implementação concreta de acesso a dados com **Entity Framework Core 9**, provedor **PostgreSQL (Npgsql)**, migrations, hashes de senha com **BCrypt.Net** e geração de tokens JWT HMAC-SHA256.
4. **`BitraHub.WebApi`**: Ponto de entrada HTTP configurado com ASP.NET Core 9, Swagger OpenAPI v3, tratamento global de exceções e injeção de dependências.

*Consulte o documento completo [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes de cada camada.*

---

## 🏢 4. Como Funciona o Multi-Tenant (Isolamento por Organização)

O SwaliClass implementa isolamento multi-inquilino (*Multi-Tenancy*) transparente e seguro:

1. **Extração Automática de Tenant via JWT:**  
   Quando o usuário autentica, o token JWT gerado carrega a claim `tenant_id`. Em cada requisição HTTP, o serviço `CurrentUserService` extrai esse identificador do `ClaimsPrincipal`.
2. **Filtros Globais de Consulta no EF Core:**  
   No `BitraHubDbContext.cs`, todas as entidades pertencentes a uma organização possuem um *Global Query Filter*:
   ```csharp
   modelBuilder.Entity<Student>()
       .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);
   ```
   Qualquer consulta LINQ executada no sistema é interceptada pelo EF Core e recebe a cláusula SQL `WHERE "TenantId" = @tenantId`.
3. **Persistência Protegida:**  
   No método `SaveChangesAsync`, o `DbContext` atribui automaticamente o `TenantId` da sessão em novas entidades antes de salvar no banco, impedindo que um usuário crie registros em nome de outra organização.
4. **Perfil SuperAdmin:**  
   Usuários com a role `SuperAdmin` possuem acesso cross-tenant controlado para geração de relatórios e auditorias consolidadas.

---

## 🧪 5. Testes Automatizados no Backend (xUnit)

O projeto de testes `backend/csharp/SwaliClass.Tests` valida as regras centrais de segurança e negócio sem depender de um banco de dados externo, utilizando o provedor *EF Core In-Memory*, *FluentAssertions* e *Moq*.

A suíte cobre:
- **`TenantIsolationTests`**: Comprova que consultas do Tenant A nunca vazam registros do Tenant B, valida o bypass legítimo de SuperAdmins e confirma o preenchimento automático do `TenantId` no `SaveChangesAsync`.
- **`AuthSecurityTests`**: Valida a força de hashing do BCrypt, integridade das claims nos tokens JWT (`tenant_id`, `role`, `email`, `sub`) e validação criptográfica via `TokenValidationParameters`.
- **`AttendanceEvaluationTests`**: Valida os cálculos de frequência ponderada e a emissão de alerta de risco de evasão escolar quando a frequência de um estudante cai abaixo do limiar pedagógico de **75%** (regra validada no projeto ClassCheck).

### Como executar os testes:
```bash
# Executar toda a suíte de testes do backend
dotnet test backend/csharp/SwaliClass.sln --logger "console;verbosity=normal"
```

---

## 📦 6. Como Rodar a Aplicação

### Opção A: Subir tudo com um comando (Docker Compose — Recomendado)

Suba o banco PostgreSQL 16, a API .NET 9 e o frontend React 19 com uma única instrução:

```bash
# Clona o repositório
git clone https://github.com/jesieljunior/swaliclass.git
cd swaliclass

# Inicia todos os containers
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Documentação Swagger:** [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **Banco PostgreSQL:** `localhost:5432` (Database: `swaliclass_db`)

---

### Opção B: Rodando Localmente Passo a Passo

#### 1. Pré-requisitos
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/) (ou container docker)

#### 2. Executar o Backend (.NET 9)
```bash
cd backend/csharp/BitraHub.WebApi
dotnet restore
dotnet run
```
A API iniciará em `http://localhost:5000` e aplicará automaticamente o seed inicial do banco com dados de exemplo.

#### 3. Executar o Frontend (React + Vite)
```bash
# Na raiz do projeto
npm install
npm run dev
```
Acesse o navegador em `http://localhost:3000`.

---

## 📑 7. Documentação da API (OpenAPI / Swagger)

A API possui documentação interativa gerada automaticamente via Swashbuckle:
- **Swagger UI:** `http://localhost:5000/swagger`
- **Especificação OpenAPI 3.0:** Arquivo estático disponível em [`backend/openapi.yaml`](./backend/openapi.yaml)

### Principais Endpoints:
- `POST /api/v1/auth/login` — Autenticação de usuários e emissão de JWT com claims de Tenant.
- `GET /api/v1/auth/me` — Obtenção do perfil do usuário autenticado.
- `GET /api/v1/students` — Listagem paginada de estudantes isolada pelo Tenant do usuário.
- `GET /api/v1/attendance/roster?classId={id}&date={date}` — Espelho diário de chamada com cálculo em tempo real de presença e faltas.
- `POST /api/v1/attendance/save` — Registro atômico de chamadas diárias e justificativas.
- `GET /api/v1/reports/attendance` — Relatório gerencial de frequência com consolidação por período.
- `GET /api/v1/dashboard/stats` — Métricas gerenciais de evasão, turmas e atividades pendentes.

---

## 📁 8. Sobre a pasta `supabase/` no Repositório

Quem examinar a raiz do projeto encontrará a pasta `supabase/`. 

**Esclarecimento Arquitetural:**
- O banco de dados de produção do SwaliClass é o **PostgreSQL 16 gerenciado via Entity Framework Core 9** no backend C#.
- A pasta `supabase/` contém os schemas SQL gerados durante a fase inicial de prototipagem e desenvolvimento da interface web.
- O frontend mantém um adaptador em memória (`src/integrations/supabase/mock-client.ts`) que permite rodar a interface em modo de demonstração isolado ou visualizações rápidas de UI sem depender de banco de dados ativo.
- Em ambiente de produção e Docker, o tráfego ocorre integralmente pela API REST .NET 9.

---

## 🤖 9. Transparência Técnica: Decisões e Uso de IA

Em alinhamento com as melhores práticas de transparência profissional:

- **Papel da Inteligência Artificial:** Ferramentas de IA generativa foram empregadas no projeto de forma pontual para acelerar a escrita de código repetitivo (*boilerplate*), geração de componentes visuais em Tailwind CSS e scaffolding inicial de arquivos.
- **Engenharia e Liderança Técnica:** Toda a **concepção arquitetural** (Clean Architecture, separação de responsabilidades, modelagem relacional ACID no PostgreSQL, estratégia de multi-tenancy com *Global Query Filters*, fluxo de segurança JWT e design dos testes automatizados xUnit) foi idealizada, dirigida e validada por **Jesiel Amaro Junior**, fundamentada na experiência prévia de implantação em produção do ClassCheck.

---

## ⚖️ Licença

Este projeto está sob a licença [MIT](./LICENSE) — desenvolvido por **Jesiel Amaro Junior** (2026).
