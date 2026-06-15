import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, AlertTriangle, Loader2 } from "lucide-react";
import { getDashboardStats } from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchStats() });
  const stats = q.data;
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Visão geral</h1>
        <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">{today}</p>
      </div>

      {q.isLoading && <p className="text-navy-800/40"><Loader2 className="inline size-5 animate-spin" /></p>}

      {stats && (
      <div className="grid grid-cols-12 gap-4">
        <KpiCard label="Total alunos" value={stats.totalStudents.toString()} />
        <KpiCard label="Turmas" value={stats.totalClasses.toString()} />
        <KpiCard label="Cursos" value={stats.totalCourses.toString()} />
        <KpiCard label="Freq. média (30d)" value={`${stats.avgAttendance}%`} accent="emerald" />
        <KpiCard label="Chamadas (7d)" value={stats.sessionsThisWeek.toString()} />
        <KpiCard label="Baixa frequência" value={stats.lowFreq.length.toString()} dark />

        <div className="col-span-12 lg:col-span-8 bg-white border border-border-subtle rounded-lg p-6">
          <div className="flex justify-between items-end mb-6 gap-3 flex-wrap">
            <div>
              <h3 className="font-display font-bold text-lg">Frequência semanal</h3>
              <p className="text-xs text-navy-800/50">Últimos 7 dias · % de presença</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <ArrowUpRight className="size-3.5" /> {stats.avgAttendance}%
            </span>
          </div>
          <WeeklyChart data={stats.weekly} />
        </div>

        <div className="col-span-12 lg:col-span-4 bg-navy-900 text-paper rounded-lg p-6 flex flex-col">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <AlertTriangle className="size-4" /> Alunos em alerta
          </h3>
          <p className="text-xs text-paper/50 mb-4">Frequência abaixo de 75%</p>
          <div className="space-y-2 flex-1">
            {stats.lowFreq.length === 0 && <p className="text-xs text-paper/40">Sem alertas. 👍</p>}
            {stats.lowFreq.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-sm">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.full_name}</p>
                </div>
                <span className="text-sm font-bold shrink-0">{s.attendance}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, dark, accent }: { label: string; value: string; dark?: boolean; accent?: "emerald" }) {
  const base = dark
    ? "bg-navy-900 border-navy-800 text-paper"
    : "bg-white border-border-subtle";
  const valueClass = accent === "emerald" ? "text-emerald-600" : "";
  return (
    <div className={`col-span-6 md:col-span-4 lg:col-span-2 p-5 border rounded-lg flex flex-col justify-between gap-3 ${base}`}>
      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${dark ? "text-white/40" : "text-navy-600"}`}>
        {label}
      </span>
      <span className={`text-3xl font-display font-extrabold ${valueClass}`}>{value}</span>
    </div>
  );
}

function WeeklyChart({ data }: { data: { day: string; value: number }[] }) {
  const max = 100;
  const w = 600;
  const h = 200;
  const points = data.map((d, i) => ({
    x: (i / Math.max(1, data.length - 1)) * w,
    y: h - (d.value / max) * h,
    ...d,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b6fa0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b6fa0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad)" />
      <path d={path} fill="none" stroke="#0f1b3d" strokeWidth="2.5" />
      {points.map((p) => (
        <g key={p.day}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0f1b3d" />
          <text x={p.x} y={h + 20} textAnchor="middle" fill="#1e3a5f" opacity="0.5" fontSize="11" fontFamily="JetBrains Mono">
            {p.day}
          </text>
        </g>
      ))}
    </svg>
  );
}