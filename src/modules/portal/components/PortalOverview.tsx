import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarClock, GraduationCap, Loader2 } from "lucide-react";
import { getMyPortalOverview } from "../portal.functions";

export function PortalOverview() {
  const fn = useServerFn(getMyPortalOverview);
  const q = useQuery({ queryKey: ["portal", "overview"], queryFn: () => fn() });

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 text-navy-800/50 text-sm">
        <Loader2 className="size-4 animate-spin" /> Carregando portal…
      </div>
    );
  }

  if (q.error) {
    return <p className="text-sm text-red-600">Não foi possível carregar seu portal.</p>;
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
          Portal do Aluno
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
          <ul className="space-y-2">
            {data.recentGrades.map((g) => (
              <li
                key={g.id}
                className="text-sm p-3 bg-white border border-border-subtle rounded-sm flex justify-between items-center"
              >
                <span className="font-medium truncate">{g.title}</span>
                <span className="font-display font-bold text-lg">{g.grade}</span>
              </li>
            ))}
          </ul>
        </Section>
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
