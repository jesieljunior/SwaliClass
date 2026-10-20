import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { getInviteByToken, acceptInvite } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/accept-invite")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [{ title: "Aceitar convite — BitraHub" }, { name: "robots", content: "noindex" }],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const fetchInvite = useServerFn(getInviteByToken);
  const accept = useServerFn(acceptInvite);

  const q = useQuery({
    queryKey: ["invite", token],
    queryFn: () => fetchInvite({ data: { token: token! } }),
    enabled: !!token,
  });

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const m = useMutation({
    mutationFn: () => accept({ data: { token: token!, password, full_name: fullName } }),
    onSuccess: async (r) => {
      await supabase.auth.signInWithPassword({ email: r.email, password });
      navigate({ to: "/app" });
    },
  });

  if (!token)
    return (
      <Centered>
        <p className="text-rose-700">Token ausente.</p>
      </Centered>
    );
  if (q.isLoading)
    return (
      <Centered>
        <Loader2 className="size-5 animate-spin" />
      </Centered>
    );
  if (!q.data?.ok) {
    const reasons: Record<string, string> = {
      not_found: "Convite não encontrado.",
      accepted: "Este convite já foi aceito.",
      revoked: "Este convite foi revogado.",
      expired: "Este convite expirou.",
    };
    return (
      <Centered>
        <p className="text-rose-700">{reasons[q.data?.reason as string] ?? "Convite inválido."}</p>
      </Centered>
    );
  }

  const invite = q.data.invite;

  return (
    <Centered>
      <div className="w-full max-w-md bg-white border border-border-subtle rounded-lg p-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-navy-600 mb-2">
          BitraHub · Convite
        </p>
        <h1 className="text-2xl font-display font-extrabold mb-1">
          Bem-vindo a {invite.tenants?.name ?? "sua instituição"}
        </h1>
        <p className="text-sm text-navy-800/60 mb-6">
          Configure sua senha para acessar como <strong>{invite.role}</strong>.
        </p>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <Field label="E-mail">
            <input
              disabled
              value={invite.email}
              className="w-full h-10 px-3 border border-border-subtle rounded-sm bg-surface"
            />
          </Field>
          <Field label="Nome completo">
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 px-3 border border-border-subtle rounded-sm bg-white"
            />
          </Field>
          <Field label="Senha (mín. 8 caracteres)">
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 border border-border-subtle rounded-sm bg-white"
            />
          </Field>
          {m.error && <p className="text-xs text-rose-700">{(m.error as Error).message}</p>}
          <button
            disabled={m.isPending}
            className="w-full h-11 bg-navy-900 text-paper font-bold rounded-sm hover:bg-navy-800 inline-flex items-center justify-center gap-2"
          >
            {m.isPending && <Loader2 className="size-4 animate-spin" />} Aceitar e entrar
          </button>
        </form>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">{children}</div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-navy-600 block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
