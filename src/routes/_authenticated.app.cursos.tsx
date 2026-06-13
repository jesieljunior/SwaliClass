import { createFileRoute } from "@tanstack/react-router";
import { courses } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/cursos")({
  component: CursosPage,
});

function CursosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Cursos</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">{courses.length} cursos cadastrados</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800">
          <Plus className="size-4" /> Novo curso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="bg-white border border-border-subtle rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-navy-600 bg-navy-600/10 px-2 py-1 rounded-sm">
                {c.category}
              </span>
            </div>
            <h3 className="font-display font-bold text-xl">{c.name}</h3>
            <p className="text-sm text-navy-800/60 mt-2 mb-5">{c.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle text-xs gap-3 flex-wrap">
              <span className="text-navy-800/70 truncate">{c.teacher}</span>
              <div className="flex gap-4 font-mono text-navy-800/50 shrink-0">
                <span>{c.classes} turmas</span>
                <span>{c.students} alunos</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}