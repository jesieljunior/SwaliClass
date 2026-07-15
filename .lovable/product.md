# BitraHub — Modelagem de Produto (v1)

> Documento **de produto**, não técnico. Antecede qualquer nova implementação.
> Toda funcionalidade daqui em diante precisa responder: **qual problema resolve** e **por que alguém pagaria por isso**.

---

## 1. Personas

### P1 — Estudante Individual ("Bia, 17, 3º ano / ENEM")
- **Quem é**: aluno do ensino médio, cursinho, faculdade ou concurseiro. Estuda sozinho, com PDFs, videoaulas e cadernos espalhados.
- **Dor real**:
  - Não sabe o que estudar hoje.
  - Se perde em PDFs enormes.
  - Faz resumos ruins e esquece o que leu.
  - ChatGPT "esquece" tudo entre conversas.
- **O que procura**: um lugar único que **transforme material bruto em estudo dirigido** (resumo → flashcards → quiz → revisão espaçada) e lembre do que ele já sabe e do que erra.
- **Por que pagaria**: para ter **créditos de IA suficientes**, histórico ilimitado, memória de longo prazo, exportar flashcards e desbloquear plano de estudos personalizado.
- **Funcionalidades que realmente usa**: upload de PDF, resumo, flashcards, quiz, plano de estudos, histórico, streak.
- **Não usa**: chamada, notas, gestão de turma, relatórios institucionais.

### P2 — Professor Particular ("Rafael, prof. de matemática, 40 alunos avulsos")
- **Como trabalha**: dá aula 1:1 ou em micro-turmas (3-8 alunos), online e presencial. Cobra por hora ou pacote. Gerencia tudo em WhatsApp + planilha.
- **Dor real**:
  - Perde tempo montando material repetido.
  - Não tem onde os alunos entregarem exercícios.
  - Não sabe quem está evoluindo.
  - Não consegue vender "curso" — só hora-aula.
- **Como cadastra alunos**: manualmente ou por link de convite. Volume baixo (dezenas, não centenas).
- **Como vende cursos**: hoje não vende produto empacotado. BitraHub abre essa porta (curso gravado + turma + acompanhamento).
- **Como acompanha**: painel simples: quem entregou, quem não entregou, média, presença.
- **Módulos que precisa**: Turmas leves, Atividades, Portal do Aluno (visto pelos alunos), Bitra AI (gerar exercícios/correção), Biblioteca (reutilizar material).
- **Não precisa**: hierarquia coordenador, boletim oficial, SSO, relatórios acadêmicos densos.

### P3 — Instituição ("Colégio São Lucas — 800 alunos, 60 professores")
- **Quem administra**: diretor pedagógico + TI.
- **Quem usa diariamente**: coordenadores, professores, alunos, pais (futuro).
- **Métricas que importam**: frequência, desempenho por turma/série, taxa de entrega, engajamento no portal, uso da IA por aluno.
- **Operação**: início do ano importa alunos e turmas; ao longo do ano chamada + atividades + notas; fim de período gera boletim/relatórios.
- **Dor real**: sistemas atuais (TOTVS, Sponte, Classroom) são caros, feios, desconectados do estudo real. Nenhum tem IA integrada.
- **Por que contrata**: gestão acadêmica **+** IA pedagógica **+** portal moderno, num só produto, com preço por aluno competitivo.

### P4 (secundária) — Aluno da Instituição
Não escolhe o produto, mas **valida retenção**. Portal ruim = escola cancela.

### P5 (futura) — Responsável/Pai
Consulta boletim, frequência, comunicados. Pesa na decisão da escola.

---

## 2. Jornadas

### Estudante Individual
```text
Landing → cadastro grátis → onboarding (curso/série/objetivo)
  → cria matéria (ex: Matemática ENEM)
  → upload PDF / cola texto / cola link
  → IA gera: resumo + 10 flashcards + 5 questões
  → estuda flashcards (SRS) / faz quiz → feedback
  → plano de estudos semanal no dashboard
  → volta amanhã (streak) → IA revisa pontos fracos
  → esgota créditos free → paywall contextual → compra Student+
```

### Professor Particular
```text
Landing "sou professor" → cadastro → workspace pessoal
  → wizard: cria 1ª turma + convida 3 alunos por link
  → sobe material → IA gera exercícios da matéria
  → cria atividade com prazo → alunos entregam no Portal
  → corrige (com sugestão da IA) → nota + feedback
  → dashboard: quem está atrasado / evoluindo
  → esgota limite Free (5 alunos) → upgrade Teacher
  → (futuro) empacota como curso e vende no Marketplace
```

### Instituição
```text
Comercial fecha contrato → admin recebe workspace provisionado
  → importa alunos (CSV) + professores + turmas
  → convida coordenadores e professores por email
  → professores: chamada + atividades + notas
  → alunos: Portal + Bitra AI (cota por aluno)
  → coordenador acompanha dashboards
  → fim de bimestre: boletim PDF + relatório de frequência
  → renovação anual baseada em uso e satisfação
```

---

## 3. Catálogo de Módulos

| Módulo | Objetivo | Personas | Depende de | Vende separado? |
|---|---|---|---|---|
| **Gestão Acadêmica** | Cursos, turmas, matrículas, chamada, atividades, notas | P2, P3 | Core, RBAC | Não |
| **Portal do Aluno** | O que fazer, o que entregar, como estou | P1, P4 | Academic (P3) / standalone (P1) | Sim (Free tier) |
| **Portal do Professor** | Painel de turmas, correção assistida, comunicação | P2, P3 | Academic | Não (embutido) |
| **Bitra AI** | Transformar material em estudo + tutor com memória | P1, P2, P3 | Créditos, Entitlements | **Sim** (add-on) |
| **Biblioteca** | Material coletivo buscável, com reputação | Todos | Storage, Reputação | Sim (Student+/Teacher) |
| **Créditos** | Moeda interna para IA e serviços premium | Todos | Billing | Sim (avulso) |
| **Dashboards** | Métricas por turma/aluno/instituição | P2, P3 | Academic, Portal | Não |
| **Relatórios** | Boletim PDF, frequência, exports CSV | P3 | Academic | Não |
| **Comunidade** (v2) | Q&A entre alunos, bounties em créditos | P1 | Créditos, Reputação | Não (retenção) |
| **Marketplace** (v3) | Professor vende curso; split de receita | P2, P3 criadores | Billing avançado, Library | Sim (take rate) |

---

## 4. Modelo Comercial

### Estudante (B2C)
| Plano | Preço alvo | Inclui |
|---|---|---|
| **Free** | R$ 0 | Portal, IA (créditos free/mês), Biblioteca leitura, 1 matéria ativa |
| **Student+** | R$ 19–29/mês | Créditos ampliados, matérias ilimitadas, upload Biblioteca, export, memória longa |
| **Boost** | R$ 9–49 avulso | Pacote de créditos extra (não expira) |

### Professor Particular (B2B leve)
| Plano | Preço alvo | Inclui |
|---|---|---|
| **Teacher Start** | R$ 49/mês | até 20 alunos, 5 GB, créditos médios, 1 workspace |
| **Teacher Pro** | R$ 99/mês | até 100 alunos, 50 GB, créditos altos, marca própria leve |
| **Anual** | -20% | mesmo pacote com desconto |

### Instituição (B2B)
- **Licenciamento por aluno ativo/mês** (R$ 8–15/aluno, tier por volume).
- **Módulos opcionais**: Bitra AI (add-on por aluno), Biblioteca Premium, Portal do Responsável.
- Contrato anual, faturamento mensal, onboarding assistido.

**Recomendado**: híbrido — **SaaS com créditos**. Assinatura cobre acesso e cota de IA; consumo pesado paga pacote de créditos. Protege margem (IA é custo variável) sem quebrar previsibilidade.

---

## 5. Sistema de Créditos

| Pergunta | Resposta |
|---|---|
| Como ganha | (a) renovação mensal do plano (bucket `free`, expira), (b) contribuição aprovada na Biblioteca / respostas votadas (bucket `earned`, não expira). |
| Como compra | Pacotes avulsos via Stripe/Paddle → bucket `purchased`, não expira. |
| Como gasta | Ordem fixa: `free` → `earned` → `purchased`. Consumo atômico via ledger append-only. |
| Quando expira | Só o bucket `free`. `earned` e `purchased` vitalícios enquanto a conta existir. |
| Anti-abuso | Rate limit por ação, verificação de e-mail, limite diário de "earned", moderação de contribuições, device fingerprint em Free. |
| Incentivo | Upload aprovado (créditos + reputação), resposta bem votada, streak semanal, indicação de amigo. |

---

## 6. Biblioteca Mundial

**Entrada**: upload direto (PDF/DOCX/MD), colar link (arxiv, blog), publicar resumo gerado pelo próprio usuário (opt-in).

**Classificação**: obrigatório `disciplina`, `nível`, `idioma`, `licença`. IA sugere tags/tópicos; usuário revisa.

**Anti-duplicidade**: hash SHA-256 + embedding do texto. Similar > threshold → sugere item existente ("já existe algo assim; curtir/salvar?").

**Reputação**: pontos por upload aprovado, avaliação positiva, ausência de denúncias. Reputação alta = mais uploads/dia, revisão automática mais leve, badge.

**Moderação**: fila `pending → approved/rejected`. Auto-aprovação para alta reputação; pré-moderação para novos ou "suspeitos". Denúncias reabrem revisão.

**Escala (milhões)**: busca híbrida — full-text `tsvector` PT-BR + embeddings pgvector HNSW. Filtros por disciplina/nível/idioma. Ranking = relevância + reputação + avaliação média + recência.

**Descoberta**: página por disciplina, "trending por assunto", "recomendado para você" (baseado na memória do AI).

---

## 7. Bitra AI — Proposta de valor

| Persona | Por que usaria |
|---|---|
| Aluno | Vira material bruto em rota de estudo. Lembra dos meus pontos fracos. Simula prova. Não esquece. |
| Professor | Gera exercícios, gabaritos e variações em segundos. Sugere feedback. Corrige rascunhos. |
| Escola | Reduz custo de produção, aumenta engajamento, entrega métrica real de aprendizado. |

**Problemas que resolve**:
- Aluno perdido no "por onde começar".
- Professor gastando fim de semana produzindo prova.
- Escola sem insight de onde cada aluno trava.

**Diferenciais vs ChatGPT genérico**:
1. **Memória persistente por aluno** (fraquezas, metas, histórico).
2. **Ancorado no material real** da turma/instituição (RAG na Biblioteca privada).
3. **Integrado ao fluxo**: nasce dentro de atividade, nota, PDF — não numa janela vazia.
4. **Cobrança previsível** via créditos, sem "surprise bill".
5. **Modo professor**: gera com rubrica, dificuldade e formato pedagógico corretos.
6. **Privacidade**: dados do aluno não treinam modelo público.

---

## 8. Roadmap de Produto (por valor, não por técnica)

### MVP — "O professor particular tem onde trabalhar"
- Cadastro P2, workspace, 1 turma, convite de alunos.
- Atividades com upload de entrega, correção manual, nota.
- Portal do aluno (P4) simples: minhas atividades, minhas notas.
- Bitra AI básico (chat + geração de exercícios) com créditos free.
- Billing: Free + Teacher Start (Stripe).
- **Sucesso**: 100 professores pagantes.

### v1.1 — "O estudante individual tem produto próprio"
- Cadastro P1 (tenant pessoal), onboarding leve.
- Upload PDF → resumo → flashcards → quiz.
- Plano Student+ + compra de créditos avulsos.
- **Sucesso**: 1.000 estudantes ativos/mês.

### v1.2 — "A instituição pequena entra"
- Import CSV alunos/professores/turmas, papel coordenador.
- Chamada, boletim PDF, relatórios básicos.
- Contrato anual manual, cobrança por aluno.
- **Sucesso**: 3 escolas pagantes.

### v2.0 — "Biblioteca vira diferencial"
- Upload público, moderação, reputação, busca híbrida.
- Comunidade Q&A com bounties em créditos.
- IA com RAG na biblioteca da instituição.
- **Sucesso**: 10k itens curados, NPS > 50.

### v3.0 — "BitraHub vira plataforma"
- Marketplace: professor vende curso, split de receita.
- Portal do responsável, integrações (Google Classroom import, SSO).
- API pública / SDK para parceiros.
- **Sucesso**: 20% da receita vindo de marketplace + expansão.

---

## 9. Crítica honesta ao projeto

**Complexo demais para agora**
- 3 personas + 3 tipos de tenant + créditos + biblioteca mundial + gamificação **no mesmo MVP**. 18 meses antes do primeiro real. Precisa cortar.
- Event bus / outbox / pgvector / HNSW antes de ter usuário. Adiar para v2.
- Coordenador, boletim oficial, responsável, SSO — só fazem sentido a partir de v1.2.

**Não faz sentido (ainda)**
- Gamificação completa (XP, níveis, conquistas, streaks, leaderboard) no MVP. Streak simples basta.
- Marketplace "próximo" — só após oferta e demanda comprovadas.
- Biblioteca mundial pública antes de ter usuários que produzam conteúdo (vazia = morta).

**Falta**
- **Definição de ICP inicial**: escolher **uma** persona para atacar primeiro (recomendo **P2 — Professor Particular**: pagam rápido, ciclo curto, viralizam via alunos).
- **Métrica-norte** por fase (professores pagantes ativos no MVP).
- **Estratégia de aquisição** (SEO conteúdo, indicação, comunidade de professores).
- **Onboarding com "tempo até valor"** medido — quanto até o professor ter 1 turma funcionando?
- **Preço testado com entrevistas**, não chutado.
- **Política de dados de menores** (LGPD, consentimento de responsável) — bloqueia vender à escola.

**Riscos de adoção**
- Professor não migra de WhatsApp+planilha se setup levar > 10 min.
- Escola não troca de sistema no meio do ano letivo — janela de venda curta (out–jan).
- Aluno individual não paga sem sentir valor nos 3 primeiros usos → onboarding é vida ou morte.
- IA cara sem cobrança inteligente = queima de caixa.

**Riscos de venda**
- Discurso "faz tudo" confunde. Precisa de **um pitch por persona**.
- Sem cases, escola não compra. Começar por 2–3 escolas parceiras com desconto agressivo em troca de case.

**Corte recomendado para o MVP real**
1. Foco único: **P2 (Professor Particular)**.
2. Módulos: Turmas, Atividades, Portal do Aluno (visão simples), Bitra AI básico, Billing Free/Teacher.
3. Adiar: Biblioteca pública, Comunidade, Gamificação, Coordenador, Marketplace, Portal do Responsável, SSO, pgvector.
4. Manter na arquitetura (já existente) mas **sem UI**: tenants `personal`/`institution`, créditos, entitlements — prontos para ligar em v1.1 e v1.2.

---

## Próximo passo

Você decide o ICP e o corte do MVP. Sugestão forte: **congelar novas features** e a próxima sprint ser **"MVP Professor Particular"** — fluxo cadastro → turma → atividade → entrega → nota → billing, com o resto escondido atrás de flags.
