import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  BookOpen,
  CalendarClock,
  GraduationCap,
  Loader2,
  ArrowUpRight,
  X,
  Award,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getMyPortalOverview, getMyAllGrades } from "../portal.functions";

export function PortalOverview() {
  const fn = useServerFn(getMyPortalOverview);
  const q = useQuery({ queryKey: ["portal", "overview"], queryFn: () => fn() });
  const [allGradesOpen, setAllGradesOpen] = useState(false);

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 text-navy-800/50 text-sm p-12">
        <Loader2 className="size-4 animate-spin" /> Carregando portal…
      </div>
    );
  }

  if (q.error) {
    return <p className="text-sm text-red-600 p-6">Não foi possível carregar seu portal.</p>;
  }

  const data = q.data!;

  if (!data.student) {
    return (
      <div className="rounded-lg border border-border-subtle bg-white p-6">
        <h2 className="font-display font-bold text-lg">Portal do Aluno</h2>
        <p className="text-sm text-navy-800/60 mt-2">
          Sua conta ainda não está vinculada a um cadastro de aluno. Peça ao administrador ou
          professor para vincular seu perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">
          Olá, {data.student.full_name.split(" ")[0]}
        </h1>
        <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">
          Portal do Aluno · SwaliClass
        </p>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <Section
          title="Minhas turmas"
          icon={<BookOpen className="size-4" />}
          className="col-span-12 lg:col-span-4"
          empty={data.classes.length === 0 ? "Nenhuma turma ativa." : null}
        >
          <ul className="space-y-2">
            {data.classes.map((c) => (
              <li key={c.id} className="text-sm p-3 bg-navy-900/5 rounded-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{c.name}</span>
                  <span className="text-xs font-mono text-navy-800/60 shrink-0">
                    {c.attendance.rate === null ? "sem chamada" : `${c.attendance.rate}% presença`}
                  </span>
                </div>
                {c.attendance.rate !== null && (
                  <>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-navy-900/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.attendance.rate >= 75
                            ? "bg-emerald-500"
                            : c.attendance.rate >= 50
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{ width: `${c.attendance.rate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-navy-800/40 mt-1 font-mono">
                      {c.attendance.present} de {c.attendance.total} aulas
                    </p>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Próximas atividades"
          icon={<CalendarClock className="size-4" />}
          className="col-span-12 lg:col-span-4"
          empty={data.upcoming.length === 0 ? "Nada por vir. 🎉" : null}
        >
          <ul className="space-y-2">
            {data.upcoming.map((a) => (
              <li
                key={a.id}
                className="text-sm p-3 bg-white border border-border-subtle rounded-sm"
              >
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-navy-800/50 mt-0.5">
                  {new Date(a.due_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Notas recentes"
          icon={<GraduationCap className="size-4" />}
          className="col-span-12 lg:col-span-4"
          empty={data.recentGrades.length === 0 ? "Sem notas ainda." : null}
        >
          <div className="space-y-3">
            <ul className="space-y-2">
              {data.recentGrades.map((g) => (
                <li
                  key={g.id}
                  className="text-sm p-3 bg-white border border-border-subtle rounded-sm flex justify-between items-center"
                >
                  <span className="font-medium truncate">{g.title}</span>
                  <span className="font-display font-bold text-lg text-navy-900">{g.grade}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setAllGradesOpen(true)}
              className="w-full py-2 px-3 text-xs font-bold border border-border-subtle rounded-sm text-navy-900 hover:bg-surface transition-colors flex items-center justify-center gap-1.5"
            >
              Ver todas as notas <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </Section>
      </div>

      {allGradesOpen && <AllGradesModal onClose={() => setAllGradesOpen(false)} />}
    </div>
  );
}

function AllGradesModal({ onClose }: { onClose: () => void }) {
  const fetchAllGrades = useServerFn(getMyAllGrades);
  const q = useQuery({ queryKey: ["portal", "all-grades"], queryFn: () => fetchAllGrades() });
  const grades = q.data ?? [];

  const gradedOnly = grades.filter((g: any) => g.grade !== null && g.grade !== undefined);
  const averageGrade = useMemo(() => {
    if (!gradedOnly.length) return null;
    const total = gradedOnly.reduce((acc: number, g: any) => acc + Number(g.grade), 0);
    return (total / gradedOnly.length).toFixed(1);
  }, [gradedOnly]);

  return (
    <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-border-subtle flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div>
            <h2 className="font-display font-bold text-lg text-navy-900 flex items-center gap-2">
              <Award className="size-5 text-navy-700" /> Boletim Completo de Notas
            </h2>
            <p className="text-xs text-navy-800/60 mt-0.5">
              Histórico consolidado de todas as avaliações e entregas
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-navy-800/40 hover:text-navy-900 rounded-sm">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Card de Desempenho Geral */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-surface border border-border-subtle rounded-md text-xs">
            <div>
              <span className="text-navy-800/50 block font-mono">Avaliações Feitas</span>
              <strong className="text-base font-bold text-navy-900">{grades.length}</strong>
            </div>
            <div>
              <span className="text-navy-800/50 block font-mono">Corrigidas</span>
              <strong className="text-base font-bold text-emerald-600">{gradedOnly.length}</strong>
            </div>
            <div>
              <span className="text-navy-800/50 block font-mono">Média Geral</span>
              <strong className="text-base font-bold text-navy-900">
                {averageGrade ? `${averageGrade} / 10.0` : "—"}
              </strong>
            </div>
          </div>

          {q.isLoading ? (
            <p className="text-xs text-navy-800/40 p-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Carregando histórico completo…
            </p>
          ) : grades.length === 0 ? (
            <p className="text-xs text-navy-800/50 p-8 text-center border border-dashed rounded-md">
              Nenhuma avaliação registrada ainda.
            </p>
          ) : (
            <div className="border border-border-subtle rounded-md overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface border-b border-border-subtle font-mono text-[10px] uppercase text-navy-800/50">
                  <tr>
                    <th className="px-3 py-2.5">Atividade</th>
                    <th className="px-3 py-2.5">Turma</th>
                    <th className="px-3 py-2.5">Situação</th>
                    <th className="px-3 py-2.5 text-right">Nota Obtida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {grades.map((item: any) => {
                    const hasGrade = item.grade !== null && item.grade !== undefined;
                    return (
                      <tr key={item.id} className="hover:bg-surface/50">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-navy-900">{item.activity_title}</p>
                          {item.feedback && (
                            <p className="text-[11px] text-navy-800/60 mt-0.5 italic">
                              "{item.feedback}"
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-navy-800/70">{item.class_name}</td>
                        <td className="px-3 py-3">
                          {hasGrade ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="size-3" /> Corrigida
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              <Clock className="size-3" /> Aguardando
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {hasGrade ? (
                            <span className="font-display font-extrabold text-sm text-navy-900">
                              {Number(item.grade).toFixed(1)}{" "}
                              <span className="text-[10px] font-mono font-normal text-navy-800/50">
                                / {item.max_score}
                              </span>
                            </span>
                          ) : (
                            <span className="font-mono text-navy-800/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

function Section({
  title,
  icon,
  className,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  className?: string;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white border border-border-subtle rounded-lg p-5 ${className ?? ""}`}>
      <h3 className="font-display font-bold text-base flex items-center gap-2 mb-4">
        {icon} {title}
      </h3>
      {empty ? <p className="text-xs text-navy-800/40">{empty}</p> : children}
    </div>
  );
}
