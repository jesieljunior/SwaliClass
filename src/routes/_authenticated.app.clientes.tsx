import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Copy, Check, X, Loader2 } from "lucide-react";
import {
  listTenants,
  createTenant,
  listInvites,
  revokeInvite,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/app/clientes")({
  component: ClientesPage,
});

const planColor: Record<string, string> = {
  starter: "bg-navy-600/10 text-navy-600",
  professional: "bg-emerald-100 text-emerald-700",
  business: "bg-amber-100 text-amber-700",
  enterprise: "bg-navy-900 text-paper",
};
const statusColor: Record<string, string> = {
  trial: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-rose-100 text-rose-700",
  cancelled: "bg-zinc-200 text-zinc-700",
};
const inviteStatusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  revoked: "bg-zinc-200 text-zinc-700",
  expired: "bg-rose-100 text-rose-700",
};

function ClientesPage() {
  const fetchTenants = useServerFn(listTenants);
  const fetchInvites = useServerFn(listInvites);
  const qc = useQueryClient();

  const tenantsQ = useQuery({ queryKey: ["tenants"], queryFn: () => fetchTenants() });
  const invitesQ = useQuery({ queryKey: ["invites"], queryFn: () => fetchInvites() });

  const [open, setOpen] = useState(false);
  const [lastInvite, setLastInvite] = useState<{ url: string; email: string } | null>(null);

  const tenants = tenantsQ.data ?? [];
  const ativos = tenants.filter((t: any) => t.status === "active").length;
  const totalAlunos = tenants.reduce((s: number, t: any) => s + (t.student_count ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Clientes SaaS</h1>
          <p className="text-xs text-navy-800/40 font-mono uppercase mt-1 tracking-widest">
            Painel exclusivo Super Admin · Bitra Tech
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 h-10 bg-navy-900 text-paper rounded-sm font-bold text-sm hover:bg-navy-800"
        >
          <Plus className="size-4" /> Novo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Clientes ativos" value={`${ativos} / ${tenants.length}`} />
        <Stat label="Alunos sob gestão" value={totalAlunos.toLocaleString("pt-BR")} />
        <Stat label="Convites pendentes" value={String((invitesQ.data ?? []).filter((i: any) => i.status === "pending").length)} accent />
      </div>

      {lastInvite && (
        <InviteLinkBanner data={lastInvite} onClose={() => setLastInvite(null)} />
      )}

      <section>
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50 mb-2">Instituições</h2>
        <div className="bg-white border border-border-subtle rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border-subtle text-[10px] font-mono uppercase tracking-widest text-navy-800/50">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Instituição</th>
                <th className="text-left px-5 py-3 font-bold">Plano</th>
                <th className="text-left px-5 py-3 font-bold hidden md:table-cell">Usuários</th>
                <th className="text-left px-5 py-3 font-bold hidden md:table-cell">Alunos</th>
                <th className="text-left px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {tenantsQ.isLoading && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-800/40"><Loader2 className="inline size-4 animate-spin" /></td></tr>
              )}
              {!tenantsQ.isLoading && tenants.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-800/40 text-sm">Nenhum cliente ainda. Clique em "Novo cliente".</td></tr>
              )}
              {tenants.map((t: any) => (
                <tr key={t.id} className="hover:bg-surface/60">
                  <td className="px-5 py-3 font-semibold">{t.name}<div className="text-xs font-mono text-navy-800/40">{t.slug}</div></td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${planColor[t.plan]}`}>{t.plan}</span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell font-mono tabular-nums">{t.user_count}</td>
                  <td className="px-5 py-3 hidden md:table-cell font-mono tabular-nums">{(t.student_count ?? 0).toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${statusColor[t.status]}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50 mb-2">Convites</h2>
        <div className="bg-white border border-border-subtle rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border-subtle text-[10px] font-mono uppercase tracking-widest text-navy-800/50">
              <tr>
                <th className="text-left px-5 py-3 font-bold">E-mail</th>
                <th className="text-left px-5 py-3 font-bold hidden md:table-cell">Instituição</th>
                <th className="text-left px-5 py-3 font-bold">Status</th>
                <th className="text-left px-5 py-3 font-bold hidden lg:table-cell">Expira</th>
                <th className="text-right px-5 py-3 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(invitesQ.data ?? []).map((inv: any) => (
                <InviteRow key={inv.id} inv={inv} onChange={() => qc.invalidateQueries({ queryKey: ["invites"] })} />
              ))}
              {!invitesQ.isLoading && (invitesQ.data ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-navy-800/40 text-sm">Nenhum convite.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <NewTenantDialog
          onClose={() => setOpen(false)}
          onCreated={(token, email) => {
            setLastInvite({ url: `${window.location.origin}/accept-invite?token=${token}`, email });
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["tenants"] });
            qc.invalidateQueries({ queryKey: ["invites"] });
          }}
        />
      )}
    </div>
  );
}

function InviteRow({ inv, onChange }: { inv: any; onChange: () => void }) {
  const revoke = useServerFn(revokeInvite);
  const m = useMutation({ mutationFn: () => revoke({ data: { id: inv.id } }), onSuccess: onChange });
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/accept-invite?token=${inv.token}`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <tr className="hover:bg-surface/60">
      <td className="px-5 py-3">
        <div className="font-semibold">{inv.email}</div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-navy-800/40">{inv.role}</div>
      </td>
      <td className="px-5 py-3 hidden md:table-cell">{inv.tenants?.name ?? "—"}</td>
      <td className="px-5 py-3">
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${inviteStatusColor[inv.status]}`}>{inv.status}</span>
      </td>
      <td className="px-5 py-3 hidden lg:table-cell font-mono text-xs text-navy-800/60">{new Date(inv.expires_at).toLocaleDateString("pt-BR")}</td>
      <td className="px-5 py-3 text-right">
        {inv.status === "pending" && (
          <div className="inline-flex gap-2">
            <button onClick={copy} className="inline-flex items-center gap-1 px-2 h-8 text-xs border border-border-subtle rounded-sm hover:bg-surface">
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <button onClick={() => m.mutate()} disabled={m.isPending} className="inline-flex items-center gap-1 px-2 h-8 text-xs border border-rose-300 text-rose-700 rounded-sm hover:bg-rose-50">
              <X className="size-3" /> Revogar
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function NewTenantDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (token: string, email: string) => void }) {
  const create = useServerFn(createTenant);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<"starter" | "professional" | "business" | "enterprise">("starter");
  const [contactEmail, setContactEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const m = useMutation({
    mutationFn: () => create({ data: { name, plan, contact_email: contactEmail, admin_email: adminEmail } }),
    onSuccess: (r) => onCreated(r.invite_token, adminEmail),
  });

  return (
    <div className="fixed inset-0 z-50 bg-navy-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-paper w-full max-w-md rounded-lg border border-border-subtle p-6 shadow-xl">
        <h2 className="text-xl font-display font-extrabold mb-1">Nova instituição</h2>
        <p className="text-xs text-navy-800/50 mb-4">Cria o tenant e gera um convite para o admin inicial.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
          className="space-y-3"
        >
          <Field label="Nome">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 border border-border-subtle rounded-sm bg-white" />
          </Field>
          <Field label="Plano">
            <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className="w-full h-10 px-3 border border-border-subtle rounded-sm bg-white">
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
          <Field label="E-mail de contato">
            <input required type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full h-10 px-3 border border-border-subtle rounded-sm bg-white" />
          </Field>
          <Field label="E-mail do admin (convite)">
            <input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full h-10 px-3 border border-border-subtle rounded-sm bg-white" />
          </Field>
          {m.error && <p className="text-xs text-rose-700">{(m.error as Error).message}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 h-10 text-sm font-bold border border-border-subtle rounded-sm hover:bg-surface">Cancelar</button>
            <button disabled={m.isPending} className="px-4 h-10 text-sm font-bold bg-navy-900 text-paper rounded-sm hover:bg-navy-800 inline-flex items-center gap-2">
              {m.isPending && <Loader2 className="size-4 animate-spin" />} Criar e gerar convite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-navy-600 block mb-1">{label}</span>
      {children}
    </label>
  );
}

function InviteLinkBanner({ data, onClose }: { data: { url: string; email: string }; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-navy-900 text-paper border border-navy-800 rounded-lg p-4 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">Convite gerado para {data.email}</p>
        <code className="text-xs font-mono break-all">{data.url}</code>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(data.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="inline-flex items-center gap-1 px-3 h-9 text-xs font-bold bg-paper text-navy-900 rounded-sm hover:bg-white"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copiado" : "Copiar"}
      </button>
      <button onClick={onClose} className="text-white/60 hover:text-white"><X className="size-4" /></button>
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