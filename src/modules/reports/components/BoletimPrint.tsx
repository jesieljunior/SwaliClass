import { useMemo } from "react";
import { Printer, X } from "lucide-react";

export type BoletimRecord = {
  activity_title: string;
  due_at: string;
  class_name: string;
  course_name: string;
  student_id: string;
  student_name: string;
  status: string;
  grade: number | null;
  max_grade: number;
  percent: number | null;
};

export function BoletimPrint({
  records,
  studentName,
  periodLabel,
  tenantName,
  onClose,
}: {
  records: BoletimRecord[];
  studentName: string;
  periodLabel: string;
  tenantName: string;
  onClose: () => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, BoletimRecord[]>();
    for (const r of records) {
      const key = `${r.course_name} — ${r.class_name}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([name, items]) => {
      const graded = items.filter((i) => i.percent !== null);
      const avg = graded.length
        ? Math.round((graded.reduce((s, i) => s + (i.percent ?? 0), 0) / graded.length) * 10) / 10
        : null;
      return { name, items, avg, graded: graded.length };
    });
  }, [records]);

  const overall = useMemo(() => {
    const graded = records.filter((r) => r.percent !== null);
    return graded.length
      ? Math.round((graded.reduce((s, r) => s + (r.percent ?? 0), 0) / graded.length) * 10) / 10
      : null;
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-navy-900/40 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-3 flex justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-semibold text-xs hover:bg-navy-800"
          >
            <Printer className="size-3.5" /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 h-10 bg-white border border-border-subtle rounded-sm font-semibold text-xs hover:bg-surface"
          >
            <X className="size-3.5" /> Fechar
          </button>
        </div>

        <div className="print-area bg-white rounded-lg p-8 border border-border-subtle">
          <header className="border-b border-navy-900/20 pb-4 mb-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50">
              {tenantName}
            </p>
            <h1 className="text-2xl font-display font-extrabold tracking-tight mt-1">
              Boletim escolar
            </h1>
            <div className="mt-3 text-sm">
              <p>
                <strong>Aluno:</strong> {studentName}
              </p>
              <p>
                <strong>Período:</strong> {periodLabel}
              </p>
              <p>
                <strong>Média geral:</strong>{" "}
                {overall === null ? "—" : `${overall}%`}
              </p>
            </div>
          </header>

          {groups.length === 0 && (
            <p className="text-sm text-navy-800/50">
              Nenhuma atividade no período selecionado.
            </p>
          )}

          {groups.map((g) => (
            <section key={g.name} className="mb-6 break-inside-avoid">
              <div className="flex items-baseline justify-between border-b border-border-subtle pb-1 mb-2">
                <h2 className="font-display font-bold text-base">{g.name}</h2>
                <span className="text-xs font-mono">
                  Média: {g.avg === null ? "—" : `${g.avg}%`}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-navy-800/50">
                    <th className="py-1 pr-3 font-medium">Atividade</th>
                    <th className="py-1 pr-3 font-medium">Prazo</th>
                    <th className="py-1 pr-3 font-medium">Situação</th>
                    <th className="py-1 pr-3 font-medium">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((i, idx) => (
                    <tr key={idx} className="border-t border-border-subtle/60">
                      <td className="py-1.5 pr-3">{i.activity_title}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs">
                        {new Date(i.due_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-1.5 pr-3 capitalize">{i.status}</td>
                      <td className="py-1.5 pr-3 font-semibold">
                        {i.grade === null ? "—" : `${i.grade} / ${i.max_grade}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

          <footer className="mt-8 pt-4 border-t border-border-subtle text-[10px] font-mono uppercase tracking-widest text-navy-800/40">
            Emitido em {new Date().toLocaleDateString("pt-BR")} · BitraHub
          </footer>
        </div>
      </div>
    </div>
  );
}
