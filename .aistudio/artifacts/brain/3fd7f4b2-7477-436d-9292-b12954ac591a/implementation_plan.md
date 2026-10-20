# BitraHub — Plano de Migração Arquitetural (C# / Java + React)

Plano de arquitetura e transição técnica para desacoplar o **BitraHub** de server functions TypeScript para uma arquitetura corporativa moderna baseada em **React (SPA/Vite)** no frontend e **API RESTful tipada em C# (.NET 9) ou Java 21 (Spring Boot 3)** no backend, preservando o modelo multi-tenant, controle de acesso por papéis (RBAC) e o fluxo acadêmico completo.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> O ambiente de execução e preview do Google AI Studio Build roda exclusivamente um container Linux Node.js 22 (Vite na porta 3000). Portanto, a migração para C# (.NET) ou Java (Spring Boot) requer um modelo de **arquitetura desacoplada**:
> 1. O **frontend React** permanece compatível e executável no ambiente Web (Vite SPA com TypeScript/Tailwind CSS), consumindo contratos de API REST padronizados (`/api/v1/*`).
> 2. O **backend C# ou Java** é estruturado como um serviço independente corporativo (Clean Architecture / Hexagonal Architecture), pronto para compilar em Docker e rodar em produção (Cloud Run, Azure App Services, AWS ECS ou servidor dedicado).
> 3. Durante o desenvolvimento e preview, o frontend dispõe de um cliente de API com fallback para simulação em memória (OpenAPI / Mock Server), garantindo que a interface nunca quebre enquanto a API externa é implantada.

- **Ecossistema Recomendado**: **C# com .NET 9 ASP.NET Core** (Clean Architecture + Entity Framework Core + PostgreSQL) ou **Java 21 com Spring Boot 3** (Spring Data JPA + Flyway + PostgreSQL).
- **Estratégia de Frontend**: Manter a UI em **React 19 + Vite + Tailwind CSS**, migrando de `@tanstack/react-start` server functions para um cliente HTTP tipado (`Axios` ou `fetch` com React Query / TanStack Query) consumindo a API REST.
- **Isolamento Multi-tenant**: Preservar o isolamento estrito por `tenant_id` em todas as tabelas e consultas com Global Query Filters (EF Core) ou Hibernate `@Filter` / TenantContext (Spring Boot).

---

## 1. Visão Geral e Conceito do Produto

O **BitraHub** é uma plataforma educacional SaaS multi-tenant voltada para três personas principais:
1. **Professor Particular**: Organização de microturmas, controle de presenças, criação de atividades com prazos, correção de entregas e cálculo de notas sem burocracia.
2. **Instituição de Ensino**: Gestão completa de cursos, turmas, alunos, professores, chamada com auditoria, relatórios gerenciais e boletins acadêmicos imprimíveis.
3. **Estudante**: Acompanhamento de frequência, portal com tarefas pendentes, download de enunciados, envio de arquivos e consulta de notas consolidadas.

### O Problema Resolvido
Substituir o caos de WhatsApp, planilhas desconexas e sistemas acadêmicos legados por uma solução ágil, moderna e com isolamento seguro de dados entre escolas e professores.

---

## 2. Experiência do Usuário e Design Visual

A interface do BitraHub segue rigorosamente o padrão visual já estabelecido no projeto:
- **Direção Estética**: Editorial sóbria e acadêmica com forte identidade visual corporativa (estilo *Bitra Tech*).
- **Paleta de Cores**:
  - *Fundo Primário (60%)*: Paper neutro (`#E8EDF3` / `--paper`) e superfícies alvas (`#FFFFFF`).
  - *Estrutura e Tipografia (30%)*: Marinho profundo (`#0F1B3D` / `--navy-900`) e azul meia-noite (`#1E3A5F` / `--navy-800`).
  - *Acentos (10%)*: Azul corporativo (`#3B6FA0` / `--navy-600`) para botões de ação e status semânticos (Verde esmeralda para presença/sucesso, Âmbar para pendências, Carmim para alertas de evasão).
- **Tipografia**:
  - Títulos e Destaques: `Outfit` (display geométrico, bold).
  - Textos Corridos e Formulários: `Figtree` (legibilidade equilibrada).
  - Métricas e Códigos: `JetBrains Mono` com números tabulares (`tabular-nums`).
- **Padrão de Navegação**:
  - Top Bar com 3 zonas limpas: Wordmark institucional, busca rápida e ações de perfil.
  - Sidebar lateral retrátil e Mobile Bottom Navigation para telas menores.
  - Tratamento completo de estados: *Carregando* (skeletons discretos), *Vazio* (orientação com botão de ação primária) e *Erro* com mensagens amigáveis.

---

## 3. Decisões Arquiteturais e Trade-offs

### Decisão 1: C# (.NET 9) vs Java (Spring Boot 3)

| Critério | C# (.NET 9 ASP.NET Core) | Java 21 (Spring Boot 3) |
| :--- | :--- | :--- |
| **Arquitetura Recomendada** | Clean Architecture / Minimal APIs ou Controllers | Hexagonal Architecture / REST Controllers |
| **ORM / Banco de Dados** | Entity Framework Core com Npgsql (PostgreSQL) | Spring Data JPA com Hibernate |
| **Multi-tenancy** | `DbContext` com `HasQueryFilter(e => e.TenantId == CurrentTenantId)` | Hibernate Filter `@FilterDef` + `TenantContextFilter` |
| **Serialização & Validação** | `System.Text.Json` + `FluentValidation` | `Jackson` + `Jakarta Validation (Hibernate Validator)` |
| **Produtividade & Desempenho** | Inicialização ultra-rápida, menor consumo de memória, compilação AOT opcional | Ecossistema maduro, suporte massivo a microsserviços |

*Recomendação*: **C# .NET 9** oferece desenvolvimento mais conciso e desempenho superior para APIs REST corporativas, com suporte nativo excelente a filtros globais multi-tenant no Entity Framework Core. Ambas as opções são detalhadas na arquitetura.

### Decisão 2: Desacoplamento do Frontend React

- **Abordagem Anterior**: TanStack Start usando `createServerFn` e Supabase RPCs misturados no código TypeScript.
- **Nova Abordagem**: Frontend React como SPA limpa, utilizando **TanStack Query (React Query)** e um **API Client unificado** com tokens JWT (Bearer Auth). As chamadas HTTP apontam para endpoints REST padronizados (`GET /api/v1/classes`, `POST /api/v1/attendance`, `GET /api/v1/dashboard/stats`).
- **Benefício**: Independência total de deploy (frontend em CDN/Vercel/Cloudflare/AI Studio, backend em qualquer cloud corporativa).

---

## 4. Arquitetura Técnica & Especificação de Dados

### Diagrama do Sistema

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 SPA)                         │
│  Outfit + Figtree · Tailwind CSS · TanStack Query · Lucide Icons       │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │  Dashboard   │   │  Chamada &   │   │  Atividades  │   │ Clientes │ │
│  │  & Métricas  │   │  Presença    │   │  & Notas     │   │ (SaaS)   │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └────┬─────┘ │
│         │                  │                  │                │       │
│         └──────────────────┼──────────────────┴────────────────┘       │
│                            │                                           │
│                 ┌──────────┴──────────┐                                │
│                 │  ApiClient (Axios)  │                                │
│                 │  Bearer JWT Auth    │                                │
│                 └──────────┬──────────┘                                │
└────────────────────────────┼───────────────────────────────────────────┘
                             │  HTTPS / JSON
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND API (C# .NET 9 ou Java 21)                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middleware: JWT Authentication · TenantResolver · ExceptionHandler│  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ REST Controllers / Endpoints:                                    │  │
│  │  - AuthController (/api/v1/auth/login, /register, /invite)       │  │
│  │  - CoursesController (/api/v1/courses)                           │  │
│  │  - ClassesController (/api/v1/classes)                           │  │
│  │  - StudentsController (/api/v1/students, /import-csv)            │  │
│  │  - AttendanceController (/api/v1/attendance/sessions, /roster)   │  │
│  │  - ActivitiesController (/api/v1/activities, /submissions)       │  │
│  │  - ReportsController (/api/v1/reports/attendance, /grades)       │  │
│  │  - TenantsController (/api/v1/admin/tenants) [SuperAdmin]        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Application / Domain Services & Validation (Business Logic)      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Persistence: EF Core / Spring Data JPA + Multi-Tenant Filter     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BANCO DE DADOS (PostgreSQL)                        │
│                                                                        │
│  - tenants (id, name, slug, plan, status)                              │
│  - users & user_roles (id, email, password_hash, role, tenant_id)      │
│  - courses & classes (id, tenant_id, name, schedule)                   │
│  - students & enrollments (id, tenant_id, full_name, email, class_id)  │
│  - attendance_sessions & attendance_records (date, status, student_id) │
│  - activities & submissions (due_at, max_grade, student_id, grade)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Mapeamento de Entidades e Endpoints da Nova API

### Endpoints Principais da API REST

| Módulo | Método & Rota | Descrição | Papéis Permitidos |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/v1/auth/login` | Login com e-mail e senha, retorna token JWT | Público |
| **Auth** | `GET /api/v1/auth/me` | Retorna dados da sessão do usuário logado e tenant | Autenticado |
| **Auth** | `POST /api/v1/auth/accept-invite` | Aceita convite e define credenciais | Público com Token |
| **Dashboard** | `GET /api/v1/dashboard/stats` | Estatísticas gerais (alunos, turmas, frequência 30d) | Admin / Coordenador |
| **Dashboard** | `GET /api/v1/dashboard/teacher` | Visão focada do professor (minhas turmas, entregas) | Professor |
| **Cursos** | `GET /api/v1/courses` | Listagem de cursos da instituição | Staff |
| **Cursos** | `POST /api/v1/courses` | Criação / atualização de curso | Admin / Coordenador |
| **Cursos** | `DELETE /api/v1/courses/{id}` | Exclusão com validação de turmas vinculadas | Admin / Coordenador |
| **Turmas** | `GET /api/v1/classes` | Listagem de turmas com contagem de matriculados | Staff |
| **Turmas** | `POST /api/v1/classes` | Criação / edição de turma | Admin / Coordenador |
| **Alunos** | `GET /api/v1/students` | Listagem de alunos com turmas associadas | Staff |
| **Alunos** | `POST /api/v1/students` | Criação / edição de aluno | Admin / Coordenador |
| **Alunos** | `POST /api/v1/students/import-csv` | Importação em lote com prévia e validação linha a linha | Admin / Coordenador |
| **Chamada** | `GET /api/v1/attendance/roster` | Lista de alunos e status para data/turma especificada | Staff |
| **Chamada** | `POST /api/v1/attendance/save` | Registro e auditoria de presença da sessão | Professor / Admin |
| **Atividades** | `GET /api/v1/activities` | Atividades por turma e status | Staff / Aluno |
| **Atividades** | `POST /api/v1/activities` | Criação com rubrica e prazo | Professor / Admin |
| **Entregas** | `POST /api/v1/submissions/{id}/grade`| Atribuição de nota e feedback pelo professor | Professor / Admin |
| **Relatórios** | `POST /api/v1/reports/attendance` | Relatório consolidado de presença por período | Staff |
| **Relatórios** | `POST /api/v1/reports/grades` | Relatório consolidado de notas e médias | Staff |
| **SaaS** | `GET /api/v1/admin/tenants` | Gestão de escolas parceiras e convites | Super Admin |

---

## 6. Estrutura do Projeto Migrado

### Opção A: C# .NET 9 (Clean Architecture)
```text
BitraHub.sln
├── src/
│   ├── BitraHub.Domain/            # Entidades, Enums, Interfaces de Repositório
│   │   ├── Entities/ (Tenant, Student, ClassGroup, Course, AttendanceSession, Activity, Submission)
│   │   └── Common/ (BaseEntity, IAggregateRoot, Roles)
│   ├── BitraHub.Application/       # DTOs, Casos de Uso (Commands & Queries, FluentValidation)
│   │   ├── Features/Students/ (Commands, Queries, Dtos)
│   │   └── Features/Attendance/ (SaveAttendanceCommand, GetRosterQuery)
│   ├── BitraHub.Infrastructure/    # EF Core DbContext, Migrations, Repositórios, JWT, Storage
│   │   ├── Persistence/ (BitraHubDbContext, TenantInterceptor)
│   │   └── Auth/ (JwtTokenGenerator, CurrentUserService)
│   ├── BitraHub.WebApi/            # Controllers ou Minimal APIs, Program.cs, Swagger
│   │   ├── Controllers/ (StudentsController, AttendanceController, etc.)
│   │   └── Program.cs
│   └── BitraHub.Frontend/          # React SPA (Vite + Tailwind CSS + TanStack Query)
│       ├── src/ (components, routes, hooks, api-client)
│       └── package.json
```

### Opção B: Java 21 Spring Boot 3 (Hexagonal Architecture)
```text
bitrahub/
├── pom.xml (ou build.gradle)
├── src/main/java/com/bitratech/bitrahub/
│   ├── domain/                     # Modelos centrais e regras de negócio puras
│   ├── application/                # Portas de entrada/saída, DTOs e Services
│   ├── infrastructure/             # Adaptadores: Spring Data JPA, Security JWT, Storage
│   │   ├── persistence/ (Repositories, Entities, TenantFilterAspect)
│   │   └── security/ (SecurityConfig, JwtAuthenticationFilter)
│   └── web/                        # RestControllers, GlobalExceptionHandler, Swagger/OpenAPI
└── frontend/                       # React SPA (Vite + Tailwind CSS + TanStack Query)
```

---

## 7. Roteiro de Execução da Migração

1. **Fase 1: Preparação do Frontend React (Vite SPA)**
   - Desacoplar as Server Functions do TanStack Start em um serviço de API REST com interface tipada (`src/lib/api-client.ts`).
   - Implementar chave de configuração de URL base (`VITE_API_BASE_URL`).
   - Manter fallback para dados de demonstração em memória para garantir execução imediata no preview do AI Studio.

2. **Fase 2: Concretização do Modelo de Dados & Migrações**
   - Extrair as tabelas SQL existentes em migrations estruturadas (EF Core Migrations ou Flyway em Java).
   - Aplicar filtros automáticos de `tenant_id` em todas as queries.

3. **Fase 3: Implementação dos Controladores e Regras de Negócio**
   - Implementar endpoints de Autenticação e RBAC.
   - Implementar o núcleo acadêmico: Cursos, Turmas, Alunos, Chamada e Atividades.
   - Implementar relatórios e exportações.

4. **Fase 4: Validação de Contrato & Testes de Integração**
   - Geração automática da documentação Swagger / OpenAPI (`/swagger`).
   - Verificação ponta a ponta com o frontend React consumindo os dados da nova API.
