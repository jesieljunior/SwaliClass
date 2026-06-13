import { createFileRoute } from "@tanstack/react-router";
import { tenants } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/clientes")({
  component: ClientesPage,
});

const planColor: Record<string, string> = {
  Starter: "bg-navy-600/10 text-navy-600",
  Professional: "bg-emerald-100 text-emerald-700",
  Business: "bg-amber-100 text-amber-700",
  Enterprise: "bg-navy-900 text-paper",
};

function ClientesPage() {
  const ativos = tenants.filter((t) => t.status === "ativo").length;
  const totalAlunos = tenants.reduce((s, t) => s + t.students, 0);
  const mrr = tenants.filter((t) => t.status === "ativo").length * 350;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Clientes SaaS</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">Painel exclusivo Super Admin · Bitra Tech</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800">
          <Plus className="size-4" /> Novo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Clientes ativos" value={`${ativos} / ${tenants.length}`} />
        <Stat label="Alunos sob gestão" value={totalAlunos.toLocaleString("pt-BR")} />
        <Stat label="MRR estimado" value={`R$ ${mrr.toLocaleString("pt-BR")}`} accent />
      </div>

      <div className="bg-white border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border-subtle text-[10px] font-mono uppercase tracking-widest text-navy-800/50">
            <tr>
              <th className="text-left px-5 py-3 font-bold">Instituição</th>
              <th className="text-left px-5 py-3 font-bold">Plano</th>
              <th className="text-left px-5 py-3 font-bold hidden md:table-cell">Usuários</th>
              <th className="text-left px-5 py-3 font-bold hidden md:table-cell">Alunos</th>
              <th className="text-left px-5 py-3 font-bold hidden lg:table-cell">Vencimento</th>
              <th className="text-left px-5 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-surface/60">
                <td className="px-5 py-3 font-semibold">{t.name}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${planColor[t.plan]}`}>{t.plan}</span>
                </td>
                <td className="px-5 py-3 hidden md:table-cell font-mono tabular-nums">{t.users}</td>
                <td className="px-5 py-3 hidden md:table-cell font-mono tabular-nums">{t.students.toLocaleString("pt-BR")}</td>
                <td className="px-5 py-3 hidden lg:table-cell font-mono text-xs text-navy-800/60">{new Date(t.dueDate).toLocaleDateString("pt-BR")}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${t.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-5 rounded-lg border ${accent ? "bg-navy-900 border-navy-800 text-paper" : "bg-white border-border-subtle"}`}>
      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${accent ? "text-white/40" : "text-navy-600"}`}>{label}</span>
      <p className="text-3xl font-display font-extrabold mt-2">{value}</p>
    </div>
  );
}