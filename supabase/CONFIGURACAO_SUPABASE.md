# Guia Passo a Passo: Conectar o Supabase na Vercel

Este guia explica exatamente o que precisa ser configurado para o banco de dados e autenticação funcionarem 100% integrados entre a **Vercel** e o **Supabase**.

---

## 1. Conectar na Vercel (Integração Automática)

1. No painel do seu projeto na **Vercel** ([vercel.com](https://vercel.com)):
2. Vá na aba **Storage** (ou **Settings ➔ Integrations**).
3. Clique em **"Connect Database"** ➔ escolha **Supabase**.
4. Conecte com a sua conta do Supabase e selecione o projeto desejado.
5. A Vercel adicionará automaticamente as variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POSTGRES_URL`

> **Nota de compatibilidade:** O código do projeto já foi configurado para reconhecer tanto `SUPABASE_URL` e `SUPABASE_ANON_KEY` (gerados pela Vercel) quanto `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Você não precisa renomear nada!

---

## 2. Configurar o Supabase (Painel do Supabase)

Acesse o painel do seu projeto no **Supabase** ([supabase.com](https://supabase.com)):

### A. Configurar Redirecionamento de Login (URL Configuration)
1. No menu lateral, clique em **Authentication** (ícone de cadeado) ➔ **URL Configuration**.
2. No campo **Site URL**, coloque o endereço do seu site na Vercel:
   ```
   https://seu-projeto.vercel.app
   ```
3. No campo **Redirect URLs**, clique em **Add URI** e adicione:
   ```
   https://seu-projeto.vercel.app/**
   https://seu-projeto.vercel.app/app
   https://seu-projeto.vercel.app/auth
   http://localhost:3000/**
   ```
4. Clique em **Save**.

### B. Confirmação de E-mail (Opcional, recomendado desativar para testes)
Por padrão, o Supabase exige que todo usuário confirme o link enviado por e-mail antes de entrar. Se você quiser que o aluno ou professor se cadastre e acesse imediatamente o portal:
1. Vá em **Authentication** ➔ **Providers** ➔ clique em **Email**.
2. Desmarque a opção **"Confirm email"**.
3. Clique em **Save**.

---

## 3. Criar as Tabelas no Banco de Dados (SQL Editor)

Se o seu projeto Supabase for novo, as tabelas ainda não existem.
1. No menu lateral do Supabase, clique em **SQL Editor** (ícone de código `>_`).
2. Clique em **"New query"**.
3. Abra e copie todo o conteúdo do arquivo localizado em `supabase/migrations/20260613142251_36fbf121-9566-49e1-81fb-1bac0182cc48.sql` do repositório.
4. Cole no editor do Supabase e clique no botão verde **Run** (Executar).

Isso criará:
- Tabelas: `tenants`, `profiles`, `user_roles`, `students`, `courses`, `classes`, `attendance_sessions`, `attendance_records`, `invites`.
- Gatilho automático `on_auth_user_created`: ao criar conta (como estudante ou professor), o perfil é gerado automaticamente na tabela `profiles`.
- Políticas de Segurança Row Level Security (RLS).
