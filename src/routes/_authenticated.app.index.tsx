import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GraduationCap,
  Users,
  UserPlus,
} from "lucide-react";
import { getDashboardStats, getTeacherDashboard } from "@/lib/tenant.functions";
import { useSession } from "@/hooks/use-session";
import { useViewMode } from "@/lib/view-mode";
import { creditsStore, type CreditBalances, type StudyStreak } from "@/lib/credits-store";
import { Flame, Coins, Brain, Target, MessageSquare, Check, RotateCw, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const session = useSession().data;
  const { isStudent } = useViewMode();
  const showStudentSolo = isStudent || (session?.isAluno && !session?.isStaff);
  const isTeacherOnly = !!session?.isProfessor && !session?.isAdmin;

  if (showStudentSolo) {
    return <StudentSoloDashboard />;
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">
          {isTeacherOnly ? "Painel do Professor" : "Visão geral"}
        </h1>
        <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">{today}</p>
      </div>

      {isTeacherOnly ? <TeacherExclusiveDashboard /> : <AdminInstitutionDashboard />}
    </div>
  );
}

function StudentSoloDashboard() {
  const [balances, setBalances] = useState<CreditBalances>(creditsStore.getBalances());
  const [streak, setStreak] = useState<StudyStreak>(creditsStore.getStreak());
  const [markedToday, setMarkedToday] = useState(streak.activeToday);
  const [goals, setGoals] = useState([
    { id: 1, text: "Revisar 10 flashcards conceituais na Swali AI", done: true },
    { id: 2, text: "Fazer 1 quiz diagnóstico de Biologia/Química", done: false },
    { id: 3, text: "Baixar ou ler 1 resumo na Biblioteca Comunitária", done: false },
    { id: 4, text: "Tirar ou responder 1 dúvida no Fórum (+10 créditos)", done: false },
  ]);

  const [weakPoints] = useState([
    {
      topic: "Equilíbrio Químico e Princípio de Le Chatelier",
      subject: "Química / ENEM",
      errorRate: "65% de dúvida",
    },
    {
      topic: "Função Quadrática: Cálculo de Vértice, Máximos e Mínimos",
      subject: "Matemática",
      errorRate: "50% de dúvida",
    },
    {
      topic: "Crase e Regência com Pronomes Relativos",
      subject: "Língua Portuguesa / Concursos",
      errorRate: "42% de dúvida",
    },
  ]);

  useEffect(() => {
    setBalances(creditsStore.getBalances());
    const currentStreak = creditsStore.getStreak();
    setStreak(currentStreak);
    setMarkedToday(currentStreak.activeToday);

    const onUpdate = () => {
      setBalances(creditsStore.getBalances());
      const s = creditsStore.getStreak();
      setStreak(s);
      setMarkedToday(s.activeToday);
    };
    window.addEventListener("swali_credits_updated", onUpdate);
    return () => window.removeEventListener("swali_credits_updated", onUpdate);
  }, []);

  const handleRecordStudy = () => {
    const updated = creditsStore.recordStudyToday();
    setStreak(updated);
    setMarkedToday(true);
  };

  const toggleGoal = (id: number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
  };

  const completedGoals = goals.filter((g) => g.done).length;

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-navy-900 to-navy-800 text-paper rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400 text-navy-950">
              Estudo Independente
            </span>
            <span className="text-xs text-paper/60">ENEM · Concursos · Autodidata</span>
          </div>
          <h2 className="text-2xl font-display font-bold">
            Você estuda no seu próprio ritmo, sem professor.
          </h2>
          <p className="text-xs text-paper/70 leading-relaxed">
            Use seus próprios PDFs e anotações. A <strong>Swali AI</strong> lembra das suas dúvidas,
            mapeia seus pontos fracos e organiza sua rotina de estudos automaticamente.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link
            to="/app/ia"
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-navy-950 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Sparkles className="size-4" /> Estudo Dirigido com IA
          </Link>
          <Link
            to="/app/cobranca"
            className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-navy-950 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Zap className="size-4" /> Planos & Recarga
          </Link>
          <Link
            to="/app/biblioteca"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-paper rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-white/10"
          >
            <BookOpen className="size-4" /> Biblioteca
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-border-subtle rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-navy-800/60 uppercase tracking-wider">
            <span>Sequência de Estudos</span>
            <Flame
              className={`size-4 ${streak.currentDays > 0 ? "text-amber-500" : "text-zinc-400"}`}
            />
          </div>
          <div className="my-3">
            <p className="text-3xl font-display font-extrabold text-navy-900">
              {streak.currentDays} {streak.currentDays === 1 ? "dia" : "dias"}
            </p>
            <p className="text-[11px] text-navy-800/50 mt-0.5">
              Recorde: {streak.longestDays} dias seguidos
            </p>
          </div>
          <button
            onClick={handleRecordStudy}
            disabled={markedToday}
            className={`w-full py-1.5 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              markedToday
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                : "bg-navy-900 hover:bg-navy-800 text-paper"
            }`}
          >
            {markedToday ? (
              <>
                <Check className="size-3.5" /> Estudo de hoje salvo
              </>
            ) : (
              <>
                <Flame className="size-3.5 text-amber-400" /> Marcar estudo de hoje
              </>
            )}
          </button>
        </div>

        <div className="p-5 bg-white border border-border-subtle rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-navy-800/60 uppercase tracking-wider">
            <span>Créditos Educacionais</span>
            <Coins className="size-4 text-amber-500" />
          </div>
          <div className="my-3">
            <p className="text-3xl font-display font-extrabold text-navy-900">
              {balances.total} <span className="text-sm font-normal text-navy-800/50">créd.</span>
            </p>
            <div className="flex gap-2 mt-1 text-[10px] font-mono">
              <span className="text-navy-800/60">
                Plano: <strong>{balances.planCredits}</strong>
              </span>
              <span className="text-emerald-700">
                Contribuição: <strong>{balances.contributionCredits}</strong>
              </span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Link
              to="/app/cobranca"
              className="flex-1 py-1.5 px-2 rounded text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-navy-950 flex items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <Zap className="size-3" /> Recarregar
            </Link>
            <Link
              to="/app/biblioteca"
              className="py-1.5 px-2 rounded text-xs font-semibold bg-surface border border-border-subtle hover:bg-surface-hover text-navy-900 flex items-center justify-center gap-1 transition-colors"
              title="Ganhe +15 créditos ao enviar resumos"
            >
              +15 Grátis
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white border border-border-subtle rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-navy-800/60 uppercase tracking-wider">
            <span>Pontos Fracos na IA</span>
            <Brain className="size-4 text-indigo-500" />
          </div>
          <div className="my-3">
            <p className="text-3xl font-display font-extrabold text-navy-900">
              {weakPoints.length}{" "}
              <span className="text-sm font-normal text-navy-800/50">conceitos</span>
            </p>
            <p className="text-[11px] text-navy-800/50 mt-0.5">
              A IA reforçará esses temas no próximo quiz
            </p>
          </div>
          <Link
            to="/app/ia"
            className="w-full py-1.5 px-3 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCw className="size-3" /> Revisar pontos fracos
          </Link>
        </div>

        <div className="p-5 bg-white border border-border-subtle rounded-xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-navy-800/60 uppercase tracking-wider">
            <span>Metas de Hoje</span>
            <Target className="size-4 text-emerald-600" />
          </div>
          <div className="my-3">
            <p className="text-3xl font-display font-extrabold text-navy-900">
              {completedGoals} / {goals.length}
            </p>
            <div className="w-full bg-surface h-1.5 rounded-full mt-2 overflow-hidden border border-border-subtle">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedGoals / goals.length) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-bold">
            {completedGoals === goals.length
              ? "✓ Metas diárias cumpridas!"
              : "Mantenha a constância"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white border border-border-subtle rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="size-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-display font-bold text-navy-900">
                  Memória de Pontos Fracos (Swali AI)
                </h3>
                <p className="text-xs text-navy-800/60">
                  Sem professor, a IA assume o papel de identificar e reforçar exatamente onde você
                  mais erra.
                </p>
              </div>
            </div>
            <Link
              to="/app/ia"
              className="text-xs font-bold text-navy-900 hover:underline flex items-center gap-1"
            >
              Abrir IA <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 pt-2">
            {weakPoints.map((wp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-border-subtle bg-surface/50 hover:bg-surface transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 text-navy-900">
                      {wp.subject}
                    </span>
                    <span className="text-[10px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-semibold">
                      {wp.errorRate}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-navy-900 truncate">{wp.topic}</p>
                </div>
                <Link
                  to="/app/ia"
                  className="shrink-0 px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-paper text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="size-3 text-amber-300" /> Praticar
                </Link>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
            <Sparkles className="size-4 shrink-0 mt-0.5 text-indigo-600" />
            <p>
              <strong>Diferencial da Swali AI:</strong> Lembra do seu histórico de estudo, não
              esquece o que você já domina e prioriza suas maiores fraquezas nos quizzes diários.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white border border-border-subtle rounded-xl space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-navy-900">
                Plano de Estudos de Hoje
              </h3>
              <span className="text-xs font-mono font-bold text-navy-800/50">
                {completedGoals}/{goals.length}
              </span>
            </div>
            <p className="text-xs text-navy-800/60">
              Complete as tarefas diárias para manter o ritmo.
            </p>
          </div>

          <div className="space-y-2 py-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center gap-2.5 cursor-pointer ${
                  goal.done
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through opacity-85"
                    : "bg-surface border-border-subtle text-navy-900 hover:border-navy-400"
                }`}
              >
                <div
                  className={`size-4 rounded flex items-center justify-center shrink-0 border ${
                    goal.done
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-navy-400 bg-white"
                  }`}
                >
                  {goal.done && <Check className="size-3" />}
                </div>
                <span className="leading-tight">{goal.text}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between text-xs">
              <span className="text-navy-800/60">Comunidade de Estudos:</span>
              <Link to="/app/comunidade" className="font-bold text-navy-900 hover:underline">
                Acessar Fórum →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/app/ia"
          className="p-5 bg-white border border-border-subtle rounded-xl hover:border-navy-400 transition-all hover:shadow-xs group space-y-2"
        >
          <div className="size-9 rounded-lg bg-navy-900 text-paper flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="size-5 text-amber-300" />
          </div>
          <h4 className="text-sm font-bold text-navy-900 flex items-center justify-between">
            Transformar PDF em Estudo
            <ArrowUpRight className="size-4 text-navy-800/40 group-hover:text-navy-900" />
          </h4>
          <p className="text-xs text-navy-800/60">
            Cole notas de aula ou textos para receber resumos, flashcards e quiz instantâneos.
          </p>
        </Link>

        <Link
          to="/app/biblioteca"
          className="p-5 bg-white border border-border-subtle rounded-xl hover:border-navy-400 transition-all hover:shadow-xs group space-y-2"
        >
          <div className="size-9 rounded-lg bg-navy-900 text-paper flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen className="size-5 text-paper" />
          </div>
          <h4 className="text-sm font-bold text-navy-900 flex items-center justify-between">
            Biblioteca Colaborativa
            <ArrowUpRight className="size-4 text-navy-800/40 group-hover:text-navy-900" />
          </h4>
          <p className="text-xs text-navy-800/60">
            Baixe resumos de outros alunos e envie seus resumos para ganhar +15 créditos.
          </p>
        </Link>

        <Link
          to="/app/comunidade"
          className="p-5 bg-white border border-border-subtle rounded-xl hover:border-navy-400 transition-all hover:shadow-xs group space-y-2"
        >
          <div className="size-9 rounded-lg bg-navy-900 text-paper flex items-center justify-center group-hover:scale-105 transition-transform">
            <MessageSquare className="size-5 text-paper" />
          </div>
          <h4 className="text-sm font-bold text-navy-900 flex items-center justify-between">
            Fórum & Recompensas
            <ArrowUpRight className="size-4 text-navy-800/40 group-hover:text-navy-900" />
          </h4>
          <p className="text-xs text-navy-800/60">
            Tire dúvidas de matérias difíceis e ganhe +10 créditos ao ter a melhor resposta.
          </p>
        </Link>
      </div>
    </div>
  );
}

function AdminOnboardingChecklist({ stats }: { stats: any }) {
  const [collapsed, setCollapsed] = useState(false);
  const coursesDone = (stats?.totalCourses ?? 0) > 0;
  const classesDone = (stats?.totalClasses ?? 0) > 0;
  const studentsDone = (stats?.totalStudents ?? 0) > 0;
  const attendanceDone = (stats?.sessionsThisWeek ?? 0) > 0;

  const steps = [
    {
      label: "Cadastrar primeiro curso",
      desc: "Defina o catálogo de formação da instituição",
      to: "/app/cursos",
      icon: BookOpen,
      done: coursesDone,
    },
    {
      label: "Criar primeira turma",
      desc: "Associe o curso, horário e sala de aula",
      to: "/app/turmas",
      icon: GraduationCap,
      done: classesDone,
    },
    {
      label: "Cadastrar ou importar alunos",
      desc: "Adicione manualmente ou importe via planilha CSV",
      to: "/app/alunos",
      icon: Users,
      done: studentsDone,
    },
    {
      label: "Convidar professores",
      desc: "Dê acesso aos docentes para registro de chamadas e notas",
      to: "/app/turmas",
      icon: UserPlus,
      done: coursesDone && classesDone,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Se tudo foi concluído e usuário minimizou, manter compacto
  if (completedCount === steps.length && collapsed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="size-4 text-emerald-600" />
          Configuração inicial da instituição concluída com sucesso!
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1"
        >
          Ver passos <ChevronDown className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-900/5 text-navy-800 text-[11px] font-bold font-mono uppercase tracking-wider mb-1">
            <Sparkles className="size-3 text-navy-600" /> Primeiros passos
          </div>
          <h2 className="font-display font-bold text-lg text-navy-900">
            Configure sua instituição no SwaliClass
          </h2>
          <p className="text-xs text-navy-800/60 mt-0.5">
            Siga este checklist rápido para preparar seu ambiente acadêmico.
          </p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-navy-800/40 hover:text-navy-800 p-1"
          title={collapsed ? "Expandir checklist" : "Recolher"}
        >
          {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs font-mono mb-1.5 text-navy-800/70">
          <span>
            {completedCount} de {steps.length} concluídos
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-navy-900/10 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border-subtle">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <Link
                key={idx}
                to={st.to as any}
                className={`p-3.5 rounded-md border text-left transition-all flex flex-col justify-between ${
                  st.done
                    ? "bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50"
                    : "bg-surface/50 border-border-subtle hover:bg-surface hover:border-navy-900/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`size-7 rounded-sm flex items-center justify-center ${
                        st.done ? "bg-emerald-100 text-emerald-700" : "bg-white text-navy-800/60"
                      }`}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    {st.done ? (
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-navy-800/30 shrink-0" />
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-navy-900">{st.label}</h4>
                  <p className="text-[11px] text-navy-800/50 mt-1 line-clamp-2">{st.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-navy-900/5 text-[10px] font-bold text-navy-800/70 uppercase tracking-wider flex items-center justify-between">
                  <span>{st.done ? "Concluído" : "Configurar"}</span>
                  <ArrowUpRight className="size-3" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminInstitutionDashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchStats() });
  const stats = q.data;

  return (
    <div className="space-y-6">
      {q.isLoading && (
        <p className="text-navy-800/40 flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" /> Carregando estatísticas…
        </p>
      )}

      {stats && <AdminOnboardingChecklist stats={stats} />}

      {stats && (
        <div className="grid grid-cols-12 gap-4">
          <KpiCard label="Total alunos" value={stats.totalStudents.toString()} />
          <KpiCard label="Turmas" value={stats.totalClasses.toString()} />
          <KpiCard label="Cursos" value={stats.totalCourses.toString()} />
          <KpiCard label="Freq. média (30d)" value={`${stats.avgAttendance}%`} accent="emerald" />
          <KpiCard label="Chamadas (7d)" value={stats.sessionsThisWeek.toString()} />
          <KpiCard label="Baixa frequência" value={stats.lowFreq.length.toString()} dark />

          <div className="col-span-12 lg:col-span-8 bg-white border border-border-subtle rounded-lg p-6">
            <div className="flex justify-between items-end mb-6 gap-3 flex-wrap">
              <div>
                <h3 className="font-display font-bold text-lg">Frequência semanal</h3>
                <p className="text-xs text-navy-800/50">Últimos 7 dias · % de presença</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <ArrowUpRight className="size-3.5" /> {stats.avgAttendance}%
              </span>
            </div>
            <WeeklyChart data={stats.weekly} />
          </div>

          <div className="col-span-12 lg:col-span-4 bg-navy-900 text-paper rounded-lg p-6 flex flex-col">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="size-4" /> Alunos em alerta
            </h3>
            <p className="text-xs text-paper/50 mb-4">Frequência abaixo de 75%</p>
            <div className="space-y-2 flex-1">
              {stats.lowFreq.length === 0 && (
                <p className="text-xs text-paper/40">Sem alertas. 👍</p>
              )}
              {stats.lowFreq.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.full_name}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0">{s.attendance}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherExclusiveDashboard() {
  const fetchTeacher = useServerFn(getTeacherDashboard);
  const q = useQuery({
    queryKey: ["dashboard", "teacher-exclusive"],
    queryFn: () => fetchTeacher(),
  });

  if (q.isLoading) {
    return (
      <p className="text-navy-800/40 flex items-center gap-2">
        <Loader2 className="size-5 animate-spin" /> Carregando suas turmas…
      </p>
    );
  }

  const data = q.data;
  const classes = data?.classes ?? [];
  const pendingTotal = data?.pendingTotal ?? 0;
  const avgAttendance =
    classes.length > 0
      ? Math.round(
          classes.reduce((acc, c) => acc + (c.avg ?? 0), 0) /
            Math.max(1, classes.filter((c) => c.avg !== null).length || 1),
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Teacher-only Isolated KPIs */}
      <div className="grid grid-cols-12 gap-4">
        <KpiCard label="Minhas Turmas" value={classes.length.toString()} />
        <KpiCard
          label="Correções Pendentes"
          value={pendingTotal.toString()}
          accent={pendingTotal > 0 ? undefined : "emerald"}
          dark={pendingTotal > 0}
        />
        <KpiCard label="Média Frequência" value={`${avgAttendance}%`} accent="emerald" />
        <KpiCard label="Ações Rápidas" value="Chamada" accent="emerald" />
      </div>

      <div className="bg-white border border-border-subtle rounded-lg p-6">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <ClipboardCheck className="size-4" /> Minhas turmas atribuídas
            </h3>
            <p className="text-xs text-navy-800/50">
              {pendingTotal === 0
                ? "Nenhuma entrega aguardando correção."
                : `${pendingTotal} entrega${pendingTotal > 1 ? "s" : ""} aguardando correção`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/app/chamada"
              className="px-3 h-8 text-xs font-bold bg-navy-900 text-paper rounded-sm inline-flex items-center gap-1 hover:bg-navy-800"
            >
              Fazer chamada
            </Link>
            <Link
              to="/app/atividades"
              className="px-3 h-8 text-xs font-semibold border border-border-subtle text-navy-900 rounded-sm inline-flex items-center gap-1 hover:bg-surface"
            >
              Ver atividades <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {classes.length === 0 ? (
          <p className="text-xs text-navy-800/40 p-6 text-center border border-dashed rounded-md">
            Você ainda não foi vinculado a nenhuma turma. Peça ao administrador da instituição para
            atribuir suas turmas.
          </p>
        ) : (
          <div className="grid grid-cols-12 gap-3">
            {classes.map((c) => (
              <div
                key={c.id}
                className="col-span-12 md:col-span-6 lg:col-span-4 p-4 rounded-md border border-border-subtle bg-surface/40 flex flex-col justify-between gap-3 hover:border-navy-900/30 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-navy-900 truncate">{c.name}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        c.pending > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {c.pending > 0 ? `${c.pending} pendentes` : "Em dia"}
                    </span>
                  </div>
                  {c.course && (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-navy-800/40 mt-1 truncate">
                      {c.course}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-border-subtle">
                  <span className="font-mono text-navy-800/60">
                    Freq. {c.avg === null ? "—" : `${c.avg}%`}
                  </span>
                  <Link
                    to="/app/chamada"
                    search={{ class_id: c.id }}
                    className="text-xs font-bold text-navy-900 hover:underline inline-flex items-center gap-0.5"
                  >
                    Chamada <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  dark,
  accent,
}: {
  label: string;
  value: string;
  dark?: boolean;
  accent?: "emerald";
}) {
  const base = dark ? "bg-navy-900 border-navy-800 text-paper" : "bg-white border-border-subtle";
  const valueClass = accent === "emerald" ? "text-emerald-600" : "";
  return (
    <div
      className={`col-span-6 md:col-span-4 lg:col-span-2 p-5 border rounded-lg flex flex-col justify-between gap-3 ${base}`}
    >
      <span
        className={`text-[10px] font-mono font-bold uppercase tracking-widest ${dark ? "text-white/40" : "text-navy-600"}`}
      >
        {label}
      </span>
      <span className={`text-3xl font-display font-extrabold ${valueClass}`}>{value}</span>
    </div>
  );
}

function WeeklyChart({ data }: { data: { day: string; value: number }[] }) {
  const max = 100;
  const w = 600;
  const h = 200;
  const points = data.map((d, i) => ({
    x: (i / Math.max(1, data.length - 1)) * w,
    y: h - (d.value / max) * h,
    ...d,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b6fa0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b6fa0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad)" />
      <path d={path} fill="none" stroke="#0f1b3d" strokeWidth="2.5" />
      {points.map((p) => (
        <g key={p.day}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0f1b3d" />
          <text
            x={p.x}
            y={h + 20}
            textAnchor="middle"
            fill="#1e3a5f"
            opacity="0.5"
            fontSize="11"
            fontFamily="JetBrains Mono"
          >
            {p.day}
          </text>
        </g>
      ))}
    </svg>
  );
}
