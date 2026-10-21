import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — SwaliClass" },
      { name: "description", content: "Acesse sua conta SwaliClass." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setInfo("Conta criada. Você já pode entrar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Se o e-mail existir, enviamos um link de recuperação.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <aside className="hidden lg:flex flex-col justify-between bg-navy-900 text-paper p-12">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-10 bg-navy-600 rounded-md grid place-items-center font-display font-extrabold">
            S
          </div>
          <div>
            <p className="font-display font-bold tracking-wide">SWALICLASS</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-paper/40">
              Gestão Acadêmica & IA
            </p>
          </div>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Gestão acadêmica
            <br />
            com precisão editorial.
          </h2>
          <p className="mt-4 text-paper/60 max-w-md">
            Chamada em segundos, frequência calculada em tempo real, relatórios prontos para
            auditoria e inteligência pedagógica.
          </p>
        </div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-paper/30">
          © {new Date().getFullYear()} SwaliClass · Por Jesiel Amaro Junior
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-8 bg-navy-900 rounded-md grid place-items-center text-paper font-display font-extrabold">
              S
            </div>
            <span className="font-display font-bold">SwaliClass</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-navy-900">
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </h1>
          <p className="mt-2 text-sm text-navy-800/60">
            {mode === "login"
              ? "Acesse o painel da sua instituição."
              : mode === "signup"
                ? "Crie a conta inicial de administrador da plataforma."
                : "Enviaremos um link de recuperação por e-mail."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-navy-800/60 mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:border-navy-900"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-navy-800/60 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:border-navy-900"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-navy-800/60 mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:border-navy-900"
                />
              </div>
            )}

            {error && (
              <p className="text-xs bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                {error}
              </p>
            )}
            {info && (
              <p className="text-xs bg-green-50 border border-green-200 text-green-700 p-3 rounded-md">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-navy-900 text-paper rounded-md font-semibold text-sm hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {loading
                ? "Aguarde…"
                : mode === "login"
                  ? "Entrar"
                  : mode === "signup"
                    ? "Criar conta"
                    : "Enviar link"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs">
            {mode === "login" ? (
              <>
                <button
                  onClick={() => setMode("forgot")}
                  className="text-navy-800/60 hover:text-navy-900"
                >
                  Esqueci a senha
                </button>
                <button onClick={() => setMode("signup")} className="text-navy-900 font-semibold">
                  Criar conta →
                </button>
              </>
            ) : (
              <button onClick={() => setMode("login")} className="text-navy-900 font-semibold">
                ← Voltar para entrar
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
