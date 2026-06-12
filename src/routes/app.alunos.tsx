import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { students } from "@/lib/mock-data";
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/app/alunos")({
  component: AlunosPage,
});

function AlunosPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativo" | "arquivado">("todos");
  const list = students.filter((s) =>
    (filter === "todos" || s.status === filter) &&
    (s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Alunos</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">{list.length} resultados</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800">
          <Plus className="size-4" /> Novo aluno
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 h-10 bg-white border border-border-subtle rounded-md">
          <Search className="size-4 text-navy-800/40 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou email…"
            className="bg-transparent flex-1 min-w-0 text-sm outline-none"
          />
        </div>
        <div className="flex bg-white border border-border-subtle rounded-md p-1">
          {(["todos", "ativo", "arquivado"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 h-8 text-xs font-semibold uppercase tracking-wider rounded-sm capitalize ${
                filter === f ? "bg-navy-900 text-paper" : "text-navy-800/60"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border-subtle text-[10px] font-mono uppercase tracking-widest text-navy-800/50">
            <tr>
              <th className="text-left px-5 py-3 font-bold">Aluno</th>
              <th className="text-left px-5 py-3 font-bold hidden md:table-cell">Turma</th>
              <th className="text-left px-5 py-3 font-bold hidden lg:table-cell">Contato</th>
              <th className="text-left px-5 py-3 font-bold">Frequência</th>
              <th className="text-left px-5 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {list.map((s) => (
              <tr key={s.id} className="hover:bg-surface/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-navy-900/10 grid place-items-center text-[11px] font-bold shrink-0">
                      {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p className="text-[11px] text-navy-800/50 truncate">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell text-navy-800/80">{s.className}</td>
                <td className="px-5 py-3 hidden lg:table-cell text-navy-800/80 font-mono text-xs">{s.phone}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[120px] h-1.5 bg-navy-900/10 rounded-full overflow-hidden">
                      <div className={`h-full ${s.attendance >= 85 ? "bg-emerald-500" : s.attendance >= 75 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${s.attendance}%` }} />
                    </div>
                    <span className="text-xs font-mono font-semibold tabular-nums">{s.attendance}%</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${s.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-navy-900/10 text-navy-800/60"}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}