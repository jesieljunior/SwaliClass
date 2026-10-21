import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, FileSpreadsheet, Download, Loader2, Filter, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  listCourses,
  listClasses,
  listStudents,
  getReportData,
  getGradesReport,
} from "@/lib/tenant.functions";
import { useSession } from "@/hooks/use-session";
import { BoletimPrint } from "@/modules/reports/components/BoletimPrint";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  component: RelatoriosPage,
});

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

type Tab = "overview" | "byStudent" | "byClass" | "byCourse" | "detailed";
type GradeTab = "byStudent" | "byClass" | "byActivity" | "detailed";
type ReportType = "attendance" | "grades";

function RelatoriosPage() {
  const fetchCourses = useServerFn(listCourses);
  const fetchClasses = useServerFn(listClasses);
  const fetchStudents = useServerFn(listStudents);
  const fetchReport = useServerFn(getReportData);
  const fetchGrades = useServerFn(getGradesReport);

  const coursesQ = useQuery({ queryKey: ["courses"], queryFn: () => fetchCourses() });
  const classesQ = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses() });
  const studentsQ = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents() });

  const [filters, setFilters] = useState({
    start_date: daysAgoISO(30),
    end_date: todayISO(),
    course_id: "",
    class_id: "",
    student_id: "",
  });
  const [tab, setTab] = useState<Tab>("overview");
  const [gradeTab, setGradeTab] = useState<GradeTab>("byStudent");
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [boletimOpen, setBoletimOpen] = useState(false);
  const sessionQ = useSession();

  const reportQ = useQuery({
    queryKey: ["report", filters],
    enabled: reportType === "attendance",
    queryFn: () =>
      fetchReport({
        data: {
          start_date: filters.start_date,
          end_date: filters.end_date,
          course_id: filters.course_id || null,
          class_id: filters.class_id || null,
          student_id: filters.student_id || null,
        },
      }),
  });

  const gradesQ = useQuery({
    queryKey: ["grades-report", filters],
    enabled: reportType === "grades",
    queryFn: () =>
      fetchGrades({
        data: {
          start_date: filters.start_date,
          end_date: filters.end_date,
          course_id: filters.course_id || null,
          class_id: filters.class_id || null,
          student_id: filters.student_id || null,
        },
      }),
  });

  const data = reportQ.data;
  const grades = gradesQ.data;
  const periodLabel = `${filters.start_date} a ${filters.end_date}`;

  // Class options filtered by selected course
  const filteredClasses = useMemo(() => {
    const all = (classesQ.data ?? []) as any[];
    return filters.course_id ? all.filter((c) => c.course_id === filters.course_id) : all;
  }, [classesQ.data, filters.course_id]);

  const exportExcel = async () => {
    if (!data) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const summary = [
      ["Relatório de Frequência"],
      ["Período", periodLabel],
      ["Sessões", data.totals.sessions],
      ["Alunos", data.totals.students],
      ["Presenças", data.totals.present],
      ["Faltas", data.totals.absent],
      ["Atrasos", data.totals.late],
      ["Justificadas", data.totals.justified],
      ["Frequência média", `${data.totals.rate}%`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Resumo");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.byStudent.map((s) => ({
          Aluno: s.name,
          Presenças: s.present,
          Faltas: s.absent,
          Atrasos: s.late,
          Justificadas: s.justified,
          Total: s.total,
          "Freq. %": s.rate,
        })),
      ),
      "Por aluno",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.byClass.map((s) => ({
          Turma: s.name,
          Presenças: s.present,
          Faltas: s.absent,
          Atrasos: s.late,
          Justificadas: s.justified,
          Total: s.total,
          "Freq. %": s.rate,
        })),
      ),
      "Por turma",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.byCourse.map((s) => ({
          Curso: s.name,
          Presenças: s.present,
          Faltas: s.absent,
          Atrasos: s.late,
          Justificadas: s.justified,
          Total: s.total,
          "Freq. %": s.rate,
        })),
      ),
      "Por curso",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.records.map((r) => ({
          Data: r.date,
          Curso: r.course_name,
          Turma: r.class_name,
          Aluno: r.student_name,
          Status: r.status,
        })),
      ),
      "Detalhado",
    );
    XLSX.writeFile(wb, `relatorio-frequencia-${filters.start_date}_${filters.end_date}.xlsx`);
    toast.success("Excel exportado");
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["data", "curso", "turma", "aluno", "status"],
      ...data.records.map((r) => [r.date, r.course_name, r.class_name, r.student_name, r.status]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-frequencia-${filters.start_date}_${filters.end_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const exportPDF = async () => {
    if (!data) return;
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SwaliClass — Relatório de Frequência", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Período: ${periodLabel}`, 14, 26);
    doc.text(
      `Sessões: ${data.totals.sessions}  •  Alunos: ${data.totals.students}  •  Frequência média: ${data.totals.rate}%`,
      14,
      32,
    );

    autoTable(doc, {
      startY: 40,
      head: [["Aluno", "Presenças", "Faltas", "Atrasos", "Just.", "Freq. %"]],
      body: data.byStudent.map((s) => [
        s.name,
        s.present,
        s.absent,
        s.late,
        s.justified,
        `${s.rate}%`,
      ]),
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Por turma", 14, y1);
    autoTable(doc, {
      startY: y1 + 4,
      head: [["Turma", "Sessões", "Presenças", "Faltas", "Freq. %"]],
      body: data.byClass.map((s) => [s.name, s.total, s.present, s.absent, `${s.rate}%`]),
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    const y2 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.text("Por curso", 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [["Curso", "Sessões", "Presenças", "Faltas", "Freq. %"]],
      body: data.byCourse.map((s) => [s.name, s.total, s.present, s.absent, `${s.rate}%`]),
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    doc.save(`relatorio-frequencia-${filters.start_date}_${filters.end_date}.pdf`);
    toast.success("PDF exportado");
  };

  const setPreset = (n: number) =>
    setFilters((f) => ({ ...f, start_date: daysAgoISO(n), end_date: todayISO() }));

  // ===== Grades exports =====
  const gradeRows = () =>
    (grades?.records ?? []).map((r: any) => ({
      Prazo: String(r.due_at).slice(0, 10),
      Curso: r.course_name,
      Turma: r.class_name,
      Aluno: r.student_name,
      Atividade: r.activity_title,
      Status: r.status,
      Nota: r.grade ?? "",
      Máx: r.max_grade,
      "%": r.percent ?? "",
    }));

  const exportGradesExcel = async () => {
    if (!grades) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Relatório de Notas"],
        ["Período", periodLabel],
        ["Atividades", grades.totals.activities],
        ["Alunos", grades.totals.students],
        ["Corrigidas", grades.totals.graded],
        ["Entregues", grades.totals.delivered],
        ["Pendentes", grades.totals.pending],
        ["Média geral", `${grades.totals.average}%`],
      ]),
      "Resumo",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        grades.byStudent.map((s: any) => ({
          Aluno: s.name,
          Corrigidas: s.graded,
          Entregues: s.delivered,
          Pendentes: s.pending,
          "Média %": s.average,
        })),
      ),
      "Por aluno",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        grades.byClass.map((s: any) => ({
          Turma: s.name,
          Corrigidas: s.graded,
          Entregues: s.delivered,
          Pendentes: s.pending,
          "Média %": s.average,
        })),
      ),
      "Por turma",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        grades.byActivity.map((s: any) => ({
          Atividade: s.name,
          Corrigidas: s.graded,
          Entregues: s.delivered,
          Pendentes: s.pending,
          "Média %": s.average,
        })),
      ),
      "Por atividade",
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gradeRows()), "Detalhado");
    XLSX.writeFile(wb, `relatorio-notas-${filters.start_date}_${filters.end_date}.xlsx`);
    toast.success("Excel exportado");
  };

  const exportGradesCSV = () => {
    if (!grades) return;
    const rows = gradeRows();
    const head = [
      "prazo",
      "curso",
      "turma",
      "aluno",
      "atividade",
      "status",
      "nota",
      "max",
      "percentual",
    ];
    const csv = [head, ...rows.map((r) => Object.values(r))]
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-notas-${filters.start_date}_${filters.end_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const exportGradesPDF = async () => {
    if (!grades) return;
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SwaliClass — Relatório de Notas", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Período: ${periodLabel}`, 14, 26);
    doc.text(
      `Atividades: ${grades.totals.activities}  •  Alunos: ${grades.totals.students}  •  Média geral: ${grades.totals.average}%`,
      14,
      32,
    );
    autoTable(doc, {
      startY: 40,
      head: [["Aluno", "Corrigidas", "Entregues", "Pendentes", "Média %"]],
      body: grades.byStudent.map((s: any) => [
        s.name,
        s.graded,
        s.delivered,
        s.pending,
        `${s.average}%`,
      ]),
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });
    const y1 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Por turma", 14, y1);
    autoTable(doc, {
      startY: y1 + 4,
      head: [["Turma", "Corrigidas", "Pendentes", "Média %"]],
      body: grades.byClass.map((s: any) => [s.name, s.graded, s.pending, `${s.average}%`]),
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });
    doc.save(`relatorio-notas-${filters.start_date}_${filters.end_date}.pdf`);
    toast.success("PDF exportado");
  };

  const isGrades = reportType === "grades";
  const canExport = isGrades ? !!grades : !!data;
  const doPDF = isGrades ? exportGradesPDF : exportPDF;
  const doExcel = isGrades ? exportGradesExcel : exportExcel;
  const doCSV = isGrades ? exportGradesCSV : exportCSV;

  const selectedStudent = (studentsQ.data ?? []).find(
    (s: any) => s.id === filters.student_id,
  ) as any;
  const boletimRecords = ((grades?.records ?? []) as any[]).filter(
    (r) => r.student_id === filters.student_id,
  );
  const canBoletim = isGrades && !!filters.student_id && !!grades;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Relatórios</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">
            {isGrades ? "Notas consolidadas" : "Frequência consolidada"} — exporte em PDF, Excel ou
            CSV
          </p>
        </div>
        <div className="flex gap-2">
          {isGrades && (
            <button
              onClick={() => {
                if (!filters.student_id) {
                  toast.info("Selecione um aluno para emitir o boletim.");
                  return;
                }
                setBoletimOpen(true);
              }}
              disabled={!grades}
              className="inline-flex items-center gap-2 px-4 h-10 bg-white border border-border-subtle rounded-sm font-semibold text-xs hover:bg-surface disabled:opacity-40"
            >
              <Printer className="size-3.5" /> Boletim
            </button>
          )}
          <button
            onClick={doPDF}
            disabled={!canExport}
            className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-semibold text-xs hover:bg-navy-800 disabled:opacity-40"
          >
            <FileText className="size-3.5" /> PDF
          </button>
          <button
            onClick={doExcel}
            disabled={!canExport}
            className="inline-flex items-center gap-2 px-4 h-10 bg-white border border-border-subtle rounded-sm font-semibold text-xs hover:bg-surface disabled:opacity-40"
          >
            <FileSpreadsheet className="size-3.5" /> Excel
          </button>
          <button
            onClick={doCSV}
            disabled={!canExport}
            className="inline-flex items-center gap-2 px-4 h-10 bg-white border border-border-subtle rounded-sm font-semibold text-xs hover:bg-surface disabled:opacity-40"
          >
            <Download className="size-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Report type switch */}
      <div className="inline-flex bg-white border border-border-subtle rounded-sm p-1 gap-1">
        {(
          [
            ["attendance", "Frequência"],
            ["grades", "Notas"],
          ] as [ReportType, string][]
        ).map(([id, lb]) => (
          <button
            key={id}
            onClick={() => setReportType(id)}
            className={`px-4 h-8 text-xs font-semibold rounded-sm ${reportType === id ? "bg-navy-900 text-paper" : "text-navy-800/60 hover:bg-surface"}`}
          >
            {lb}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-border-subtle rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-navy-800/60">
          <Filter className="size-3.5" /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-navy-800/50 font-mono">
              De
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
              className="w-full h-9 px-2 border border-border-subtle rounded-sm text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-navy-800/50 font-mono">
              Até
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
              className="w-full h-9 px-2 border border-border-subtle rounded-sm text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-navy-800/50 font-mono">
              Curso
            </label>
            <select
              value={filters.course_id}
              onChange={(e) =>
                setFilters((f) => ({ ...f, course_id: e.target.value, class_id: "" }))
              }
              className="w-full h-9 px-2 border border-border-subtle rounded-sm text-sm bg-white"
            >
              <option value="">Todos</option>
              {(coursesQ.data ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-navy-800/50 font-mono">
              Turma
            </label>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters((f) => ({ ...f, class_id: e.target.value }))}
              className="w-full h-9 px-2 border border-border-subtle rounded-sm text-sm bg-white"
            >
              <option value="">Todas</option>
              {filteredClasses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-navy-800/50 font-mono">
              Aluno
            </label>
            <select
              value={filters.student_id}
              onChange={(e) => setFilters((f) => ({ ...f, student_id: e.target.value }))}
              className="w-full h-9 px-2 border border-border-subtle rounded-sm text-sm bg-white"
            >
              <option value="">Todos</option>
              {(studentsQ.data ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[7, 30, 90, 180].map((n) => (
            <button
              key={n}
              onClick={() => setPreset(n)}
              className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-border-subtle rounded-sm hover:bg-surface"
            >
              Últimos {n}d
            </button>
          ))}
          <button
            onClick={() =>
              setFilters({
                start_date: daysAgoISO(30),
                end_date: todayISO(),
                course_id: "",
                class_id: "",
                student_id: "",
              })
            }
            className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-border-subtle rounded-sm hover:bg-surface"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* KPIs */}
      {(isGrades ? gradesQ.isLoading : reportQ.isLoading) && (
        <p className="text-sm text-navy-800/40">
          <Loader2 className="inline size-4 animate-spin" /> Carregando…
        </p>
      )}
      {!isGrades && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi label="Sessões" value={data.totals.sessions} />
            <Kpi label="Alunos" value={data.totals.students} />
            <Kpi label="Presenças" value={data.totals.present} accent="text-emerald-700" />
            <Kpi label="Faltas" value={data.totals.absent} accent="text-red-700" />
            <Kpi label="Freq. média" value={`${data.totals.rate}%`} accent="text-navy-900" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border-subtle">
            {(
              [
                ["overview", "Visão geral"],
                ["byStudent", "Por aluno"],
                ["byClass", "Por turma"],
                ["byCourse", "Por curso"],
                ["detailed", "Detalhado"],
              ] as [Tab, string][]
            ).map(([id, lb]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 h-9 text-xs font-semibold border-b-2 -mb-px ${tab === id ? "border-navy-900 text-navy-900" : "border-transparent text-navy-800/50 hover:text-navy-900"}`}
              >
                {lb}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Top turmas (frequência)">
                <SimpleTable
                  head={["Turma", "Sessões", "Freq."]}
                  rows={data.byClass.slice(0, 8).map((s) => [s.name, s.total, `${s.rate}%`])}
                />
              </Card>
              <Card title="Alunos com baixa frequência">
                <SimpleTable
                  head={["Aluno", "Sessões", "Freq."]}
                  rows={data.byStudent
                    .filter((s) => s.total >= 3 && s.rate < 75)
                    .slice(0, 8)
                    .map((s) => [s.name, s.total, `${s.rate}%`])}
                  empty="Nenhum aluno abaixo de 75%."
                />
              </Card>
            </div>
          )}

          {tab === "byStudent" && (
            <Card title={`Por aluno (${data.byStudent.length})`}>
              <SimpleTable
                head={["Aluno", "Pres.", "Falt.", "Atr.", "Just.", "Total", "Freq."]}
                rows={data.byStudent.map((s) => [
                  s.name,
                  s.present,
                  s.absent,
                  s.late,
                  s.justified,
                  s.total,
                  `${s.rate}%`,
                ])}
              />
            </Card>
          )}
          {tab === "byClass" && (
            <Card title={`Por turma (${data.byClass.length})`}>
              <SimpleTable
                head={["Turma", "Pres.", "Falt.", "Atr.", "Just.", "Total", "Freq."]}
                rows={data.byClass.map((s) => [
                  s.name,
                  s.present,
                  s.absent,
                  s.late,
                  s.justified,
                  s.total,
                  `${s.rate}%`,
                ])}
              />
            </Card>
          )}
          {tab === "byCourse" && (
            <Card title={`Por curso (${data.byCourse.length})`}>
              <SimpleTable
                head={["Curso", "Pres.", "Falt.", "Atr.", "Just.", "Total", "Freq."]}
                rows={data.byCourse.map((s) => [
                  s.name,
                  s.present,
                  s.absent,
                  s.late,
                  s.justified,
                  s.total,
                  `${s.rate}%`,
                ])}
              />
            </Card>
          )}
          {tab === "detailed" && (
            <Card title={`Registros detalhados (${data.records.length})`}>
              <SimpleTable
                head={["Data", "Curso", "Turma", "Aluno", "Status"]}
                rows={data.records
                  .slice(0, 500)
                  .map((r) => [r.date, r.course_name, r.class_name, r.student_name, r.status])}
              />
              {data.records.length > 500 && (
                <p className="text-[11px] text-navy-800/50 mt-2 font-mono">
                  Exibindo primeiros 500. Exporte para ver todos.
                </p>
              )}
            </Card>
          )}
        </>
      )}

      {isGrades && grades && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi label="Atividades" value={grades.totals.activities} />
            <Kpi label="Alunos" value={grades.totals.students} />
            <Kpi label="Corrigidas" value={grades.totals.graded} accent="text-emerald-700" />
            <Kpi label="Pendentes" value={grades.totals.pending} accent="text-amber-700" />
            <Kpi label="Média geral" value={`${grades.totals.average}%`} accent="text-navy-900" />
          </div>

          <div className="flex gap-1 border-b border-border-subtle">
            {(
              [
                ["byStudent", "Por aluno"],
                ["byClass", "Por turma"],
                ["byActivity", "Por atividade"],
                ["detailed", "Detalhado"],
              ] as [GradeTab, string][]
            ).map(([id, lb]) => (
              <button
                key={id}
                onClick={() => setGradeTab(id)}
                className={`px-3 h-9 text-xs font-semibold border-b-2 -mb-px ${gradeTab === id ? "border-navy-900 text-navy-900" : "border-transparent text-navy-800/50 hover:text-navy-900"}`}
              >
                {lb}
              </button>
            ))}
          </div>

          {gradeTab === "byStudent" && (
            <Card title={`Por aluno (${grades.byStudent.length})`}>
              <SimpleTable
                head={["Aluno", "Corrigidas", "Entregues", "Pendentes", "Média"]}
                rows={grades.byStudent.map((s: any) => [
                  s.name,
                  s.graded,
                  s.delivered,
                  s.pending,
                  `${s.average}%`,
                ])}
              />
            </Card>
          )}
          {gradeTab === "byClass" && (
            <Card title={`Por turma (${grades.byClass.length})`}>
              <SimpleTable
                head={["Turma", "Corrigidas", "Entregues", "Pendentes", "Média"]}
                rows={grades.byClass.map((s: any) => [
                  s.name,
                  s.graded,
                  s.delivered,
                  s.pending,
                  `${s.average}%`,
                ])}
              />
            </Card>
          )}
          {gradeTab === "byActivity" && (
            <Card title={`Por atividade (${grades.byActivity.length})`}>
              <SimpleTable
                head={["Atividade", "Corrigidas", "Entregues", "Pendentes", "Média"]}
                rows={grades.byActivity.map((s: any) => [
                  s.name,
                  s.graded,
                  s.delivered,
                  s.pending,
                  `${s.average}%`,
                ])}
              />
            </Card>
          )}
          {gradeTab === "detailed" && (
            <Card title={`Notas lançadas (${grades.records.length})`}>
              <SimpleTable
                head={["Prazo", "Turma", "Aluno", "Atividade", "Status", "Nota"]}
                rows={grades.records
                  .slice(0, 500)
                  .map((r: any) => [
                    String(r.due_at).slice(0, 10),
                    r.class_name,
                    r.student_name,
                    r.activity_title,
                    r.status,
                    r.grade === null ? "—" : `${r.grade} / ${r.max_grade}`,
                  ])}
              />
              {grades.records.length > 500 && (
                <p className="text-[11px] text-navy-800/50 mt-2 font-mono">
                  Exibindo primeiros 500. Exporte para ver todos.
                </p>
              )}
            </Card>
          )}
        </>
      )}

      {boletimOpen && canBoletim && (
        <BoletimPrint
          records={boletimRecords}
          studentName={selectedStudent?.full_name ?? boletimRecords[0]?.student_name ?? "Aluno"}
          periodLabel={periodLabel}
          tenantName={sessionQ.data?.tenantName ?? "SwaliClass"}
          onClose={() => setBoletimOpen(false)}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div className="bg-white border border-border-subtle rounded-lg p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50">{label}</p>
      <p className={`text-2xl font-display font-extrabold mt-1 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border-subtle rounded-lg p-5">
      <h3 className="font-display font-bold text-lg mb-3">{title}</h3>
      {children}
    </div>
  );
}

function SimpleTable({ head, rows, empty }: { head: string[]; rows: any[][]; empty?: string }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-navy-800/40 py-6 text-center">
        {empty ?? "Sem dados no período."}
      </p>
    );
  }
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-navy-800/50 border-b border-border-subtle">
            {head.map((h) => (
              <th key={h} className="py-2 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border-subtle/60 last:border-0">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
