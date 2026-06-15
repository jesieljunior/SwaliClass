import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Check, X, Clock3, FileText, Loader2, Save } from "lucide-react";
import { listClasses, getAttendanceRoster, saveAttendance } from "@/lib/tenant.functions";

type AttendanceStatus = "presente" | "ausente" | "atrasado" | "justificado";

const searchSchema = z.object({ class_id: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/app/chamada")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ChamadaPage,
});

const STATUS_OPTS: { v: AttendanceStatus; label: string; icon: typeof Check; cls: string }[] = [
  { v: "presente", label: "Presente", icon: Check, cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { v: "ausente", label: "Ausente", icon: X, cls: "bg-rose-100 text-rose-700 border-rose-300" },
  { v: "atrasado", label: "Atrasado", icon: Clock3, cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { v: "justificado", label: "Justif.", icon: FileText, cls: "bg-navy-600/15 text-navy-600 border-navy-600/30" },
];

function ChamadaPage() {
  const { class_id: initialClassId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchClasses = useServerFn(listClasses);
  const fetchRoster = useServerFn(getAttendanceRoster);
  const save = useServerFn(saveAttendance);
  const qc = useQueryClient();

  const classesQ = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses() });
  const classes = classesQ.data ?? [];

  const [classId, setClassId] = useState<string | undefined>(initialClassId);
  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].id);
  }, [classes, classId]);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState("");
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const rosterQ = useQuery({
    queryKey: ["roster", classId, date],
    queryFn: () => fetchRoster({ data: { class_id: classId!, session_date: date } }),
    enabled: !!classId,
  });

  useEffect(() => {
    if (rosterQ.data) {
      setMarks(rosterQ.data.marks as Record<string, AttendanceStatus>);
      setTopic(rosterQ.data.session?.topic ?? "");
    }
  }, [rosterQ.data]);

  const turma = classes.find((c: any) => c.id === classId);
  const roster = rosterQ.data?.roster ?? [];
  const present = roster.filter((s: any) => marks[s.id] === "presente" || marks[s.id] === "atrasado").length;
  const setAll = (v: AttendanceStatus) => setMarks(Object.fromEntries(roster.map((s: any) => [s.id, v])));

  const saveM = useMutation({
    mutationFn: () => save({ data: {
      class_id: classId!, session_date: date, topic: topic || null, notes: null,
      marks: roster.map((s: any) => ({ student_id: s.id, status: marks[s.id] ?? "ausente" as AttendanceStatus })),
    }}),
    onSuccess: () => { setSavedAt(new Date().toLocaleTimeString("pt-BR")); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Chamada</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest truncate">
            {turma ? `${turma.name} • ${turma.course_name}` : "Selecione uma turma"}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={classId ?? ""}
            onChange={(e) => { setClassId(e.target.value); navigate({ search: { class_id: e.target.value } }); }}
            className="bg-white border border-border-subtle rounded-md px-3 h-10 text-sm font-medium"
          >
            <option value="" disabled>Turma…</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.course_name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white border border-border-subtle rounded-md px-3 h-10 text-sm font-medium" />
        </div>
      </div>

      {!classId && <p className="text-sm text-navy-800/50">Cadastre uma turma com alunos matriculados para iniciar a chamada.</p>}

      {classId && (
        <>
          <div className="bg-white border border-border-subtle rounded-lg p-5 flex flex-wrap items-center gap-3">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Conteúdo da aula (opcional)" className="flex-1 min-w-[200px] h-9 px-3 border border-border-subtle rounded-sm text-sm bg-surface" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50">Marcar todos:</span>
            {STATUS_OPTS.map((o) => (
              <button key={o.v} onClick={() => setAll(o.v)} className={`px-3 h-8 rounded-sm border text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${o.cls}`}>
                <o.icon className="size-3.5" /> {o.label}
              </button>
            ))}
            <span className="ml-auto text-sm font-mono text-navy-800/60">{present} / {roster.length} presentes</span>
          </div>

          <div className="bg-white border border-border-subtle rounded-lg divide-y divide-border-subtle">
            {rosterQ.isLoading && <div className="p-8 text-center text-navy-800/40"><Loader2 className="inline size-5 animate-spin" /></div>}
            {!rosterQ.isLoading && roster.length === 0 && <div className="p-8 text-center text-navy-800/50 text-sm">Nenhum aluno matriculado nesta turma.</div>}
            {roster.map((s: any) => {
              const cur = marks[s.id];
              return (
                <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-navy-900/10 grid place-items-center text-xs font-bold shrink-0">
                      {s.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{s.full_name}</p>
                      {s.email && <p className="text-[11px] text-navy-800/50 truncate">{s.email}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTS.map((o) => {
                      const active = cur === o.v;
                      return (
                        <button key={o.v} onClick={() => setMarks((m) => ({ ...m, [s.id]: o.v }))} className={`px-3 h-8 rounded-sm border text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors ${active ? o.cls : "bg-white border-border-subtle text-navy-800/40 hover:text-navy-900"}`}>
                          <o.icon className="size-3.5" /> {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end items-center gap-3">
            {savedAt && <span className="text-xs text-emerald-700 font-mono">Salvo às {savedAt}</span>}
            {saveM.error && <span className="text-xs text-rose-700">{(saveM.error as Error).message}</span>}
            <button disabled={saveM.isPending || roster.length === 0} onClick={() => saveM.mutate()} className="px-5 h-11 rounded-sm bg-navy-900 text-paper font-bold hover:bg-navy-800 inline-flex items-center gap-2 disabled:opacity-50">
              {saveM.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar chamada
            </button>
          </div>
        </>
      )}
    </div>
  );
}