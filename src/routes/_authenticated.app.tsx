import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ViewModeProvider } from "@/lib/view-mode";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useSession } from "@/hooks/use-session";
import { Loader2 } from "lucide-react";
import { Bell, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "BitraHub — App" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const session = useSession();
  const isAluno = !!session.data?.isAluno && !session.data?.isStaff;

  // Routes an aluno can actually access
  const alunoAllowed = /^\/app(\/(portal|atividades|notas|perfil))?\/?$/;

  useEffect(() => {
    if (!session.data) return;
    if (isAluno && !alunoAllowed.test(pathname)) {
      navigate({ to: "/app/portal", replace: true });
    }
  }, [isAluno, pathname, session.data]);

  if (session.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-surface">
        <Loader2 className="size-6 animate-spin text-navy-800/40" />
      </div>
    );
  }

  return (
    <ViewModeProvider>
      <div className="min-h-screen flex bg-surface text-navy-900">
        {!isAluno && <AppSidebar />}
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar pathname={pathname} isAluno={isAluno} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            <Outlet />
          </main>
        </div>
        <MobileNav />
      </div>
    </ViewModeProvider>
  );
}

function Topbar({ pathname, isAluno }: { pathname: string; isAluno: boolean }) {
  return (
    <header className="h-16 border-b border-border-subtle bg-white/80 backdrop-blur-md px-4 lg:px-8 flex items-center gap-4">
      <Link to="/" className={`${isAluno ? "" : "lg:hidden"} flex items-center gap-2 shrink-0`}>
        <div className="size-8 bg-navy-900 rounded-sm flex items-center justify-center text-paper font-display font-extrabold">B</div>
        <span className="font-display font-bold">BitraHub</span>
      </Link>
      {!isAluno && <div className="flex-1 min-w-0 hidden sm:flex items-center gap-2 max-w-md">
        <div className="flex-1 flex items-center gap-2 px-3 h-9 bg-surface border border-border-subtle rounded-md">
          <Search className="size-4 text-navy-800/40 shrink-0" />
          <input
            placeholder="Buscar alunos, turmas, cursos…"
            className="bg-transparent flex-1 min-w-0 text-sm outline-none placeholder:text-navy-800/40"
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/30 shrink-0">⌘K</span>
        </div>
      </div>}
      <div className="ml-auto flex items-center gap-3 shrink-0">
        {!isAluno && <ViewModeToggle />}
        <button className="size-9 rounded-md border border-border-subtle bg-white grid place-items-center text-navy-800/60 hover:text-navy-900">
          <Bell className="size-4" />
        </button>
        <div className="size-9 rounded-full bg-navy-900 text-paper grid place-items-center text-xs font-bold">JD</div>
      </div>
      <span className="sr-only">{pathname}</span>
    </header>
  );
}