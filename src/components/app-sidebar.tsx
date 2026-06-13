import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Building2,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/chamada", label: "Chamada", icon: ClipboardCheck },
  { to: "/app/alunos", label: "Alunos", icon: Users },
  { to: "/app/turmas", label: "Turmas", icon: GraduationCap },
  { to: "/app/cursos", label: "Cursos", icon: BookOpen },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
];

const admin: { to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/app/clientes", label: "Clientes (SaaS)", icon: Building2 },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user, roles, fullName } = useAuth();
  const isSuper = roles.includes("super_admin");
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-navy-900 text-paper flex-col">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/5">
        <div className="size-9 bg-navy-600 rounded-md flex items-center justify-center font-display font-extrabold text-paper">B</div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm tracking-wide truncate">COLÉGIO ALPHA</p>
          <p className="text-[10px] font-mono uppercase text-paper/40 tracking-widest">Tenant ativo</p>
        </div>
      </div>

      <nav className="px-3 py-5 space-y-0.5">
        <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-paper/30">Operação</p>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to as never}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active ? "bg-paper/10 text-paper font-semibold" : "text-paper/55 hover:text-paper hover:bg-paper/5"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {isSuper && (
          <>
            <p className="px-3 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-paper/30">Super Admin</p>
            {admin.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to as never}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active ? "bg-paper/10 text-paper font-semibold" : "text-paper/55 hover:text-paper hover:bg-paper/5"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
            })}
          </>
        )}
      </nav>

      <div className="mt-auto p-4">
        <div className="p-3 bg-navy-800 rounded-md border border-white/5">
          <p className="text-[10px] text-paper/40 font-mono uppercase tracking-wider truncate">
            {isSuper ? "Super Admin" : "Conta"}
          </p>
          <p className="text-xs text-paper font-semibold truncate mt-1">{fullName || user?.email || "—"}</p>
          <p className="text-[10px] text-paper/50 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-[11px] font-bold bg-paper text-navy-900 py-1.5 rounded-sm flex items-center justify-center gap-1.5 hover:bg-paper/90"
          >
            <LogOut className="size-3" /> Sair
          </button>
        </div>
      </div>
    </aside>
  );
}