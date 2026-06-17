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
    <div className="space-y-5 pb-28 lg:pb-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-end sm:justify-between sm:flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">Chamada</h1>
          <p className="text-[10px] sm:text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest truncate">
            {turma ? `${turma.name} • ${turma.course_name}` : "Selecione uma turma"}
          </p>
        </div>
        <div className="col-span-2 flex gap-2 sm:col-auto">
          <select
            value={classId ?? ""}
            onChange={(e) => { setClassId(e.target.value); navigate({ search: { class_id: e.target.value } }); }}
            className="bg-white border border-border-subtle rounded-md px-3 h-11 text-sm font-medium flex-1 sm:flex-none min-w-0"
          >
            <option value="" disabled>Turma…</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.course_name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white border border-border-subtle rounded-md px-3 h-11 text-sm font-medium shrink-0" />
        </div>
      </div>

      {!classId && <p className="text-sm text-navy-800/50">Cadastre uma turma com alunos matriculados para iniciar a chamada.</p>}

      {classId && (
        <>
          <div className="bg-white border border-border-subtle rounded-lg p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Conteúdo da aula (opcional)" className="flex-1 min-w-[180px] h-10 px-3 border border-border-subtle rounded-sm text-sm bg-surface" />
              <span className="text-sm font-mono text-navy-800/60 shrink-0">{present} / {roster.length} presentes</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50 shrink-0">Marcar todos:</span>
              {STATUS_OPTS.map((o) => (
                <button key={o.v} onClick={() => setAll(o.v)} className={`px-3 h-9 rounded-sm border text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${o.cls}`}>
                  <o.icon className="size-3.5" /> {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border-subtle rounded-lg divide-y divide-border-subtle">
            {rosterQ.isLoading && <div className="p-8 text-center text-navy-800/40"><Loader2 className="inline size-5 animate-spin" /></div>}
            {!rosterQ.isLoading && roster.length === 0 && <div className="p-8 text-center text-navy-800/50 text-sm">Nenhum aluno matriculado nesta turma.</div>}
            {roster.map((s: any) => {
              const cur = marks[s.id];
              return (
                <div key={s.id} className="px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full bg-navy-900/10 grid place-items-center text-xs font-bold shrink-0">
                      {s.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{s.full_name}</p>
                      {s.email && <p className="text-[11px] text-navy-800/50 truncate">{s.email}</p>}
                    </div>
                    {cur && (
                      <span className={`ml-auto sm:hidden shrink-0 size-2.5 rounded-full ${
                        cur === "presente" ? "bg-emerald-500" :
                        cur === "ausente" ? "bg-rose-500" :
                        cur === "atrasado" ? "bg-amber-500" : "bg-navy-600"
                      }`} />
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
                    {STATUS_OPTS.map((o) => {
                      const active = cur === o.v;
                      return (
                        <button key={o.v} onClick={() => setMarks((m) => ({ ...m, [s.id]: o.v }))} className={`px-2 sm:px-3 h-10 sm:h-8 rounded-sm border text-[10px] sm:text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1 sm:gap-1.5 transition-colors ${active ? o.cls : "bg-white border-border-subtle text-navy-800/40 hover:text-navy-900"}`}>
                          <o.icon className="size-3.5" /> <span className="hidden sm:inline">{o.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky save bar — visible above bottom-nav on mobile, inline on desktop */}
          <div
            className="fixed bottom-16 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-border-subtle px-4 py-3 flex items-center gap-3 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:p-0 lg:justify-end"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex-1 min-w-0 lg:flex-none text-xs">
              {savedAt && <span className="text-emerald-700 font-mono">Salvo às {savedAt}</span>}
              {saveM.error && <span className="text-rose-700 block truncate">{(saveM.error as Error).message}</span>}
            </div>
            <button disabled={saveM.isPending || roster.length === 0} onClick={() => saveM.mutate()} className="px-5 h-11 rounded-sm bg-navy-900 text-paper font-bold hover:bg-navy-800 inline-flex items-center gap-2 disabled:opacity-50 shrink-0">
              {saveM.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar chamada
            </button>
          </div>
        </>
      )}
    </div>
  );
}