import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock, CheckCircle2, ChevronDown, Circle, FileText, Loader2, Pencil, Plus, Sparkles, Trash2, UserRound, Users2,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useViewMode } from "@/lib/view-mode";
import { usePreviewStudent } from "@/lib/preview-student";
import {
  listActivities, createActivity, deleteActivity, markSubmissionComplete, gradeSubmission,
} from "@/lib/activities.functions";
import { listClasses, listStudents } from "@/lib/tenant.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/atividades")({
  head: () => ({ meta: [{ title: "Atividades — BitraHub" }, { name: "robots", content: "noindex" }] }),
  component: AtividadesPage,
});

type ActivityStatus = "pendente" | "entregue" | "corrigida";
type Submission = {
  id: string; studentId: string; studentName: string; status: ActivityStatus;
  submittedAt?: string; note?: string; grade?: number; feedback?: string; gradedAt?: string;
};
type Activity = {
  id: string; title: string; description: string; due: string; createdAt: string;
  type: "particular" | "turma"; classId?: string; className?: string;
  studentId?: string; studentName?: string; submissions: Submission[];
};

function AtividadesPage() {
  const { mode } = useViewMode();
  const fetchActivities = useServerFn(listActivities);
  const q = useQuery({ queryKey: ["activities"], queryFn: () => fetchActivities() });

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {q.isLoading ? (
            <div className="p-12 text-center text-navy-800/40"><Loader2 className="inline size-5 animate-spin" /></div>
          ) : mode === "teacher" ? (
            <TeacherView activities={(q.data ?? []) as Activity[]} />
          ) : (
            <StudentView activities={(q.data ?? []) as Activity[]} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------------- helpers ---------------- */
const STATUS_STYLE: Record<ActivityStatus, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  entregue: "bg-sky-100 text-sky-800 border-sky-200",
  corrigida: "bg-emerald-100 text-emerald-800 border-emerald-200",
};
const STATUS_LABEL: Record<ActivityStatus, string> = { pendente: "Pendente", entregue: "Entregue", corrigida: "Corrigida" };
const TYPE_STYLE = {
  particular: "bg-violet-100 text-violet-800 border-violet-200",
  turma: "bg-sky-100 text-sky-800 border-sky-200",
} as const;

function StatusBadge({ s }: { s: ActivityStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_STYLE[s]}`}>
      <span className="size-1.5 rounded-full bg-current" /> {STATUS_LABEL[s]}
    </span>
  );
}
function TypeBadge({ t }: { t: "particular" | "turma" }) {
  const Icon = t === "particular" ? UserRound : Users2;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${TYPE_STYLE[t]}`}>
      <Icon className="size-3" /> {t === "particular" ? "Particular" : "Turma"}
    </span>
  );
}
function fmtDue(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round((d.getTime() - new Date(today.toDateString()).getTime()) / 86400000);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (diff === 0) return `Hoje · ${date}`;
  if (diff === 1) return `Amanhã · ${date}`;
  if (diff < 0) return `Atrasado · ${date}`;
  return `Em ${diff} dias · ${date}`;
}
function aggregateStatus(a: Activity): ActivityStatus {
  if (!a.submissions.length) return "pendente";
  if (a.submissions.every((s) => s.status === "corrigida")) return "corrigida";
  if (a.submissions.some((s) => s.status === "entregue" || s.status === "corrigida")) return "entregue";
  return "pendente";
}

/* ---------------- TEACHER VIEW ---------------- */
function TeacherView({ activities }: { activities: Activity[] }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [grading, setGrading] = useState<{ activity: Activity; submission: Submission } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const gradeFn = useServerFn(gradeSubmission);
  const deleteFn = useServerFn(deleteActivity);

  const gradeM = useMutation({
    mutationFn: (v: { submission_id: string; grade: number; feedback: string }) => gradeFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      setGrading(null);
      toast.success("Correção salva");
    },
    onError: (e: any) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["activities"] }); toast.success("Atividade removida"); },
    onError: (e: any) => toast.error("Erro", { description: e.message }),
  });

  const counts = useMemo(() => {
    const subs = activities.flatMap((a) => a.submissions);
    return {
      total: activities.length,
      pendentes: subs.filter((s) => s.status === "pendente").length,
      entregues: subs.filter((s) => s.status === "entregue").length,
      corrigidas: subs.filter((s) => s.status === "corrigida").length,
    };
  }, [activities]);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl sm:text-3xl font-display font-extrabold tracking-tight">Atividades</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-navy-800/40 mt-1">Visão professor</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 h-10 rounded-full px-4 gap-2">
          <Plus className="size-4" /> Nova
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Atividades" value={counts.total} tone="navy" />
        <Stat label="Pendentes" value={counts.pendentes} tone="amber" />
        <Stat label="Para corrigir" value={counts.entregues} tone="sky" />
        <Stat label="Corrigidas" value={counts.corrigidas} tone="emerald" />
      </div>

      {activities.length === 0 ? (
        <div className="bg-white border border-border-subtle rounded-2xl p-10 text-center">
          <FileText className="mx-auto size-8 text-navy-800/30 mb-2" />
          <p className="font-display font-bold">Nenhuma atividade ainda</p>
          <p className="text-sm text-navy-800/60">Crie a primeira para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => {
            const agg = aggregateStatus(a);
            const pendingGrade = a.submissions.filter((s) => s.status === "entregue").length;
            const isOpen = openId === a.id;
            return (
              <motion.div key={a.id} layout className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : a.id)}
                  className="w-full text-left p-4 sm:p-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 hover:bg-surface/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <TypeBadge t={a.type} />
                      <StatusBadge s={agg} />
                      {pendingGrade > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold">
                          <Sparkles className="size-3" /> {pendingGrade} para corrigir
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg truncate">{a.title}</h3>
                    <p className="text-xs text-navy-800/60 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" /> {fmtDue(a.due)}</span>
                      <span>·</span>
                      <span className="truncate">{a.type === "turma" ? a.className : a.studentName}</span>
                    </p>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 size-8 grid place-items-center rounded-full bg-surface text-navy-800/60">
                    <ChevronDown className="size-4" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden border-t border-border-subtle"
                    >
                      <div className="p-4 sm:p-5 space-y-4">
                        {a.description && <p className="text-sm text-navy-800/80 leading-relaxed whitespace-pre-line">{a.description}</p>}
                        <div className="space-y-2">
                          <p className="text-[11px] font-mono uppercase tracking-widest text-navy-800/40">
                            Entregas ({a.submissions.length})
                          </p>
                          {a.submissions.length === 0 && (
                            <p className="text-xs text-navy-800/50 italic">Nenhum aluno matriculado — matricule alunos na turma para gerar entregas.</p>
                          )}
                          {a.submissions.map((s) => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border-subtle">
                              <div className="size-9 rounded-full bg-navy-900 text-paper grid place-items-center text-xs font-bold shrink-0">
                                {s.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{s.studentName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <StatusBadge s={s.status} />
                                  {typeof s.grade === "number" && (
                                    <span className="text-xs font-bold text-emerald-700">Nota {s.grade.toFixed(1)}</span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant={s.status === "entregue" ? "default" : "outline"}
                                size="sm" disabled={s.status === "pendente"}
                                onClick={() => setGrading({ activity: a, submission: s })}
                                className="shrink-0 h-9 rounded-full gap-1.5"
                              >
                                <Pencil className="size-3.5" />
                                {s.status === "corrigida" ? "Revisar" : "Corrigir"}
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { if (confirm("Remover esta atividade?")) deleteM.mutate(a.id); }}
                            className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 gap-1.5"
                          >
                            <Trash2 className="size-3.5" /> Excluir
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <GradeDrawer
        grading={grading}
        onClose={() => setGrading(null)}
        onSave={(g, f) => grading && gradeM.mutate({ submission_id: grading.submission.id, grade: g, feedback: f })}
        saving={gradeM.isPending}
      />
      <CreateActivityDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "navy" | "amber" | "sky" | "emerald" }) {
  const styles: Record<typeof tone, string> = {
    navy: "bg-navy-900 text-paper",
    amber: "bg-amber-50 text-amber-900 border border-amber-200",
    sky: "bg-sky-50 text-sky-900 border border-sky-200",
    emerald: "bg-emerald-50 text-emerald-900 border border-emerald-200",
  };
  return (
    <div className={`rounded-2xl p-4 ${styles[tone]}`}>
      <p className="text-[10px] font-mono uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-2xl font-display font-extrabold mt-1">{value}</p>
    </div>
  );
}

/* ---------------- STUDENT VIEW ---------------- */
function StudentView({ activities }: { activities: Activity[] }) {
  const qc = useQueryClient();
  const fetchStudents = useServerFn(listStudents);
  const students = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents() });
  const list = (students.data ?? []) as any[];
  const { studentId, setStudentId } = usePreviewStudent(list[0]?.id);
  const current = list.find((s) => s.id === studentId);

  const [tab, setTab] = useState<"pendentes" | "entregues">("pendentes");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const markFn = useServerFn(markSubmissionComplete);
  const markM = useMutation({
    mutationFn: (v: { submission_id: string; note?: string }) => markFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      setOpenId(null);
      toast.success("Atividade entregue", { description: "O professor receberá sua entrega." });
    },
    onError: (e: any) => toast.error("Erro", { description: e.message }),
  });

  const mine = useMemo(() => {
    if (!studentId) return [];
    return activities
      .map((a) => {
        const sub = a.submissions.find((s) => s.studentId === studentId);
        return sub ? { a, sub } : null;
      })
      .filter((x): x is { a: Activity; sub: Submission } => !!x)
      .sort((x, y) => new Date(x.a.due).getTime() - new Date(y.a.due).getTime());
  }, [activities, studentId]);

  const filtered = mine.filter(({ sub }) =>
    tab === "pendentes" ? sub.status === "pendente" : sub.status !== "pendente"
  );

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-navy-800/40">
            Olá{current ? `, ${current.full_name.split(" ")[0]}` : ""}
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">Suas atividades</h1>
        </div>
        {list.length > 0 && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 flex items-center gap-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-800">Prévia</div>
            <Select value={studentId ?? ""} onValueChange={setStudentId}>
              <SelectTrigger className="h-9 rounded-lg bg-white flex-1 max-w-xs"><SelectValue placeholder="Selecione aluno" /></SelectTrigger>
              <SelectContent>
                {list.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {list.length === 0 && (
        <div className="bg-white border border-border-subtle rounded-2xl p-8 text-center text-sm text-navy-800/60">
          Cadastre alunos para simular o portal do aluno.
        </div>
      )}

      {list.length > 0 && (
        <>
          <div className="inline-flex bg-surface border border-border-subtle rounded-full p-1 text-sm">
            {(["pendentes", "entregues"] as const).map((t) => (
              <button
                key={t} onClick={() => setTab(t)}
                className={`relative px-4 h-9 rounded-full font-semibold capitalize transition-colors ${
                  tab === t ? "bg-navy-900 text-paper" : "text-navy-800/60 hover:text-navy-900"
                }`}
              >
                {t}
                <span className="ml-1.5 text-[11px] opacity-70">
                  {mine.filter((m) => (t === "pendentes" ? m.sub.status === "pendente" : m.sub.status !== "pendente")).length}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="bg-white border border-border-subtle rounded-2xl p-8 text-center">
                <CheckCircle2 className="mx-auto size-8 text-emerald-500 mb-2" />
                <p className="font-display font-bold">Tudo em dia!</p>
                <p className="text-sm text-navy-800/60">
                  Nenhuma atividade {tab === "pendentes" ? "pendente" : "entregue"} no momento.
                </p>
              </div>
            )}
            {filtered.map(({ a, sub }) => {
              const isOpen = openId === sub.id;
              return (
                <motion.div key={sub.id} layout className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? null : sub.id)}
                    className="w-full text-left p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 hover:bg-surface/60 transition-colors"
                  >
                    <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                      sub.status === "corrigida" ? "bg-emerald-100 text-emerald-700" :
                      sub.status === "entregue" ? "bg-sky-100 text-sky-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {sub.status === "corrigida" ? <CheckCircle2 className="size-5" /> :
                       sub.status === "entregue" ? <FileText className="size-5" /> :
                       <Circle className="size-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold truncate">{a.title}</h3>
                      <p className="text-xs text-navy-800/60 mt-0.5 flex items-center gap-2 flex-wrap">
                        <TypeBadge t={a.type} />
                        <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" /> {fmtDue(a.due)}</span>
                      </p>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 size-8 grid place-items-center rounded-full bg-surface text-navy-800/60">
                      <ChevronDown className="size-4" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden border-t border-border-subtle"
                      >
                        <div className="p-4 space-y-4">
                          {a.description && <p className="text-sm text-navy-800/80 leading-relaxed whitespace-pre-line">{a.description}</p>}

                          {sub.status === "corrigida" && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-700">Correção do professor</p>
                                <span className="text-lg font-display font-extrabold text-emerald-700">{sub.grade?.toFixed(1)}</span>
                              </div>
                              {sub.feedback && <p className="text-sm text-emerald-900">{sub.feedback}</p>}
                            </div>
                          )}

                          {sub.status === "entregue" && (
                            <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
                              <p className="text-[11px] font-mono uppercase tracking-widest text-sky-700 mb-1">Aguardando correção</p>
                              {sub.note && <p className="text-sm text-sky-900 italic">"{sub.note}"</p>}
                            </div>
                          )}

                          {sub.status === "pendente" && (
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label htmlFor={`note-${sub.id}`} className="text-xs">Observações (opcional)</Label>
                                <Textarea
                                  id={`note-${sub.id}`}
                                  placeholder="Conte ao professor sobre sua resolução, dúvidas, etc."
                                  value={notes[sub.id] || ""}
                                  onChange={(e) => setNotes({ ...notes, [sub.id]: e.target.value })}
                                  className="rounded-xl min-h-24"
                                />
                              </div>
                              <Button
                                onClick={() => markM.mutate({ submission_id: sub.id, note: notes[sub.id] || undefined })}
                                disabled={markM.isPending}
                                className="w-full h-11 rounded-full gap-2"
                              >
                                {markM.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                Marcar como concluída
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- BOTTOM SHEETS ---------------- */
function GradeDrawer({
  grading, onClose, onSave, saving,
}: {
  grading: { activity: Activity; submission: Submission } | null;
  onClose: () => void;
  onSave: (g: number, f: string) => void;
  saving: boolean;
}) {
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (grading) {
      setGrade(grading.submission.grade != null ? String(grading.submission.grade) : "");
      setFeedback(grading.submission.feedback || "");
    }
  }, [grading]);

  return (
    <Drawer open={!!grading} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-xl">Corrigir entrega</DrawerTitle>
          <DrawerDescription>
            {grading?.submission.studentName} · {grading?.activity.title}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 sm:px-6 space-y-4">
          {grading?.submission.note && (
            <div className="rounded-xl bg-surface border border-border-subtle p-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-navy-800/40 mb-1">Observação do aluno</p>
              <p className="text-sm italic">"{grading.submission.note}"</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="grade" className="text-xs">Nota (0 a 10)</Label>
            <Input
              id="grade" type="number" min={0} max={10} step={0.1}
              value={grade} onChange={(e) => setGrade(e.target.value)}
              className="h-12 rounded-xl text-lg font-display font-bold" placeholder="8.5"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback" className="text-xs">Comentário pedagógico</Label>
            <Textarea
              id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)}
              className="rounded-xl min-h-28" placeholder="Pontos fortes, sugestões de melhoria…"
            />
          </div>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 h-11 rounded-full">Cancelar</Button>
          </DrawerClose>
          <Button
            className="flex-1 h-11 rounded-full" disabled={!grade || saving}
            onClick={() => onSave(Number(grade), feedback)}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar correção"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function CreateActivityDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchClasses = useServerFn(listClasses);
  const fetchStudents = useServerFn(listStudents);
  const classes = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses(), enabled: open });
  const students = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents(), enabled: open });
  const createFn = useServerFn(createActivity);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [type, setType] = useState<"particular" | "turma">("turma");
  const [targetId, setTargetId] = useState("");

  const options = type === "turma" ? (classes.data ?? []) : (students.data ?? []);
  const optName = (o: any) => (type === "turma" ? o.name : o.full_name);

  const reset = () => { setTitle(""); setDescription(""); setDue(""); setType("turma"); setTargetId(""); };

  const createM = useMutation({
    mutationFn: () => createFn({ data: { title, description: description || null, due, type, targetId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade criada", { description: title });
      reset(); onClose();
    },
    onError: (e: any) => toast.error("Erro ao criar", { description: e.message }),
  });

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-xl">Nova atividade</DrawerTitle>
          <DrawerDescription>Defina o destino, prazo e instruções.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 sm:px-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["turma", "particular"] as const).map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => { setType(t); setTargetId(""); }}
                  className={`h-12 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    type === t ? "bg-navy-900 text-paper border-navy-900" : "bg-white border-border-subtle text-navy-800/70 hover:border-navy-800/30"
                  }`}
                >
                  {t === "turma" ? <Users2 className="size-4" /> : <UserRound className="size-4" />}
                  {t === "turma" ? "Turma" : "Particular"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{type === "turma" ? "Turma" : "Aluno"}</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder={`Selecione ${type === "turma" ? "uma turma" : "um aluno"}`} />
              </SelectTrigger>
              <SelectContent>
                {options.length === 0 && (
                  <div className="px-3 py-2 text-xs text-navy-800/50">Nenhum {type === "turma" ? "turma cadastrada" : "aluno cadastrado"}.</div>
                )}
                {options.map((o: any) => (
                  <SelectItem key={o.id} value={o.id}>{optName(o)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl" placeholder="Lista de exercícios…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs">Descrição</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-28" placeholder="Instruções, capítulos, critérios…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due" className="text-xs">Prazo</Label>
            <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-12 rounded-xl" />
          </div>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 h-11 rounded-full">Cancelar</Button>
          </DrawerClose>
          <Button
            className="flex-1 h-11 rounded-full"
            disabled={!title || !due || !targetId || createM.isPending}
            onClick={() => createM.mutate()}
          >
            {createM.isPending ? <Loader2 className="size-4 animate-spin" /> : "Criar atividade"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}