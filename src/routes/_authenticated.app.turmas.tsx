import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus,
  Clock,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
  UserPlus,
  Users,
  X,
  Copy,
  Check,
  Search,
  Filter,
} from "lucide-react";
import { listClasses, listCourses, upsertClass, deleteClass } from "@/lib/tenant.functions";
import {
  listTenantProfessors,
  listClassTeachers,
  assignTeacher,
  unassignTeacher,
  inviteProfessor,
} from "@/lib/teachers.functions";
import { useSession } from "@/hooks/use-session";
import { Modal, Field, FormFooter, inputCls } from "./_authenticated.app.cursos";

export const Route = createFileRoute("/_authenticated/app/turmas")({
  component: TurmasPage,
});

function TurmasPage() {
  const fetchClasses = useServerFn(listClasses);
  const fetchCourses = useServerFn(listCourses);
  const fetchProfessors = useServerFn(listTenantProfessors);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses() });
  const cQ = useQuery({ queryKey: ["courses"], queryFn: () => fetchCourses() });
  const profsQ = useQuery({ queryKey: ["tenant-professors"], queryFn: () => fetchProfessors() });

  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [teachersFor, setTeachersFor] = useState<any | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selectedProf, setSelectedProf] = useState("all");

  const session = useSession();
  const isAdmin = !!session.data?.isAdmin;
  const allClasses = q.data ?? [];
  const courses = cQ.data ?? [];
  const professors = profsQ.data ?? [];

  const filteredClasses = allClasses.filter((c: any) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.course_name && c.course_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.room && c.room.toLowerCase().includes(search.toLowerCase())) ||
      (c.schedule && c.schedule.toLowerCase().includes(search.toLowerCase()));

    const matchesCourse = courseFilter === "all" || c.course_id === courseFilter;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Turmas</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">
            {filteredClasses.length} {filteredClasses.length === 1 ? "turma encontrada" : "turmas"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 px-4 h-10 border border-border-subtle bg-white text-navy-900 rounded-sm font-bold text-sm hover:bg-surface"
            >
              <UserPlus className="size-4" /> Convidar professor
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800"
            >
              <Plus className="size-4" /> Nova turma
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 flex items-center gap-2 px-3 h-10 bg-white border border-border-subtle rounded-md">
          <Search className="size-4 text-navy-800/40 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por turma, horário ou sala…"
            className="bg-transparent flex-1 min-w-0 text-sm outline-none placeholder:text-navy-800/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-navy-800/40 hover:text-navy-800">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 h-10 bg-white border border-border-subtle rounded-md text-sm">
            <Filter className="size-3.5 text-navy-800/40 shrink-0" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-transparent text-sm outline-none text-navy-900 cursor-pointer"
            >
              <option value="all">Todos os cursos</option>
              {courses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {q.isLoading && (
        <p className="text-sm text-navy-800/40">
          <Loader2 className="inline size-4 animate-spin" />
        </p>
      )}
      {!q.isLoading && allClasses.length === 0 && (
        <div className="bg-white border border-dashed border-border-subtle rounded-lg p-12 text-center text-navy-800/50 text-sm">
          {(cQ.data ?? []).length === 0
            ? "Cadastre um curso antes de criar turmas."
            : "Nenhuma turma cadastrada. Crie a primeira."}
        </div>
      )}
      {!q.isLoading && allClasses.length > 0 && filteredClasses.length === 0 && (
        <div className="bg-white border border-border-subtle rounded-lg p-8 text-center text-navy-800/50 text-sm">
          Nenhuma turma encontrada para os filtros selecionados.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClasses.map((c: any) => (
          <div
            key={c.id}
            className="bg-white border border-border-subtle rounded-lg p-6 flex flex-col gap-4 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg truncate">{c.name}</h3>
                <p className="text-xs text-navy-800/50 truncate">{c.course_name}</p>
              </div>
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    title="Professores"
                    onClick={() => setTeachersFor(c)}
                    className="p-1.5 hover:bg-surface rounded-sm"
                  >
                    <Users className="size-3.5" />
                  </button>
                  <button
                    title="Editar"
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                    className="p-1.5 hover:bg-surface rounded-sm"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <DelBtn
                    id={c.id}
                    onDone={() => qc.invalidateQueries({ queryKey: ["classes"] })}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2 text-xs text-navy-800/70">
              {c.schedule && (
                <p className="flex items-center gap-2">
                  <Clock className="size-3.5" /> {c.schedule}
                </p>
              )}
              {c.room && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5" /> {c.room}
                </p>
              )}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase text-navy-800/50">
                {c.enrolled} alunos
              </span>
              <Link
                to="/app/chamada"
                search={{ class_id: c.id }}
                className="inline-flex items-center justify-center px-3 h-9 bg-navy-900 text-paper rounded-sm font-bold text-xs hover:bg-navy-800"
              >
                Chamada
              </Link>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <ClassDialog
          initial={editing}
          courses={cQ.data ?? []}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["classes"] });
          }}
        />
      )}
      {teachersFor && (
        <TeachersDialog classItem={teachersFor} onClose={() => setTeachersFor(null)} />
      )}
      {inviteOpen && <InviteProfessorDialog onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function DelBtn({ id, onDone }: { id: string; onDone: () => void }) {
  const del = useServerFn(deleteClass);
  const m = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: onDone });
  return (
    <button
      onClick={() => {
        if (confirm("Excluir turma?")) m.mutate();
      }}
      className="p-1.5 hover:bg-rose-50 text-rose-700 rounded-sm"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

function ClassDialog({
  initial,
  courses,
  onClose,
  onSaved,
}: {
  initial: any | null;
  courses: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertClass);
  const [name, setName] = useState(initial?.name ?? "");
  const [courseId, setCourseId] = useState<string>(initial?.course_id ?? courses[0]?.id ?? "");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "");
  const [room, setRoom] = useState(initial?.room ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");
  const m = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: initial?.id,
          course_id: courseId,
          name,
          schedule: schedule || null,
          room: room || null,
          start_date: startDate || null,
          end_date: endDate || null,
        },
      }),
    onSuccess: onSaved,
  });
  return (
    <Modal onClose={onClose} title={initial ? "Editar turma" : "Nova turma"}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
      >
        <Field label="Curso">
          <select
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={inputCls}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nome da turma">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Horário">
          <input
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="Seg/Qua 19h-21h"
            className={inputCls}
          />
        </Field>
        <Field label="Sala">
          <input value={room} onChange={(e) => setRoom(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Fim">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        {m.error && <p className="text-xs text-rose-700">{(m.error as Error).message}</p>}
        <FormFooter onCancel={onClose} loading={m.isPending} />
      </form>
    </Modal>
  );
}

function TeachersDialog({ classItem, onClose }: { classItem: any; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchList = useServerFn(listClassTeachers);
  const fetchProfs = useServerFn(listTenantProfessors);
  const assign = useServerFn(assignTeacher);
  const unassign = useServerFn(unassignTeacher);
  const list = useQuery({
    queryKey: ["class-teachers", classItem.id],
    queryFn: () => fetchList({ data: { class_id: classItem.id } }),
  });
  const profs = useQuery({ queryKey: ["tenant-professors"], queryFn: () => fetchProfs() });
  const [selected, setSelected] = useState<string>("");
  const addM = useMutation({
    mutationFn: () => assign({ data: { class_id: classItem.id, teacher_id: selected } }),
    onSuccess: () => {
      setSelected("");
      qc.invalidateQueries({ queryKey: ["class-teachers", classItem.id] });
    },
  });
  const removeM = useMutation({
    mutationFn: (id: string) => unassign({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-teachers", classItem.id] }),
  });
  const currentIds = new Set((list.data ?? []).map((r: any) => r.teacher_id));
  const available = (profs.data ?? []).filter((p: any) => !currentIds.has(p.id));

  return (
    <Modal onClose={onClose} title={`Professores — ${classItem.name}`}>
      <div className="space-y-4">
        <div className="space-y-2">
          {list.isLoading && (
            <p className="text-xs text-navy-800/40">
              <Loader2 className="inline size-3 animate-spin" />
            </p>
          )}
          {!list.isLoading && (list.data ?? []).length === 0 && (
            <p className="text-xs text-navy-800/50">Nenhum professor atribuído.</p>
          )}
          {(list.data ?? []).map((r: any) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-surface rounded-md px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{r.full_name}</p>
                <p className="text-[11px] text-navy-800/50 truncate">{r.email}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remover professor desta turma?")) removeM.mutate(r.id);
                }}
                className="p-1.5 hover:bg-rose-50 text-rose-700 rounded-sm"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-border-subtle pt-4 space-y-2">
          <label className="block text-xs font-mono uppercase tracking-widest text-navy-800/60">
            Atribuir professor existente
          </label>
          {profs.isLoading ? (
            <p className="text-xs text-navy-800/40">
              <Loader2 className="inline size-3 animate-spin" />
            </p>
          ) : available.length === 0 ? (
            <p className="text-xs text-navy-800/50">
              Nenhum professor disponível. Convide um pela tela de turmas.
            </p>
          ) : (
            <div className="flex gap-2">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className={inputCls + " flex-1"}
              >
                <option value="">Selecione…</option>
                {available.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} — {p.email}
                  </option>
                ))}
              </select>
              <button
                disabled={!selected || addM.isPending}
                onClick={() => addM.mutate()}
                className="px-3 h-10 bg-navy-900 text-paper rounded-sm font-bold text-xs hover:bg-navy-800 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          )}
          {addM.error && <p className="text-xs text-rose-700">{(addM.error as Error).message}</p>}
        </div>
      </div>
    </Modal>
  );
}

function InviteProfessorDialog({ onClose }: { onClose: () => void }) {
  const invite = useServerFn(inviteProfessor);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const m = useMutation({
    mutationFn: () => invite({ data: { email } }),
    onSuccess: (res: any) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setLink(`${origin}/accept-invite?token=${res.token}`);
    },
  });
  return (
    <Modal onClose={onClose} title="Convidar professor">
      {!link ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <Field label="E-mail do professor">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>
          {m.error && <p className="text-xs text-rose-700">{(m.error as Error).message}</p>}
          <FormFooter onCancel={onClose} loading={m.isPending} />
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-navy-800/70">
            Compartilhe este link com o professor para criar a senha e acessar o painel.
          </p>
          <div className="flex gap-2">
            <input readOnly value={link} className={inputCls + " flex-1 text-xs"} />
            <button
              onClick={() => {
                navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="px-3 h-10 bg-navy-900 text-paper rounded-sm font-bold text-xs hover:bg-navy-800 inline-flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copiar
                </>
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full h-10 border border-border-subtle rounded-sm font-semibold text-sm hover:bg-surface"
          >
            Fechar
          </button>
        </div>
      )}
    </Modal>
  );
}
