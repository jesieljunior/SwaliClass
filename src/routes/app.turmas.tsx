import { createFileRoute, Link } from "@tanstack/react-router";
import { classes } from "@/lib/mock-data";
import { Plus, Users, Clock, Calendar } from "lucide-react";

export const Route = createFileRoute("/app/turmas")({
  component: TurmasPage,
});

function TurmasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Turmas</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">{classes.length} turmas ativas</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800">
          <Plus className="size-4" /> Nova turma
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.map((c) => {
          const pct = Math.round((c.enrolled / c.capacity) * 100);
          return (
            <div key={c.id} className="bg-white border border-border-subtle rounded-lg p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg truncate">{c.name}</h3>
                  <p className="text-xs text-navy-800/50 truncate">{c.course}</p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-navy-600 shrink-0 bg-navy-600/10 px-2 py-1 rounded-sm">
                  {pct}% lotação
                </span>
              </div>
              <div className="space-y-2 text-xs text-navy-800/70">
                <p className="flex items-center gap-2"><Users className="size-3.5" /> {c.teacher}</p>
                <p className="flex items-center gap-2"><Clock className="size-3.5" /> {c.schedule}</p>
                <p className="flex items-center gap-2"><Calendar className="size-3.5" /> {c.days}</p>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono uppercase text-navy-800/50 mb-1.5">
                  <span>{c.enrolled} alunos</span>
                  <span>{c.capacity} vagas</span>
                </div>
                <div className="h-1.5 bg-navy-900/10 rounded-full overflow-hidden">
                  <div className="h-full bg-navy-900" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <Link to="/app/chamada" className="mt-2 w-full inline-flex items-center justify-center px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800">
                Abrir chamada
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}