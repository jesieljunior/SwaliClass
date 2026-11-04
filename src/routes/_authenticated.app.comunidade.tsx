import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  MessageSquare,
  Flame,
  CheckCircle2,
  Award,
  Plus,
  Coins,
  Send,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  X,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { creditsStore, StudyStreak } from "@/lib/credits-store";

export const Route = createFileRoute("/_authenticated/app/comunidade")({
  component: ComunidadePage,
});

interface QuestionItem {
  id: string;
  author: string;
  subject: string;
  title: string;
  content: string;
  rewardCredits: number;
  date: string;
  solved: boolean;
  replies: {
    id: string;
    author: string;
    text: string;
    isBestAnswer: boolean;
    likes: number;
    date: string;
  }[];
}

const INITIAL_QUESTIONS: QuestionItem[] = [
  {
    id: "q-1",
    author: "Ana Clara Oliveira (Aluna)",
    subject: "Física",
    title: "Como calcular o rendimento térmico do ciclo de Carnot sem confundir as temperaturas?",
    content:
      "Estou travando na hora de identificar se preciso sempre converter para Kelvin ou se posso usar Celsius direto na fórmula do rendimento η = 1 - (Tf / Tq).",
    rewardCredits: 10,
    date: "Hoje às 10:30",
    solved: true,
    replies: [
      {
        id: "r-1",
        author: "Lucas Mendes (Aluno)",
        text: "Oi Ana! É OBRIGATÓRIO converter para Kelvin (K = °C + 273). Na fórmula do rendimento, você está fazendo uma razão entre temperaturas absolutas. Se usar Celsius, o zero não representa ausência de energia térmica e a proporção fica completamente errada!",
        isBestAnswer: true,
        likes: 12,
        date: "Hoje às 11:05",
      },
    ],
  },
  {
    id: "q-2",
    author: "Beatriz Souza (Aluna)",
    subject: "Redação",
    title: "Qual a melhor forma de conectar o Repertório Sociológico com o Tema no D1?",
    content:
      "Gostaria de sugestões de conectivos e frases-guia para não deixar o repertório produtivo parecer jogado no texto.",
    rewardCredits: 15,
    date: "Ontem às 16:45",
    solved: false,
    replies: [
      {
        id: "r-2",
        author: "Dra. Mariana Costa (Professora)",
        text: "Uma técnica excelente é usar a fórmula 'Repertório + Descompasso na realidade brasileira': ex: 'Analogamente ao conceito de Modernidade Líquida formulado por Zygmunt Bauman, nota-se que a fragilidade dos laços comunitários reflete-se na problemática de...'",
        isBestAnswer: false,
        likes: 19,
        date: "Ontem às 17:30",
      },
    ],
  },
];

export function ComunidadePage() {
  const [questions, setQuestions] = useState<QuestionItem[]>(INITIAL_QUESTIONS);
  const [streak, setStreak] = useState<StudyStreak>(creditsStore.getStreak());
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const handleStreak = () => setStreak(creditsStore.getStreak());
    window.addEventListener("swaliclass_streak_updated", handleStreak);
    return () => window.removeEventListener("swaliclass_streak_updated", handleStreak);
  }, []);

  const handleBestAnswer = (qId: string, replyId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          solved: true,
          replies: q.replies.map((r) => (r.id === replyId ? { ...r, isBestAnswer: true } : r)),
        };
      }),
    );

    creditsStore.addCredits(10, "contribution", "Recompensa por Melhor Resposta na Comunidade");
    toast.success("Resposta marcada como a melhor!", {
      description: "+10 Créditos por Contribuição concedidos ao autor da resposta!",
    });
  };

  const handleSendReply = (qId: string) => {
    if (!replyText.trim()) return;

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          replies: [
            ...q.replies,
            {
              id: `r-${Date.now()}`,
              author: "Você (Colaborador)",
              text: replyText,
              isBestAnswer: false,
              likes: 0,
              date: "Agora mesmo",
            },
          ],
        };
      }),
    );

    setReplyText("");
    toast.success("Resposta publicada!");
  };

  const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="space-y-6">
      {/* Header com Gamificação e Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Banner da Comunidade */}
        <div className="lg:col-span-8 bg-white border border-border-subtle rounded-lg p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-900/5 text-navy-800 text-[11px] font-bold font-mono uppercase tracking-wider mb-2">
              <MessageSquare className="size-3 text-navy-600" /> Comunidade Acadêmica
            </div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-navy-900">
              Fórum de Dúvidas & Troca de Saberes
            </h1>
            <p className="text-xs text-navy-800/60 mt-1 max-w-lg">
              Tire dúvidas com colegas e professores. Ajude a resolver perguntas e ganhe créditos de
              contribuição por melhores respostas.
            </p>
          </div>

          <div className="pt-4 flex gap-2">
            <button
              onClick={() => setNewQuestionOpen(true)}
              className="px-4 h-10 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800 inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="size-4" /> Fazer Pergunta (+Recompensa)
            </button>
          </div>
        </div>

        {/* Card de Gamificação: Streak de Estudos */}
        <div className="lg:col-span-4 bg-gradient-to-br from-navy-900 to-navy-800 text-paper rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-paper/60">
                Gamificação · Ritmo Diário
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                <Flame className="size-4 fill-amber-400 text-amber-400" /> {streak.currentDays} dias
                seguidos
              </div>
            </div>

            <div className="text-2xl font-display font-extrabold flex items-center gap-2">
              🔥 Sequência Ativa!
            </div>
            <p className="text-xs text-paper/60 mt-1">
              Seu recorde pessoal: <strong>{streak.longestDays} dias</strong>. Próxima meta em 7
              dias (+20 créditos bônus).
            </p>
          </div>

          {/* Mini Calendário Semanal */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center gap-1">
              {daysOfWeek.map((day, idx) => {
                const isActive = idx < streak.currentDays % 7 || idx === 0 || idx === 1;
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono text-paper/40">{day}</span>
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? "bg-amber-400 text-navy-950 shadow-xs"
                          : "bg-white/10 text-paper/40"
                      }`}
                    >
                      {isActive ? "✓" : "·"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Dúvidas */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-lg text-navy-900">Perguntas Recentes</h2>

        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-border-subtle rounded-lg p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-navy-900/5 text-navy-800">
                      {q.subject}
                    </span>
                    {q.solved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="size-3" /> Resolvida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                        <HelpCircle className="size-3" /> Em Aberto
                      </span>
                    )}
                    <span className="text-xs text-navy-800/40 font-mono">
                      Por {q.author} · {q.date}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-navy-900">{q.title}</h3>
                  <p className="text-xs text-navy-800/70 leading-relaxed">{q.content}</p>
                </div>

                <div className="shrink-0 px-2.5 py-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold font-mono flex items-center gap-1">
                  <Coins className="size-3.5 text-amber-600" /> +{q.rewardCredits}
                </div>
              </div>

              {/* Respostas da Pergunta */}
              <div className="pt-3 border-t border-border-subtle space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-navy-800/50 block">
                  Respostas ({q.replies.length}):
                </span>

                <div className="space-y-2.5">
                  {q.replies.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-md text-xs space-y-2 border ${
                        r.isBestAnswer
                          ? "bg-emerald-50/60 border-emerald-300"
                          : "bg-surface/50 border-border-subtle"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <strong className="text-navy-900">{r.author}</strong>
                          <span className="text-[10px] text-navy-800/40 font-mono">{r.date}</span>
                        </div>
                        {r.isBestAnswer ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-600 text-paper font-mono">
                            <Award className="size-3" /> Melhor Resposta
                          </span>
                        ) : !q.solved ? (
                          <button
                            type="button"
                            onClick={() => handleBestAnswer(q.id, r.id)}
                            className="px-2.5 py-1 rounded border border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 font-semibold text-[11px] inline-flex items-center gap-1"
                          >
                            <Award className="size-3" /> Marcar como Melhor (+{q.rewardCredits} pts)
                          </button>
                        ) : null}
                      </div>

                      <p className="text-navy-900 leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>

                {/* Caixa de Resposta Rápida */}
                <div className="flex gap-2 pt-1">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva uma resposta para ajudar o colega…"
                    className="flex-1 h-9 px-3 border border-border-subtle rounded text-xs outline-none focus:border-navy-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendReply(q.id)}
                    className="px-3 h-9 bg-navy-900 text-paper rounded text-xs font-bold hover:bg-navy-800 inline-flex items-center gap-1.5"
                  >
                    <Send className="size-3" /> Responder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Fazer Pergunta */}
      {newQuestionOpen && (
        <NewQuestionModal
          onClose={() => setNewQuestionOpen(false)}
          onAdded={(newQ) => {
            setQuestions([newQ, ...questions]);
            toast.success("Pergunta enviada para a comunidade!");
            setNewQuestionOpen(false);
          }}
        />
      )}
    </div>
  );
}

function NewQuestionModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (q: QuestionItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Física");
  const [content, setContent] = useState("");
  const [reward, setReward] = useState("10");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onAdded({
      id: `q-${Date.now()}`,
      author: "Você (Estudante)",
      subject,
      title,
      content,
      rewardCredits: Number(reward) || 10,
      date: "Agora mesmo",
      solved: false,
      replies: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-border-subtle p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <h2 className="font-display font-bold text-lg text-navy-900">
              Publicar Dúvida na Comunidade
            </h2>
            <p className="text-xs text-navy-800/60 mt-0.5">
              Defina sua pergunta com clareza para receber respostas rápidas
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-navy-800/40 hover:text-navy-900">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">Disciplina</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
              >
                <option value="Física">Física</option>
                <option value="Matemática">Matemática</option>
                <option value="Química">Química</option>
                <option value="Redação">Redação</option>
                <option value="História">História</option>
                <option value="Biologia">Biologia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Recompensa em Créditos
              </label>
              <select
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
              >
                <option value="5">5 créditos</option>
                <option value="10">10 créditos</option>
                <option value="15">15 créditos</option>
                <option value="20">20 créditos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Pergunta ou Título Resumido
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Como resolver a questão 4 da lista sobre calorimetria?"
              className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none focus:border-navy-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Explicação Detalhada do Bloqueio
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explique o que você já tentou e onde surgiu a dúvida…"
              className="w-full p-3 border border-border-subtle rounded text-xs outline-none focus:border-navy-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 border border-border-subtle rounded-sm text-xs font-semibold hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 h-9 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800"
            >
              Publicar Pergunta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
