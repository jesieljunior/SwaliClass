import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { students, classes } from "@/lib/mock-data";
import type { AttendanceStatus } from "@/lib/mock-data";
import { Check, X, Clock3, FileText } from "lucide-react";

export const Route = createFileRoute("/app/chamada")({
  component: ChamadaPage,
});

const STATUS_OPTS: { v: AttendanceStatus; label: string; icon: typeof Check; cls: string }[] = [
  { v: "presente", label: "Presente", icon: Check, cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { v: "ausente", label: "Ausente", icon: X, cls: "bg-rose-100 text-rose-700 border-rose-300" },
  { v: "atrasado", label: "Atrasado", icon: Clock3, cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { v: "justificado", label: "Justif.", icon: FileText, cls: "bg-navy-600/15 text-navy-600 border-navy-600/30" },
];

function ChamadaPage() {
  const [classId, setClassId] = useState(classes[0].id);
  const turma = classes.find((c) => c.id === classId)!;
  const list = useMemo(() => students.filter((s) => s.className === turma.name), [turma]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});

  const setAll = (v: AttendanceStatus) => setMarks(Object.fromEntries(list.map((s) => [s.id, v])));
  const present = list.filter((s) => marks[s.id] === "presente").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Chamada</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest truncate">
            {turma.name} • {turma.teacher} • {turma.schedule}
          </p>
        </div>
        <select
          value={classId}
          onChange={(e) => { setClassId(e.target.value); setMarks({}); }}
          className="bg-white border border-border-subtle rounded-md px-3 h-10 text-sm font-medium"
        >
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.course}</option>)}
        </select>
      </div>

      <div className="bg-white border border-border-subtle rounded-lg p-5 flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50">Marcar todos como:</span>
        {STATUS_OPTS.map((o) => (
          <button
            key={o.v}
            onClick={() => setAll(o.v)}
            className={`px-3 h-8 rounded-sm border text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${o.cls}`}
          >
            <o.icon className="size-3.5" /> {o.label}
          </button>
        ))}
        <span className="ml-auto text-sm font-mono text-navy-800/60">{present} / {list.length} presentes</span>
      </div>

      <div className="bg-white border border-border-subtle rounded-lg divide-y divide-border-subtle">
        {list.map((s) => {
          const cur = marks[s.id];
          return (
            <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-full bg-navy-900/10 grid place-items-center text-xs font-bold shrink-0">
                  {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{s.name}</p>
                  <p className="text-[11px] text-navy-800/50 truncate">{s.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTS.map((o) => {
                  const active = cur === o.v;
                  return (
                    <button
                      key={o.v}
                      onClick={() => setMarks((m) => ({ ...m, [s.id]: o.v }))}
                      className={`px-3 h-8 rounded-sm border text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors ${
                        active ? o.cls : "bg-white border-border-subtle text-navy-800/40 hover:text-navy-900"
                      }`}
                    >
                      <o.icon className="size-3.5" /> {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-5 h-11 rounded-sm border border-border-subtle font-semibold bg-white hover:bg-surface">Cancelar</button>
        <button className="px-5 h-11 rounded-sm bg-navy-900 text-paper font-bold hover:bg-navy-800">Salvar chamada</button>
      </div>
    </div>
  );
}