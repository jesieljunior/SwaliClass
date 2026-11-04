# SwaliClass — SaaS Multi-Tenant de Controle de Frequência & Gestão Acadêmica

[![CI Pipeline](https://img.shields.io/badge/CI%20Pipeline-Passing-success?logo=github-actions)](https://github.com/jesieljunior/swaliclass)
![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-12.0-239120?logo=c-sharp&logoColor=white)
![EF Core](https://img.shields.io/badge/EF%20Core-9.0-512BD4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![xUnit](https://img.shields.io/badge/Tests-xUnit%20%7C%20FluentAssertions-007ACC?logo=xunit)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

> **Autor:** Jesiel Amaro Junior ([@jesieljunior](https://github.com/jesieljunior))  
> **Status:** Em desenvolvimento ativo — Próxima geração evolutiva da plataforma de produção [ClassCheck](https://github.com/jesieljunior/classcheck-case-study).

---

### 📋 Metadados Sugeridos para o Repositório no GitHub (Copie e Cole):

* **Descrição (About):**
  > `SaaS corporativo multi-tenant em C# .NET 9, Clean Architecture, EF Core e PostgreSQL para controle de frequência escolar, chamadas em tempo real e prevenção preditiva de evasão.`

* **Topics (Tags do Repositório):**
  > `csharp`, `dotnet`, `dotnet-core`, `aspnetcore`, `clean-architecture`, `multi-tenant`, `ef-core`, `postgresql`, `xunit`, `fluentassertions`, `jwt-authentication`, `docker-compose`, `react`, `typescript`, `education`

---

## 📌 1. Visão Geral do Projeto

O **SwaliClass** é uma plataforma corporativa **SaaS multi-tenant** voltada à gestão acadêmica, controle diário de frequência escolar, acompanhamento de notas e identificação precoce de risco de evasão escolar.

O sistema atende a instituições com múltiplas unidades ou polos parceiros, garantindo:
- **Isolamento de dados por organização:** _Row-Level Isolation_ via _Global Query Filters_ do EF Core 9.
- **Segurança RBAC (Role-Based Access Control):** 5 perfis de acesso (`SuperAdmin`, `Admin`, `Coordinator`, `Teacher`, `Student`).
- **Prevenção Preditiva de Evasão:** Alertas pedagógicos automáticos baseados no limiar legal de 75% de frequência e detecção de faltas consecutivas.
- **Portais Específicos:** Painéis dedicados para gestão institucional e portal do estudante autônomo.

---

## 🚀 2. A Evolução do ClassCheck: O Contexto

Este projeto é a evolução técnica e arquitetural direta do **[ClassCheck](https://github.com/jesieljunior/classcheck-case-study)** — sistema concebido, desenvolvido e implantado por mim no **Instituto da Oportunidade Social (IOS) / Percorre**, substituindo planilhas manuais e operando em produção real em **5 estados brasileiros (SP, MG, RS, RJ, PE)**.

### Por que migrar de Python/FastAPI/MongoDB para C#/.NET 9/PostgreSQL?

| Requisito de Negócio | ClassCheck (1ª Geração) | SwaliClass (Geração Atual) | Decisão de Engenharia |
| :--- | :--- | :--- | :--- |
| **Consistência de Dados** | MongoDB (NoSQL) | **PostgreSQL 16 (Relacional ACID)** | Histórico escolar, registros diários de chamada e médias ponderadas demandam integridade referencial rígida e chaves estrangeiras com transações ACID. |
| **Multi-Tenancy Seguro** | Filtro manual em queries | **EF Core Global Query Filters** | O isolamento entre escolas e polos parceiros é garantido na camada de dados via filtro global no `DbContext`, eliminando risco de vazamento acidental entre inquilinos. |
| **Concorrência e Tipagem** | Python 3.11 / FastAPI | **C# (.NET 9) / ASP.NET Core** | Compilação com tipagem estrita de ponta a ponta, compilação JIT de alta performance e memory safety para grandes volumes simultâneos de chamadas em horários de pico. |
| **Arquitetura** | Modular por features | **Clean Architecture (Onion)** | Separação formal em 4 camadas desacopladas (`Domain`, `Application`, `Infrastructure`, `WebApi`), permitindo fácil substituição de tecnologias sem tocar nas regras de negócio. |

📖 _Para ler o estudo de caso completo da implantação da 1ª geração em 5 estados, acesse o [ClassCheck Case Study](https://github.com/jesieljunior/classcheck-case-study)._

---

## 🏛️ 3. Arquitetura em Camadas (Clean Architecture)

O backend é organizado na pasta `backend/csharp/` seguindo estritamente a **Clean Architecture**:

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
- **Contratos Base:** `TenantEntity` (garante a coluna `TenantId` em todas as entidades subordinadas) e `BaseEntity` (com `Id`, `CreatedAt` e `UpdatedAt`).
- **Zero Dependências:** Totalmente agnóstico de bibliotecas externas, ORM ou HTTP.

### 2. `BitraHub.Application` (Casos de Uso & Contratos)
- **DTOs Imutáveis:** Definições em `record` tipadas para alto throughput e serialização eficiente (`LoginRequest`, `AuthResponse`, `AttendanceRecordDto`, `DashboardStatsDto`, etc.).
- **Interfaces de Serviço:** `ICurrentUserService` (extração do inquilino da requisição ativa), `IJwtTokenGenerator`.

### 3. `BitraHub.Infrastructure` (Acesso a Dados & Criptografia)
- **Mapeamento Relacional:** `BitraHubDbContext` com **EF Core 9** e driver **Npgsql** para PostgreSQL 16.
- **Filtros Globais de Isolamento (Multi-Tenancy):**
  ```csharp
  modelBuilder.Entity<Student>()
      .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);
  ```
- **Auditoria Automática no `SaveChangesAsync`:** Novas entidades recebem o `TenantId` da sessão autenticada automaticamente, impedindo adulteração de contexto.
- **Criptografia:** Hashes de senha protegidos com `BCrypt.Net` e assinatura de tokens com `HMAC-SHA256`.

### 4. `BitraHub.WebApi` (Camada HTTP & Exposição)
- **Controllers RESTful:** Organizados por recurso (`AuthController`, `AttendanceController`, `StudentsController`, `DashboardController`, etc.).
- **Tratamento de Exceções:** Middleware centralizado de tratamento de erros com respostas padronizadas em JSON (`RFC 7807`).
- **Documentação Swagger:** Interface OpenAPI 3.0 interativa disponível em `/swagger`.

---

## 🧪 4. Suíte de Testes Automatizados no Backend (xUnit)

O projeto de testes `backend/csharp/SwaliClass.Tests` valida as regras centrais de segurança e negócio sem depender de instâncias externas de banco de dados, utilizando **EF Core In-Memory**, **FluentAssertions** e **Moq**.

| Classe de Teste | Área Testada | Cenários Cobertos |
| :--- | :--- | :--- |
| **`TenantIsolationTests.cs`** | Multi-Tenancy & Segurança | • Comprova que consultas do Tenant A nunca vazam dados do Tenant B.<br>• Valida bypass legítimo do SuperAdmin para relatórios consolidados.<br>• Confirma injeção automática de `TenantId` em `SaveChangesAsync`. |
| **`AttendanceEvaluationTests.cs`** | Regras de Negócio Pedagógicas | • Valida cálculo de frequência diária e média ponderada de atividades.<br>• Emite flag de risco de evasão quando a frequência cai abaixo do limiar de **75%**. |
| **`EvasionPredictionTests.cs`** | SLA Preditivo de Abandono | • Dispara alerta crítico para **3 faltas consecutivas**, mesmo com histórico percentual geral alto.<br>• Valida que atestados médicos e justificativas quebram a contagem de faltas contínuas. |
| **`AuthSecurityTests.cs`** | Criptografia & Tokens | • Validação de hash BCrypt e rejeição de senhas incorretas.<br>• Integridade de claims no token JWT (`tenant_id`, `tenant_name`, `role`, `email`).<br>• Conformidade criptográfica com `TokenValidationParameters`. |

### Como executar a suíte de testes:
```bash
dotnet test backend/csharp/SwaliClass.sln --logger "console;verbosity=normal"
```

---

## 📦 5. Como Rodar a Aplicação

### Opção A: Subir tudo com Docker Compose (Recomendado)
Sobe o banco PostgreSQL 16, a API .NET 9 e o frontend React 19 com um único comando:

```bash
# 1. Clone o repositório
git clone https://github.com/jesieljunior/swaliclass.git
cd swaliclass

# 2. Inicie os containers
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Swagger UI:** [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **PostgreSQL:** `localhost:5432` (Database: `bitrahub`)

---

### Opção B: Rodando Localmente Passo a Passo

#### Pré-requisitos:
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/) (ou container local)

#### 1. Executar o Backend (.NET 9):
```bash
cd backend/csharp/BitraHub.WebApi
dotnet restore
dotnet run
```
A API iniciará em `http://localhost:5000`.

#### 2. Executar o Frontend (React + Vite):
```bash
# Na raiz do projeto
npm install
npm run dev
```
Acesse o navegador em `http://localhost:3000`.

---

## 📑 6. Principais Endpoints da API REST (OpenAPI 3.0)

A documentação interativa com execução em tempo real fica disponível em `/swagger`.

| Método | Endpoint | Perfil | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Autenticação e emissão de JWT com claims de Tenant. |
| `GET` | `/api/v1/auth/me` | Autenticado | Retorna dados do usuário e organização atual. |
| `GET` | `/api/v1/tenants` | SuperAdmin | Lista todas as organizações do SaaS. |
| `GET` | `/api/v1/students` | Staff | Lista paginada de estudantes isolada pelo Tenant. |
| `GET` | `/api/v1/classes` | Staff | Listagem de turmas do curso com contagem de matriculados. |
| `GET` | `/api/v1/attendance/roster` | Professor/Staff | Espelho de chamada diária por data e turma. |
| `POST` | `/api/v1/attendance/save` | Professor/Staff | Registro atômico de presenças, faltas e justificativas. |
| `GET` | `/api/v1/activities` | Staff/Aluno | Listagem de atividades com prazos e pesos de nota. |
| `GET` | `/api/v1/reports/attendance` | Coordenador/Admin | Relatório gerencial de frequência com consolidação por período. |
| `GET` | `/api/v1/dashboard/stats` | Gestor | Métricas gerenciais de evasão, turmas e atividades pendentes. |

---

## 🔧 7. Solução de Problemas no GitHub (Como Desbloquear Pastas e Limpar Resíduos)

Se ao acessar o seu repositório no GitHub você encontrou as situações abaixo, aplique estas correções rápidas no seu terminal:

### A. O GitHub bloqueou o acesso à pasta `backend` (Ícone de Submódulo / Gitlink)
**Por que aconteceu:** Se a pasta `backend` foi adicionada enquanto continha um arquivo ou pasta `.git` interna antiga, o Git registrou a pasta como um **submódulo (modo 160000)** em vez de uma pasta de arquivos comum. No GitHub, isso gera uma pasta inacessível com uma seta branca.

**Como corrigir em 3 comandos:**
```bash
# 1. Remova o ponteiro de submódulo do índice (não apaga seus arquivos)
git rm --cached backend

# 2. Adicione a pasta backend novamente como diretório normal de arquivos
git add backend/

# 3. Commit e push
git commit -m "fix: restaurar pasta backend como diretorio regular de codigo"
git push origin main
```

---

### B. Remover resíduos da pasta `.aistudio/` do repositório
O arquivo `.gitignore` deste repositório já foi atualizado para ignorar permanentemente `.aistudio/`. Caso a pasta já tenha sido enviada ao seu GitHub anteriormente, execute:

```bash
# Remove a pasta do rastreamento do Git sem deletar seus arquivos locais
git rm -r --cached .aistudio

# Salva a remoção e envia ao GitHub
git commit -m "chore: remover residuos de arquivos temporarios do rastreamento git"
git push origin main
```

---

## ⚖️ Licença

Este projeto é distribuído sob a licença [MIT](./LICENSE) — desenvolvido por **Jesiel Amaro Junior** (2026).
