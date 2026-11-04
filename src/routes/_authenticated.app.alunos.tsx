import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Loader2,
  Send,
  Copy,
  CheckCircle2,
  Upload,
  Download,
} from "lucide-react";
import {
  listStudents,
  upsertStudent,
  deleteStudent,
  listClasses,
  enrollStudent,
  unenrollStudent,
  toggleEnrollmentStatus,
  bulkImportStudents,
} from "@/lib/tenant.functions";
import { inviteStudent } from "@/lib/session.functions";
import { Modal, Field, FormFooter, inputCls } from "./_authenticated.app.cursos";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/alunos")({
  component: AlunosPage,
});

function AlunosPage() {
  const fetchStudents = useServerFn(listStudents);
  const fetchClasses = useServerFn(listClasses);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents() });
  const classesQ = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses() });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [enrollFor, setEnrollFor] = useState<any | null>(null);

  const list = useMemo(() => {
    const term = search.toLowerCase();
    return (q.data ?? []).filter(
      (s: any) =>
        !term || s.full_name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term),
    );
  }, [q.data, search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Alunos</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">
            {list.length} resultados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton students={list} />
          <ImportCsvButton onDone={() => qc.invalidateQueries({ queryKey: ["students"] })} />
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800"
          >
            <Plus className="size-4" /> Novo aluno
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 h-10 bg-white border border-border-subtle rounded-md">
        <Search className="size-4 text-navy-800/40 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email…"
          className="bg-transparent flex-1 min-w-0 text-sm outline-none"
        />
      </div>

      <div className="bg-white border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border-subtle text-[10px] font-mono uppercase tracking-widest text-navy-800/50">
            <tr>
              <th className="text-left px-5 py-3 font-bold">Aluno</th>
              <th className="text-left px-5 py-3 font-bold hidden md:table-cell">Turmas</th>
              <th className="text-left px-5 py-3 font-bold hidden lg:table-cell">Contato</th>
              <th className="text-right px-5 py-3 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {q.isLoading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center">
                  <Loader2 className="inline size-4 animate-spin" />
                </td>
              </tr>
            )}
            {!q.isLoading && list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-navy-800/40 text-sm">
                  Nenhum aluno.
                </td>
              </tr>
            )}
            {list.map((s: any) => (
              <tr key={s.id} className="hover:bg-surface/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-navy-900/10 grid place-items-center text-[11px] font-bold shrink-0">
                      {s.full_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{s.full_name}</p>
                      {s.email && (
                        <p className="text-[11px] text-navy-800/50 truncate">{s.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell text-navy-800/80 text-xs">
                  {s.class_names || "—"}
                </td>
                <td className="px-5 py-3 hidden lg:table-cell font-mono text-xs text-navy-800/80">
                  {s.phone || "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <InviteStudent student={s} />
                    <button
                      onClick={() => setEnrollFor(s)}
                      className="p-1.5 hover:bg-surface rounded-sm"
                      title="Matrículas"
                    >
                      <UserPlus className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                      className="p-1.5 hover:bg-surface rounded-sm"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <DelStudent
                      id={s.id}
                      onDone={() => qc.invalidateQueries({ queryKey: ["students"] })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <StudentDialog
          initial={editing}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["students"] });
          }}
        />
      )}
      {enrollFor && (
        <EnrollmentDialog
          student={enrollFor}
          classes={classesQ.data ?? []}
          onClose={() => setEnrollFor(null)}
          onChange={() => {
            qc.invalidateQueries({ queryKey: ["students"] });
            qc.invalidateQueries({ queryKey: ["classes"] });
          }}
        />
      )}
    </div>
  );
}

function DelStudent({ id, onDone }: { id: string; onDone: () => void }) {
  const del = useServerFn(deleteStudent);
  const m = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: onDone });
  return (
    <button
      onClick={() => {
        if (confirm("Excluir aluno?")) m.mutate();
      }}
      className="p-1.5 hover:bg-rose-50 text-rose-700 rounded-sm"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

// ---------- CSV helpers ----------
const CSV_HEADERS = [
  "full_name",
  "email",
  "phone",
  "document",
  "birth_date",
  "guardian_name",
  "guardian_phone",
  "notes",
  "class_name",
];

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length);
  if (lines.length === 0) return [];
  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === "," || ch === ";") {
          out.push(cur);
          cur = "";
        } else cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

function ExportCsvButton({ students }: { students: any[] }) {
  const onClick = () => {
    const header = CSV_HEADERS.join(",");
    const lines = students.map((s) =>
      CSV_HEADERS.map((h) =>
        h === "class_name" ? csvEscape(s.class_names ?? "") : csvEscape(s[h] ?? ""),
      ).join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alunos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 h-10 border border-border-subtle rounded-sm text-sm hover:bg-surface"
    >
      <Download className="size-4" /> Exportar CSV
    </button>
  );
}

function ImportCsvButton({ onDone }: { onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imp = useServerFn(bulkImportStudents);
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);

  const m = useMutation({
    mutationFn: (rows: any[]) => imp({ data: { rows } }),
    onSuccess: (r: any) => {
      toast.success("Importação concluída com sucesso!", {
        description: `${r.created} criados · ${r.skipped} já existiam · ${r.enrolled} matriculados${r.errors?.length ? ` · ${r.errors.length} erros` : ""}`,
      });
      setPreviewRows(null);
      onDone();
    },
    onError: (e: any) => toast.error("Falha na importação", { description: e.message }),
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text).map((r) => ({
      full_name: (r.full_name || r.nome || "").trim(),
      email: (r.email || "").trim() || null,
      phone: (r.phone || r.telefone || "").trim() || null,
      document: (r.document || r.documento || "").trim() || null,
      birth_date: (r.birth_date || r.nascimento || "").trim() || null,
      guardian_name: (r.guardian_name || r.responsavel || "").trim() || null,
      guardian_phone: (r.guardian_phone || "").trim() || null,
      notes: (r.notes || r.observacoes || "").trim() || null,
      class_name: (r.class_name || r.turma || "").trim() || null,
    }));

    if (!rows.length) {
      toast.error("CSV vazio ou inválido", {
        description: `Cabeçalhos esperados: ${CSV_HEADERS.join(", ")}`,
      });
      return;
    }
    // Abre modal de prévia para revisão do usuário
    setPreviewRows(rows);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={m.isPending}
        className="inline-flex items-center gap-2 px-3 h-10 border border-border-subtle rounded-sm text-sm hover:bg-surface font-semibold"
      >
        <Upload className="size-4" />
        Importar CSV
      </button>

      {previewRows && (
        <CsvPreviewModal
          rows={previewRows}
          isLoading={m.isPending}
          onConfirm={(validRows) => m.mutate(validRows)}
          onClose={() => setPreviewRows(null)}
        />
      )}
    </>
  );
}

function CsvPreviewModal({
  rows,
  isLoading,
  onConfirm,
  onClose,
}: {
  rows: any[];
  isLoading: boolean;
  onConfirm: (validRows: any[]) => void;
  onClose: () => void;
}) {
  const analyzed = useMemo(() => {
    return rows.map((r, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!r.full_name || r.full_name.length < 2) {
        errors.push("Nome incompleto ou ausente");
      }
      if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
        warnings.push("Formato de e-mail inválido");
      }
      if (!r.class_name) {
        warnings.push("Sem turma atribuída (cadastro avulso)");
      }

      return {
        ...r,
        line: index + 1,
        errors,
        warnings,
        isValid: errors.length === 0,
      };
    });
  }, [rows]);

  const validRows = analyzed.filter((a) => a.isValid);
  const errorCount = analyzed.filter((a) => !a.isValid).length;
  const warningCount = analyzed.filter((a) => a.warnings.length > 0).length;

  return (
    <Modal onClose={onClose} title="Prévia de Importação de Alunos (CSV)">
      <div className="space-y-4">
        {/* Banner de Resumo da Validação */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-surface border border-border-subtle rounded-md text-xs">
          <div>
            <span className="text-navy-800/50 block font-mono">Linhas no arquivo</span>
            <strong className="text-base font-bold text-navy-900">{rows.length}</strong>
          </div>
          <div>
            <span className="text-navy-800/50 block font-mono">Prontos para importar</span>
            <strong className="text-base font-bold text-emerald-600">{validRows.length}</strong>
          </div>
          <div>
            <span className="text-navy-800/50 block font-mono">Linhas com erro</span>
            <strong
              className={`text-base font-bold ${errorCount > 0 ? "text-rose-600" : "text-navy-800/60"}`}
            >
              {errorCount}
            </strong>
          </div>
        </div>

        {errorCount > 0 && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-sm">
            {errorCount} linha(s) com erro serão ignoradas. Apenas os {validRows.length} registros
            válidos serão importados.
          </p>
        )}

        {/* Tabela de Prévia Linha a Linha */}
        <div className="border border-border-subtle rounded-md overflow-hidden max-h-72 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface sticky top-0 border-b border-border-subtle font-mono text-[10px] uppercase text-navy-800/50">
              <tr>
                <th className="px-3 py-2">Linha</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Turma</th>
                <th className="px-3 py-2">Observações / Validação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {analyzed.map((r) => (
                <tr key={r.line} className={r.isValid ? "hover:bg-surface/50" : "bg-rose-50/40"}>
                  <td className="px-3 py-2 font-mono text-navy-800/50">{r.line}</td>
                  <td className="px-3 py-2">
                    {r.isValid ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        Válido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                        Inválido
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.full_name || <em className="text-rose-500">vazio</em>}
                  </td>
                  <td className="px-3 py-2 text-navy-800/70">{r.email || "—"}</td>
                  <td className="px-3 py-2 text-navy-800/70">{r.class_name || "—"}</td>
                  <td className="px-3 py-2">
                    {r.errors.length > 0 ? (
                      <span className="text-rose-600 font-semibold">{r.errors.join(", ")}</span>
                    ) : r.warnings.length > 0 ? (
                      <span className="text-amber-600">{r.warnings.join(", ")}</span>
                    ) : (
                      <span className="text-navy-800/40 font-mono">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Confirmação */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 h-9 border border-border-subtle rounded-sm font-semibold text-xs hover:bg-surface"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm(validRows.map(({ line, errors, warnings, isValid, ...rest }) => rest))
            }
            disabled={isLoading || validRows.length === 0}
            className="px-4 h-9 bg-navy-900 text-paper rounded-sm font-bold text-xs hover:bg-navy-800 inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirmar e Importar {validRows.length} Aluno(s)
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InviteStudent({ student }: { student: any }) {
  const invite = useServerFn(inviteStudent);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const m = useMutation({
    mutationFn: () => invite({ data: { student_id: student.id } }),
    onSuccess: (r) => {
      const url = `${window.location.origin}/accept-invite?token=${r.token}`;
      setLink(url);
      toast.success("Convite gerado", { description: r.email });
    },
    onError: (e: any) => toast.error("Não foi possível convidar", { description: e.message }),
  });
  return (
    <>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-sm"
        title="Convidar acesso ao portal"
      >
        {m.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
      </button>
      {link && (
        <Modal
          onClose={() => {
            setLink(null);
            setCopied(false);
          }}
          title={`Convite — ${student.full_name}`}
        >
          <div className="space-y-3">
            <p className="text-sm text-navy-800/70">
              Envie este link para o aluno. Ele definirá uma senha e entrará no portal. O link
              expira em 7 dias.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={link}
                className={`${inputCls} font-mono text-xs`}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="shrink-0 h-10 px-3 bg-navy-900 text-paper rounded-sm text-xs font-bold inline-flex items-center gap-1.5 hover:bg-navy-800"
              >
                {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function StudentDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertStudent);
  const [s, setS] = useState<any>({
    full_name: initial?.full_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    document: initial?.document ?? "",
    birth_date: initial?.birth_date ?? "",
    guardian_name: initial?.guardian_name ?? "",
    guardian_phone: initial?.guardian_phone ?? "",
    notes: initial?.notes ?? "",
  });
  const upd = (k: string) => (e: any) => setS({ ...s, [k]: e.target.value });
  const m = useMutation({
    mutationFn: () => save({ data: { id: initial?.id, ...s } }),
    onSuccess: onSaved,
  });
  return (
    <Modal onClose={onClose} title={initial ? "Editar aluno" : "Novo aluno"}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
      >
        <Field label="Nome completo">
          <input required value={s.full_name} onChange={upd("full_name")} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="E-mail">
            <input type="email" value={s.email} onChange={upd("email")} className={inputCls} />
          </Field>
          <Field label="Telefone">
            <input value={s.phone} onChange={upd("phone")} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Documento">
            <input value={s.document} onChange={upd("document")} className={inputCls} />
          </Field>
          <Field label="Nascimento">
            <input
              type="date"
              value={s.birth_date}
              onChange={upd("birth_date")}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsável">
            <input value={s.guardian_name} onChange={upd("guardian_name")} className={inputCls} />
          </Field>
          <Field label="Tel. responsável">
            <input value={s.guardian_phone} onChange={upd("guardian_phone")} className={inputCls} />
          </Field>
        </div>
        <Field label="Observações">
          <textarea
            rows={2}
            value={s.notes}
            onChange={upd("notes")}
            className={`${inputCls} h-auto py-2`}
          />
        </Field>
        {m.error && <p className="text-xs text-rose-700">{(m.error as Error).message}</p>}
        <FormFooter onCancel={onClose} loading={m.isPending} />
      </form>
    </Modal>
  );
}

function EnrollmentDialog({
  student,
  classes,
  onClose,
  onChange,
}: {
  student: any;
  classes: any[];
  onClose: () => void;
  onChange: () => void;
}) {
  const enroll = useServerFn(enrollStudent);
  const unenroll = useServerFn(unenrollStudent);
  const toggleStatus = useServerFn(toggleEnrollmentStatus);

  const enrollmentMap = useMemo(() => {
    const map = new Map<string, { active: boolean }>();
    (student.enrollments ?? []).forEach((e: any) => {
      map.set(e.class_id, { active: e.active !== false });
    });
    return map;
  }, [student.enrollments]);

  const enrollM = useMutation({
    mutationFn: (cid: string) => enroll({ data: { student_id: student.id, class_id: cid } }),
    onSuccess: () => {
      toast.success("Aluno matriculado com sucesso!");
      onChange();
    },
    onError: (e: any) => toast.error("Falha ao matricular", { description: e.message }),
  });

  const unM = useMutation({
    mutationFn: (cid: string) => unenroll({ data: { student_id: student.id, class_id: cid } }),
    onSuccess: () => {
      toast.success("Matrícula desfeita!");
      onChange();
    },
    onError: (e: any) => toast.error("Falha ao remover", { description: e.message }),
  });

  const toggleM = useMutation({
    mutationFn: ({ cid, active }: { cid: string; active: boolean }) =>
      toggleStatus({ data: { student_id: student.id, class_id: cid, active } }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.active ? "Matrícula reativada!" : "Matrícula trancada! Histórico mantido.",
      );
      onChange();
    },
    onError: (e: any) => toast.error("Falha ao atualizar situação", { description: e.message }),
  });

  const isBusy = enrollM.isPending || unM.isPending || toggleM.isPending;

  return (
    <Modal onClose={onClose} title={`Matrículas — ${student.full_name}`}>
      <div className="space-y-3">
        <p className="text-xs text-navy-800/60">
          Gerencie as turmas do aluno. Você pode <strong>trancar</strong> para suspender sem perder
          o histórico de frequência e notas, ou desmatricular.
        </p>

        {classes.length === 0 && (
          <p className="text-sm text-navy-800/50 p-6 text-center border border-dashed rounded-md">
            Nenhuma turma cadastrada.
          </p>
        )}

        <ul className="divide-y divide-border-subtle max-h-80 overflow-y-auto">
          {classes.map((c) => {
            const enrollment = enrollmentMap.get(c.id);
            const isEnrolled = !!enrollment;
            const isActive = enrollment?.active ?? false;

            return (
              <li key={c.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    {isEnrolled &&
                      (isActive ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                          Ativa
                        </span>
                      ) : (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-200 text-zinc-700"
                          title="Matrícula trancada (histórico preservado)"
                        >
                          Trancada
                        </span>
                      ))}
                  </div>
                  <p className="text-[11px] text-navy-800/50 truncate mt-0.5">
                    {c.course_name} {c.schedule && `· ${c.schedule}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEnrolled ? (
                    <>
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => toggleM.mutate({ cid: c.id, active: false })}
                          disabled={isBusy}
                          className="px-2.5 h-8 text-xs font-semibold border border-amber-300 text-amber-800 rounded-sm hover:bg-amber-50"
                          title="Trancar matrícula preservando notas e presença"
                        >
                          Trancar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleM.mutate({ cid: c.id, active: true })}
                          disabled={isBusy}
                          className="px-2.5 h-8 text-xs font-semibold border border-emerald-300 text-emerald-800 rounded-sm hover:bg-emerald-50"
                          title="Reativar matrícula"
                        >
                          Reativar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Remover definitivamente a matrícula de ${student.full_name} na turma ${c.name}?`,
                            )
                          ) {
                            unM.mutate(c.id);
                          }
                        }}
                        disabled={isBusy}
                        className="px-2.5 h-8 text-xs font-semibold border border-rose-300 text-rose-700 rounded-sm hover:bg-rose-50"
                      >
                        Remover
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => enrollM.mutate(c.id)}
                      disabled={isBusy}
                      className="px-3 h-8 text-xs font-bold bg-navy-900 text-paper rounded-sm hover:bg-navy-800"
                    >
                      Matricular
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="pt-2 text-right border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800"
          >
            Concluir
          </button>
        </div>
      </div>
    </Modal>
  );
}
