import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, Search } from "lucide-react";

export const Route = createFileRoute("/app")({
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
  return (
    <div className="min-h-screen flex bg-surface text-navy-900">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar pathname={pathname} />
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Topbar({ pathname }: { pathname: string }) {
  return (
    <header className="h-16 border-b border-border-subtle bg-white/80 backdrop-blur-md px-4 lg:px-8 flex items-center gap-4">
      <Link to="/" className="lg:hidden flex items-center gap-2 shrink-0">
        <div className="size-8 bg-navy-900 rounded-sm flex items-center justify-center text-paper font-display font-extrabold">B</div>
        <span className="font-display font-bold">BitraHub</span>
      </Link>
      <div className="flex-1 min-w-0 hidden sm:flex items-center gap-2 max-w-md">
        <div className="flex-1 flex items-center gap-2 px-3 h-9 bg-surface border border-border-subtle rounded-md">
          <Search className="size-4 text-navy-800/40 shrink-0" />
          <input
            placeholder="Buscar alunos, turmas, cursos…"
            className="bg-transparent flex-1 min-w-0 text-sm outline-none placeholder:text-navy-800/40"
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/30 shrink-0">⌘K</span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3 shrink-0">
        <button className="size-9 rounded-md border border-border-subtle bg-white grid place-items-center text-navy-800/60 hover:text-navy-900">
          <Bell className="size-4" />
        </button>
        <div className="size-9 rounded-full bg-navy-900 text-paper grid place-items-center text-xs font-bold">JD</div>
      </div>
      <span className="sr-only">{pathname}</span>
    </header>
  );
}