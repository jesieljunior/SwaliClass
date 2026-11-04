import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
  Copy,
  Check,
  RotateCw,
  Coins,
  ChevronRight,
  Brain,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { creditsStore, CreditBalances } from "@/lib/credits-store";
import { useSession } from "@/hooks/use-session";
import { useViewMode } from "@/lib/view-mode";

export const Route = createFileRoute("/_authenticated/app/ia")({
  component: SwaliAiPage,
});

export function SwaliAiPage() {
  const session = useSession().data;
  const isProfessor = !!session?.isProfessor;

  const [activeTab, setActiveTab] = useState<"student" | "teacher">(
    isProfessor ? "teacher" : "student",
  );
  const [balances, setBalances] = useState<CreditBalances>(creditsStore.getBalances());
  const [rechargeOpen, setRechargeOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setBalances(creditsStore.getBalances());
    window.addEventListener("swaliclass_credits_updated", handleUpdate);
    return () => window.removeEventListener("swaliclass_credits_updated", handleUpdate);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header com Saldo de Créditos */}
      <div className="flex justify-between items-start gap-4 flex-wrap pb-4 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-900/5 text-navy-800 text-[11px] font-bold font-mono uppercase tracking-wider mb-1">
            <Sparkles className="size-3 text-navy-600" /> Swali AI Pedagógica
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-navy-900">
            Assistente de Estudo & Ensino
          </h1>
          <p className="text-xs text-navy-800/60 mt-1 max-w-xl">
            Inteligência artificial contextualizada ao conteúdo das turmas, com memória pedagógica e
            cobrança previsível por créditos.
          </p>
        </div>

        {/* Card do Saldo de Créditos */}
        <div className="bg-white border border-border-subtle rounded-lg p-3.5 shadow-xs flex items-center gap-4">
          <div className="size-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Coins className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-navy-800/50">
              Saldo de Créditos
            </div>
            <div className="text-xl font-display font-black text-navy-900">
              {balances.total}{" "}
              <span className="text-xs font-normal text-navy-800/60">créditos</span>
            </div>
          </div>
          <button
            onClick={() => setRechargeOpen(true)}
            className="px-3 h-8 bg-navy-900 text-paper rounded text-xs font-bold hover:bg-navy-800 transition-colors"
          >
            Extrato
          </button>
        </div>
      </div>

      {/* Navegação entre Modo Aluno e Modo Docente */}
      <div className="flex border-b border-border-subtle gap-2">
        <button
          onClick={() => setActiveTab("student")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "student"
              ? "border-navy-900 text-navy-900"
              : "border-transparent text-navy-800/50 hover:text-navy-900"
          }`}
        >
          <Brain className="size-4" /> Estudo Dirigido (Aluno)
        </button>
        <button
          onClick={() => setActiveTab("teacher")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "teacher"
              ? "border-navy-900 text-navy-900"
              : "border-transparent text-navy-800/50 hover:text-navy-900"
          }`}
        >
          <Layers className="size-4" /> Gerador Pedagógico (Professor)
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === "student" ? (
        <StudentStudyDirigido balances={balances} />
      ) : (
        <TeacherExerciseGenerator balances={balances} />
      )}

      {/* Modal de Extrato e Recarga de Créditos */}
      {rechargeOpen && <CreditsRechargeModal onClose={() => setRechargeOpen(false)} />}
    </div>
  );
}

// ==========================================
// MODO ALUNO: ESTUDO DIRIGIDO
// ==========================================
function StudentStudyDirigido({ balances }: { balances: CreditBalances }) {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"summary" | "flashcards" | "quiz">("summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // Estados dos Flashcards
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [weakPoints, setWeakPoints] = useState<string[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);

  // Estados do Quiz
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const presetTopics = [
    "Primeira Lei da Termodinâmica e Ciclos Gasosos",
    "Estrutura da Redação Modelo ENEM com Proposta de Intervenção",
    "Revolução Francesa e a Queda do Antigo Regime",
    "Funções Trigonométricas no Círculo Unitário",
  ];

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Por favor, digite ou selecione um tema de estudo.");
      return;
    }

    const cost = 5;
    if (balances.total < cost) {
      toast.error("Saldo insuficiente de créditos", {
        description:
          "Você precisa de 5 créditos para gerar este material. Recarregue no topo da página.",
      });
      return;
    }

    const spent = creditsStore.spendCredits(
      cost,
      `Geração de ${mode === "summary" ? "Resumo" : mode === "flashcards" ? "Flashcards" : "Quiz"}: ${topic.slice(0, 30)}...`,
    );
    if (!spent) return;

    setIsGenerating(true);
    setResult(null);
    setCardIndex(0);
    setIsFlipped(false);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setWeakPoints([]);
    setMasteredCount(0);

    setTimeout(() => {
      setIsGenerating(false);

      if (mode === "summary") {
        setResult({
          title: topic,
          executiveSummary: `Síntese estruturada sobre ${topic}. Este conteúdo foi formatado pela Swali AI com foco em retenção de longo prazo e aplicação prática em vestibulares e provas escolares.`,
          keyPoints: [
            "Conceito Fundamental: Relação de causa e efeito central do tema e suas principais leis/princípios.",
            "Aplicações Práticas: Como esse tópico costuma ser cobrado nas principais bancas de avaliação (ex: ENEM, Fuvest).",
            "Pegadinha Clássica: Confusão frequente entre os termos técnicos — preste muita atenção nas unidades e convenções.",
            "Mnemônico de Memorização: Dica prática para recuperar a informação durante a resolução de exercícios.",
          ],
          reviewSchedule:
            "Revisão recomendada: daqui a 24 horas (Curva de Esquecimento de Ebbinghaus) e novamente em 7 dias.",
        });
      } else if (mode === "flashcards") {
        setResult({
          title: topic,
          cards: [
            {
              front: `Qual é o postulado central de "${topic}"?`,
              back: "O princípio fundamental estabelece a conservação e transformação mútua entre as grandezas envolvidas no sistema fechado.",
              topicTip:
                "Memorize a equação básica que relaciona entrada, saída e variação interna.",
            },
            {
              front: "Quais são as condições de contorno necessárias para sua validade?",
              back: "O sistema deve operar em regime estacionário ou com fronteiras termicamente isoladas (adiabáticas).",
              topicTip: "Geralmente cobrado em pegadinhas teóricas que mudam o isolamento.",
            },
            {
              front: "Qual é o erro mais comum cometido pelos alunos ao resolver este tópico?",
              back: "Inversão de sinais de trabalho/calor e esquecer de converter as grandezas para as unidades do Sistema Internacional (SI).",
              topicTip: "Sempre liste as unidades antes de iniciar o cálculo numérico.",
            },
          ],
        });
      } else {
        setResult({
          title: topic,
          questions: [
            {
              id: 1,
              question: `Sobre os conceitos fundamentais de ${topic}, assinale a afirmativa correta:`,
              options: [
                "A energia total do sistema sempre diminui espontaneamente com o passar do tempo.",
                "Em processos cíclicos fechados, a variação da energia interna é estritamente nula.",
                "Não há influência das variáveis externas sobre o rendimento final do processo.",
                "A eficiência máxima independe das temperaturas das fontes de calor envolvidas.",
              ],
              correctIndex: 1,
              explanation:
                "Em processos cíclicos, como o estado final coincide exatamente com o estado inicial, as variáveis de estado têm variação nula (ΔU = 0).",
            },
            {
              id: 2,
              question:
                "Qual elemento é indispensável para evitar o erro clássico de cálculo neste tema?",
              options: [
                "Desprezar perdas por atrito sem verificar as hipóteses do enunciado.",
                "Utilizar temperaturas diretamente em graus Celsius sem converter para Kelvin.",
                "Garantir a homogeneidade das unidades do SI antes de aplicar as fórmulas.",
                "Suprimir a pressão atmosférica em cálculos ao nível do mar.",
              ],
              correctIndex: 2,
              explanation:
                "O uso rigoroso de unidades compatíveis (Joules, Kelvin, Pascal) previne erros de ordens de grandeza nas equações constitutivas.",
            },
          ],
        });
      }

      toast.success("Material gerado com sucesso!", {
        description: "5 créditos deduzidos do seu saldo. Streak de estudo ativo!",
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Configuração */}
      <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-navy-900 mb-1">
            O que você deseja estudar hoje?
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Digite um assunto, cole o trecho de um PDF ou escolha um tema sugerido…"
            className="w-full h-11 px-3 border border-border-subtle rounded-md text-sm outline-none focus:border-navy-900"
          />
        </div>

        {/* Temas Sugeridos */}
        <div>
          <span className="text-[11px] font-mono uppercase text-navy-800/50 block mb-1.5">
            Sugestões Rápidas:
          </span>
          <div className="flex gap-2 flex-wrap">
            {presetTopics.map((pt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTopic(pt)}
                className="text-xs px-2.5 py-1 rounded bg-navy-900/5 text-navy-800 hover:bg-navy-900/10 transition-colors"
              >
                {pt}
              </button>
            ))}
          </div>
        </div>

        {/* Formatos de Aprendizagem */}
        <div>
          <label className="block text-xs font-bold text-navy-900 mb-2">
            Escolha o formato de estudo:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: "summary",
                label: "Resumo Estruturado",
                icon: FileText,
                desc: "Conceitos principais, fórmulas e dicas de memorização",
              },
              {
                id: "flashcards",
                label: "Flashcards Interativos",
                icon: BookOpen,
                desc: "Cartões viráveis com diagnóstico de pontos fracos",
              },
              {
                id: "quiz",
                label: "Quiz com Diagnóstico",
                icon: HelpCircle,
                desc: "Questões com gabarito imediato e explicação didática",
              },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = mode === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMode(f.id as any)}
                  className={`p-3.5 rounded-md border text-left transition-all ${
                    isSelected
                      ? "border-navy-900 bg-navy-900/5 text-navy-900 ring-1 ring-navy-900"
                      : "border-border-subtle bg-white text-navy-800 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="size-4 text-navy-700" />
                    <strong className="text-xs">{f.label}</strong>
                  </div>
                  <p className="text-[11px] text-navy-800/60">{f.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <span className="text-xs text-navy-800/60 flex items-center gap-1 font-mono">
            <Coins className="size-3.5 text-amber-600" /> Custo: <strong>5 créditos</strong>
          </span>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="px-5 h-10 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800 inline-flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <RotateCw className="size-4 animate-spin" /> Gerando com Swali AI…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Gerar Material de Estudo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultados Gerados */}
      {result && (
        <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-navy-800/50">
                Resultado Gerado · Swali AI
              </span>
              <h3 className="font-display font-bold text-lg text-navy-900">{result.title}</h3>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                toast.success("Conteúdo copiado!");
              }}
              className="p-2 border border-border-subtle rounded text-xs font-medium hover:bg-surface inline-flex items-center gap-1"
            >
              <Copy className="size-3.5" /> Copiar
            </button>
          </div>

          {/* Renderização Resumo */}
          {mode === "summary" && (
            <div className="space-y-4">
              <div className="p-4 bg-navy-900/5 rounded-md border border-navy-900/10 text-xs text-navy-900 leading-relaxed">
                <p className="font-semibold mb-1">Síntese Estratégica:</p>
                {result.executiveSummary}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-800/70 font-mono">
                  Pontos Centrais para Provas:
                </h4>
                <div className="grid gap-2">
                  {result.keyPoints.map((pt: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 border border-border-subtle rounded-md text-xs bg-surface/50 flex items-start gap-2.5"
                    >
                      <Lightbulb className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>{result.reviewSchedule}</span>
              </div>
            </div>
          )}

          {/* Renderização Flashcards */}
          {mode === "flashcards" && result.cards && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-mono text-navy-800/60">
                <span>
                  Card {cardIndex + 1} de {result.cards.length}
                </span>
                <span>
                  Dominados: {masteredCount} | Pontos Fracos: {weakPoints.length}
                </span>
              </div>

              {/* Cartão Interativo */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer min-h-[200px] p-8 rounded-xl border-2 border-navy-900/20 bg-gradient-to-br from-surface to-white flex flex-col justify-between items-center text-center transition-all shadow-xs hover:border-navy-900/50"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/40">
                  {isFlipped
                    ? "RESPOSTA / CONCEITO (Clique para voltar)"
                    : "PERGUNTA (Clique para virar o cartão)"}
                </span>

                <p className="font-display font-bold text-base md:text-lg text-navy-900 max-w-lg my-4">
                  {isFlipped ? result.cards[cardIndex].back : result.cards[cardIndex].front}
                </p>

                {isFlipped && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-mono">
                    💡 Dica: {result.cards[cardIndex].topicTip}
                  </span>
                )}
              </div>

              {/* Ações de Avaliação do Aluno */}
              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const card = result.cards[cardIndex];
                    if (!weakPoints.includes(card.front)) {
                      setWeakPoints([...weakPoints, card.front]);
                    }
                    if (cardIndex < result.cards.length - 1) {
                      setCardIndex(cardIndex + 1);
                      setIsFlipped(false);
                    } else {
                      toast.info("Fim da rodada de revisão!");
                    }
                  }}
                  className="flex-1 h-10 border border-rose-300 text-rose-700 rounded-sm text-xs font-bold hover:bg-rose-50"
                >
                  Preciso Revisar (Ponto Fraco)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMasteredCount(masteredCount + 1);
                    if (cardIndex < result.cards.length - 1) {
                      setCardIndex(cardIndex + 1);
                      setIsFlipped(false);
                    } else {
                      toast.success("Excelente! Você dominou todos os cartões!");
                    }
                  }}
                  className="flex-1 h-10 bg-emerald-600 text-paper rounded-sm text-xs font-bold hover:bg-emerald-700"
                >
                  Acertei / Já Dominei 👍
                </button>
              </div>

              {weakPoints.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                  <strong className="block mb-1">
                    Diagnóstico Swali AI - Seus Pontos de Atenção:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {weakPoints.map((wp, i) => (
                      <li key={i}>{wp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Renderização Quiz */}
          {mode === "quiz" && result.questions && (
            <div className="space-y-6">
              {result.questions.map((q: any, qIdx: number) => {
                const userChoice = selectedAnswers[qIdx];
                const isAnswered = userChoice !== undefined;
                return (
                  <div
                    key={q.id}
                    className="p-4 border border-border-subtle rounded-lg space-y-3 bg-surface/30"
                  >
                    <p className="font-semibold text-sm text-navy-900">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isChosen = userChoice === optIdx;
                        const isCorrect = optIdx === q.correctIndex;

                        let style = "border-border-subtle bg-white hover:bg-surface text-navy-900";
                        if (quizSubmitted) {
                          if (isCorrect)
                            style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                          else if (isChosen && !isCorrect)
                            style = "border-rose-400 bg-rose-50 text-rose-900";
                        } else if (isChosen) {
                          style = "border-navy-900 bg-navy-900/5 text-navy-900 font-semibold";
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() =>
                              setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx })
                            }
                            className={`w-full p-2.5 rounded border text-left text-xs transition-colors flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && (
                              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            )}
                            {quizSubmitted && isChosen && !isCorrect && (
                              <XCircle className="size-4 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-3 bg-navy-900/5 border border-navy-900/10 rounded-md text-xs text-navy-900">
                        <strong className="block text-navy-900 mb-0.5">
                          Explicação Pedagógica:
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={() => {
                    if (Object.keys(selectedAnswers).length < result.questions.length) {
                      toast.error("Responda todas as questões antes de conferir o resultado.");
                      return;
                    }
                    setQuizSubmitted(true);
                  }}
                  className="w-full h-10 bg-navy-900 text-paper font-bold text-xs rounded-sm hover:bg-navy-800 transition-colors"
                >
                  Conferir Respostas e Diagnóstico
                </button>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center justify-between">
                  <span>
                    Quiz corrigido! Revise os comentários pedagógicos de cada alternativa.
                  </span>
                  <button
                    onClick={() => {
                      setSelectedAnswers({});
                      setQuizSubmitted(false);
                    }}
                    className="underline font-bold hover:text-emerald-950"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// MODO DOCENTE: GERADOR PEDAGÓGICO DE EXERCÍCIOS
// ==========================================
function TeacherExerciseGenerator({ balances }: { balances: CreditBalances }) {
  const [subject, setSubject] = useState("Física");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Ensino Médio / ENEM");
  const [count, setCount] = useState("3");
  const [type, setType] = useState<"multiple" | "dissertative">("multiple");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<any | null>(null);

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Por favor, informe o tópico para geração dos exercícios.");
      return;
    }

    const cost = 5;
    if (balances.total < cost) {
      toast.error("Saldo insuficiente de créditos");
      return;
    }

    creditsStore.spendCredits(cost, `Gerador Docente: Lista de ${subject} (${topic.slice(0, 25)})`);
    setIsGenerating(true);
    setGeneratedList(null);

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedList({
        title: `Lista de Exercícios: ${topic}`,
        subject,
        level,
        type: type === "multiple" ? "Múltipla Escolha" : "Dissertativas",
        exercises: [
          {
            num: 1,
            enunciado: `(ENEM / Prova) Considerando as leis fundamentais de ${topic} no contexto da disciplina de ${subject}, analise a situação em que ocorre variação de rendimento térmico ou dinâmico. O comportamento esperado para as grandezas dependentes é:`,
            options:
              type === "multiple"
                ? [
                    "A) Aumento linear com a pressão absoluta.",
                    "B) Proporcionalidade direta com o quadrado da temperatura.",
                    "C) Conservação total do fluxo de energia sem dissipação.",
                    "D) Dependência exclusiva do gradiente entre os polos do sistema.",
                  ]
                : null,
            gabarito:
              type === "multiple"
                ? "Opção B"
                : "Resposta esperada: O aluno deve enunciar o teorema da conservação, deduzir a equação com as variáveis dadas e concluir a proporcionalidade direta.",
            criteriosCorrecao:
              "Atribuir 50% pela identificação das fórmulas corretas e 50% pelo desenvolvimento coerente e unidades no SI.",
          },
          {
            num: 2,
            enunciado: `Em uma aula experimental sobre ${topic}, um grupo de estudantes coletou dados e verificou discrepâncias de 8% em relação ao modelo ideal. Qual hipótese justifica fisicamente essa divergência?`,
            options:
              type === "multiple"
                ? [
                    "A) Desprezo do atrito com o meio e condução residual de calor pelas paredes.",
                    "B) Violação temporária do princípio da incerteza de Heisenberg.",
                    "C) Inversão espontânea de entropia no ambiente laboratorial.",
                    "D) Aceleração gravitacional nula no instante da medição.",
                  ]
                : null,
            gabarito:
              type === "multiple"
                ? "Opção A"
                : "Resposta esperada: Hipótese de perdas térmicas para o meio por convecção e radiação não computadas no modelo ideal simplificado.",
            criteriosCorrecao:
              "Valorizar a fundamentação termodinâmica / mecânica e a clareza argumentativa.",
          },
        ],
      });
      toast.success("Lista de exercícios e gabarito gerados!");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-base text-navy-900">
          Configuração da Lista de Exercícios
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">Disciplina</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
            >
              <option value="Física">Física</option>
              <option value="Matemática">Matemática</option>
              <option value="Química">Química</option>
              <option value="História">História</option>
              <option value="Geografia">Geografia</option>
              <option value="Biologia">Biologia</option>
              <option value="Língua Portuguesa">Língua Portuguesa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Nível de Ensino
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
            >
              <option value="Ensino Fundamental II">Ensino Fundamental II</option>
              <option value="Ensino Médio / ENEM">Ensino Médio / ENEM</option>
              <option value="Vestibulares Militares / IME-ITA">
                Vestibulares Militares / IME-ITA
              </option>
              <option value="Ensino Superior">Ensino Superior</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-800 mb-1">
              Tipo de Questão
            </label>
            <div className="flex gap-2 h-10">
              <button
                type="button"
                onClick={() => setType("multiple")}
                className={`flex-1 rounded border text-xs font-semibold ${
                  type === "multiple"
                    ? "border-navy-900 bg-navy-900 text-paper"
                    : "border-border-subtle"
                }`}
              >
                Múltipla Escolha
              </button>
              <button
                type="button"
                onClick={() => setType("dissertative")}
                className={`flex-1 rounded border text-xs font-semibold ${
                  type === "dissertative"
                    ? "border-navy-900 bg-navy-900 text-paper"
                    : "border-border-subtle"
                }`}
              >
                Dissertativa
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1">
            Tópico ou Habilidade Específica
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex.: Leis de Newton aplicadas a planos inclinados com atrito cinético"
            className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none focus:border-navy-900"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <span className="text-xs text-navy-800/60 font-mono flex items-center gap-1">
            <Coins className="size-3.5 text-amber-600" /> Custo: 5 créditos
          </span>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="px-5 h-10 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800 inline-flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <RotateCw className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Gerar Lista com Gabarito
          </button>
        </div>
      </div>

      {generatedList && (
        <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <span className="text-[10px] font-mono uppercase text-navy-800/50">
                {generatedList.subject} · {generatedList.level}
              </span>
              <h3 className="font-display font-bold text-lg text-navy-900">
                {generatedList.title}
              </h3>
            </div>
            <button
              onClick={() => {
                const text = generatedList.exercises
                  .map(
                    (e: any) =>
                      `Questão ${e.num}:\n${e.enunciado}\n\nGabarito: ${e.gabarito}\nCritérios: ${e.criteriosCorrecao}`,
                  )
                  .join("\n\n---\n\n");
                navigator.clipboard.writeText(text);
                toast.success("Lista e gabaritos copiados para a área de transferência!");
              }}
              className="px-3 h-8 border border-border-subtle rounded text-xs font-bold hover:bg-surface inline-flex items-center gap-1"
            >
              <Copy className="size-3.5" /> Copiar Prova Completa
            </button>
          </div>

          <div className="space-y-6">
            {generatedList.exercises.map((ex: any) => (
              <div
                key={ex.num}
                className="p-4 border border-border-subtle rounded-md space-y-3 bg-surface/30"
              >
                <p className="text-xs font-medium text-navy-900 leading-relaxed">
                  <strong>Questão {ex.num}.</strong> {ex.enunciado}
                </p>

                {ex.options && (
                  <div className="space-y-1 pl-3 text-xs text-navy-800">
                    {ex.options.map((opt: string, i: number) => (
                      <div key={i}>{opt}</div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-border-subtle/80 text-xs space-y-1 bg-white p-3 rounded">
                  <p className="text-emerald-800 font-bold">✓ Gabarito: {ex.gabarito}</p>
                  <p className="text-navy-800/70 text-[11px]">
                    <strong>Critérios de pontuação:</strong> {ex.criteriosCorrecao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MODAL DE RECARGA E EXTRATO DE CRÉDITOS
// ==========================================
function CreditsRechargeModal({ onClose }: { onClose: () => void }) {
  const balances = creditsStore.getBalances();
  const history = creditsStore.getHistory();

  const handleSimulateRecharge = (amount: number, name: string) => {
    creditsStore.addCredits(amount, "purchased", `Recarga de créditos avulsa (${name})`);
    toast.success(`+${amount} créditos adicionados com sucesso!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-border-subtle flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div>
            <h2 className="font-display font-bold text-lg text-navy-900 flex items-center gap-2">
              <Coins className="size-5 text-amber-600" /> Sistema de Créditos Educacionais
            </h2>
            <p className="text-xs text-navy-800/60 mt-0.5">
              Moeda interna para uso da Swali AI e incentivo na comunidade
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-navy-800/40 hover:text-navy-900 rounded-sm">
            <XCircle className="size-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Card dos 3 Tipos de Crédito */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border border-border-subtle rounded-md bg-surface text-xs">
              <span className="text-[10px] font-mono text-navy-800/50 uppercase block">
                Créditos do Plano
              </span>
              <strong className="text-lg font-bold text-navy-900">{balances.planCredits}</strong>
              <p className="text-[10px] text-navy-800/40 mt-1">Renovam todo mês</p>
            </div>
            <div className="p-3 border border-border-subtle rounded-md bg-surface text-xs">
              <span className="text-[10px] font-mono text-navy-800/50 uppercase block">
                Contribuição
              </span>
              <strong className="text-lg font-bold text-emerald-600">
                {balances.contributionCredits}
              </strong>
              <p className="text-[10px] text-navy-800/40 mt-1">Ganhos ajudando · Permanentes</p>
            </div>
            <div className="p-3 border border-border-subtle rounded-md bg-surface text-xs">
              <span className="text-[10px] font-mono text-navy-800/50 uppercase block">
                Comprados
              </span>
              <strong className="text-lg font-bold text-amber-600">
                {balances.purchasedCredits}
              </strong>
              <p className="text-[10px] text-navy-800/40 mt-1">Pacotes avulsos · Não expiram</p>
            </div>
          </div>

          {/* Pacotes de Recarga */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
              Adquirir Mais Créditos:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSimulateRecharge(50, "Pacote Essencial")}
                className="p-3 border border-border-subtle rounded-md hover:border-navy-900 text-left transition-colors flex justify-between items-center bg-white"
              >
                <div>
                  <strong className="block text-xs text-navy-900">+50 Créditos</strong>
                  <span className="text-[10px] text-navy-800/50">Pacote Essencial</span>
                </div>
                <span className="text-xs font-bold font-mono text-navy-900">R$ 9,90</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateRecharge(150, "Pacote Pro")}
                className="p-3 border border-border-subtle rounded-md hover:border-navy-900 text-left transition-colors flex justify-between items-center bg-white"
              >
                <div>
                  <strong className="block text-xs text-navy-900">+150 Créditos</strong>
                  <span className="text-[10px] text-navy-800/50">Pacote Intensivo</span>
                </div>
                <span className="text-xs font-bold font-mono text-navy-900">R$ 24,90</span>
              </button>
            </div>
          </div>

          {/* Extrato de Transações */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-navy-900 uppercase font-mono tracking-wider">
              Histórico Recente de Transações:
            </h4>
            <div className="border border-border-subtle rounded-md divide-y divide-border-subtle text-xs max-h-48 overflow-y-auto">
              {history.map((tx) => (
                <div key={tx.id} className="p-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900 truncate">{tx.description}</p>
                    <span className="text-[10px] text-navy-800/40 font-mono">
                      {new Date(tx.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold shrink-0 ${
                      tx.type === "spent" ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {tx.type === "spent" ? `-${tx.amount}` : `+${tx.amount}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-subtle bg-surface/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 h-9 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
