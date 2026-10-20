import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Nova senha — BitraHub" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-surface p-6">
      <div className="w-full max-w-md bg-white border border-border-subtle rounded-lg p-8">
        <h1 className="font-display text-2xl font-bold text-navy-900">Definir nova senha</h1>
        <p className="mt-2 text-sm text-navy-800/60">Digite a nova senha da sua conta.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            required
            minLength={8}
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3 bg-surface border border-border-subtle rounded-md text-sm focus:outline-none focus:border-navy-900"
          />
          {error && (
            <p className="text-xs bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="w-full h-11 bg-navy-900 text-paper rounded-md font-semibold text-sm hover:bg-navy-800 disabled:opacity-50"
          >
            {loading ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
