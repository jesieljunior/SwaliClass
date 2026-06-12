import { createFileRoute } from "@tanstack/react-router";
import { students, classes, courses } from "@/lib/mock-data";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/app/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const reports = [
    { title: "Frequência por aluno", count: `${students.length} alunos`, desc: "Histórico individual de presença, faltas e justificativas." },
    { title: "Frequência por turma", count: `${classes.length} turmas`, desc: "Consolidado por turma com média e ranking de presença." },
    { title: "Frequência por curso", count: `${courses.length} cursos`, desc: "Visão executiva por curso e categoria pedagógica." },
    { title: "Auditoria de chamadas", count: "Últimos 90 dias", desc: "Log completo de quem registrou, alterou ou justificou." },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Relatórios</h1>
        <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">Exporte em CSV, Excel ou PDF</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.title} className="bg-white border border-border-subtle rounded-lg p-6 flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-navy-600">{r.count}</p>
              <h3 className="font-display font-bold text-xl mt-1">{r.title}</h3>
              <p className="text-sm text-navy-800/60 mt-2">{r.desc}</p>
            </div>
            <div className="flex gap-2 mt-auto">
              <button className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-navy-900 text-paper rounded-sm font-semibold text-xs hover:bg-navy-800">
                <FileText className="size-3.5" /> PDF
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-white border border-border-subtle rounded-sm font-semibold text-xs hover:bg-surface">
                <FileSpreadsheet className="size-3.5" /> Excel
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-white border border-border-subtle rounded-sm font-semibold text-xs hover:bg-surface">
                <Download className="size-3.5" /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}