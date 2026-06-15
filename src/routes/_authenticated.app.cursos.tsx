import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { listCourses, upsertCourse, deleteCourse } from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/app/cursos")({
  component: CursosPage,
});

function CursosPage() {
  const fetchCourses = useServerFn(listCourses);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["courses"], queryFn: () => fetchCourses() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const courses = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Cursos</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">{courses.length} cursos cadastrados</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800">
          <Plus className="size-4" /> Novo curso
        </button>
      </div>

      {q.isLoading && <p className="text-sm text-navy-800/40"><Loader2 className="inline size-4 animate-spin" /></p>}
      {!q.isLoading && courses.length === 0 && (
        <div className="bg-white border border-dashed border-border-subtle rounded-lg p-12 text-center text-navy-800/50 text-sm">
          Nenhum curso ainda. Clique em "Novo curso" para começar.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c: any) => (
          <div key={c.id} className="bg-white border border-border-subtle rounded-lg p-6 group">
            <div className="flex items-center justify-between gap-2 mb-3">
              {c.category ? (
                <span className="text-[10px] font-mono uppercase tracking-widest text-navy-600 bg-navy-600/10 px-2 py-1 rounded-sm">{c.category}</span>
              ) : <span />}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => { setEditing(c); setOpen(true); }} className="p-1.5 hover:bg-surface rounded-sm" title="Editar"><Pencil className="size-3.5" /></button>
                <DeleteBtn id={c.id} onDone={() => qc.invalidateQueries({ queryKey: ["courses"] })} />
              </div>
            </div>
            <h3 className="font-display font-bold text-xl">{c.name}</h3>
            {c.description && <p className="text-sm text-navy-800/60 mt-2 mb-5">{c.description}</p>}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle text-xs gap-3 flex-wrap">
              <span className="text-navy-800/70">{c.workload_hours ? `${c.workload_hours}h` : "Carga horária —"}</span>
              <div className="flex gap-4 font-mono text-navy-800/50 shrink-0">
                <span>{c.class_count} turmas</span>
                <span>{c.student_count} alunos</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <CourseDialog
          initial={editing}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["courses"] }); }}
        />
      )}
    </div>
  );
}

function DeleteBtn({ id, onDone }: { id: string; onDone: () => void }) {
  const del = useServerFn(deleteCourse);
  const m = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: onDone });
  return (
    <button onClick={() => { if (confirm("Excluir este curso?")) m.mutate(); }} className="p-1.5 hover:bg-rose-50 text-rose-700 rounded-sm" title="Excluir">
      <Trash2 className="size-3.5" />
    </button>
  );
}

function CourseDialog({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const save = useServerFn(upsertCourse);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [workload, setWorkload] = useState<string>(initial?.workload_hours?.toString() ?? "");
  const m = useMutation({
    mutationFn: () => save({ data: {
      id: initial?.id, name, description: description || null, category: category || null,
      workload_hours: workload ? Number(workload) : null,
    }}),
    onSuccess: onSaved,
  });
  return (
    <Modal onClose={onClose} title={initial ? "Editar curso" : "Novo curso"}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <Field label="Nome"><input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
        <Field label="Categoria"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} /></Field>
        <Field label="Carga horária (h)"><input type="number" min="0" value={workload} onChange={(e) => setWorkload(e.target.value)} className={inputCls} /></Field>
        <Field label="Descrição"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} h-auto py-2`} /></Field>
        {m.error && <p className="text-xs text-rose-700">{(m.error as Error).message}</p>}
        <FormFooter onCancel={onClose} loading={m.isPending} />
      </form>
    </Modal>
  );
}

export const inputCls = "w-full h-10 px-3 border border-border-subtle rounded-sm bg-white text-sm";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-navy-600 block mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-paper w-full max-w-md rounded-lg border border-border-subtle p-6 shadow-xl max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-display font-extrabold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function FormFooter({ onCancel, loading }: { onCancel: () => void; loading: boolean }) {
  return (
    <div className="flex gap-2 justify-end pt-2">
      <button type="button" onClick={onCancel} className="px-4 h-10 text-sm font-bold border border-border-subtle rounded-sm hover:bg-surface">Cancelar</button>
      <button disabled={loading} className="px-4 h-10 text-sm font-bold bg-navy-900 text-paper rounded-sm hover:bg-navy-800 inline-flex items-center gap-2">
        {loading && <Loader2 className="size-4 animate-spin" />} Salvar
      </button>
    </div>
  );
}