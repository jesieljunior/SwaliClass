import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, GraduationCap, ClipboardCheck, BarChart3, FileText, Award, UserCircle2 } from "lucide-react";
import { useViewMode } from "@/lib/view-mode";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const teacherItems: NavItem[] = [
  { to: "/app", label: "Início", icon: LayoutDashboard, exact: true },
  { to: "/app/chamada", label: "Chamada", icon: ClipboardCheck },
  { to: "/app/atividades", label: "Atividades", icon: FileText },
  { to: "/app/turmas", label: "Turmas", icon: GraduationCap },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
];

const studentItems: NavItem[] = [
  { to: "/app", label: "Início", icon: LayoutDashboard, exact: true },
  { to: "/app/atividades", label: "Atividades", icon: FileText },
  { to: "/app/notas", label: "Notas", icon: Award },
  { to: "/app/perfil", label: "Perfil", icon: UserCircle2 },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { mode } = useViewMode();
  const items = mode === "teacher" ? teacherItems : studentItems;
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <nav
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-navy-900 text-paper border-t border-white/10 grid grid-cols-${items.length}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const active = isActive(it.to, it.exact);
        return (
          <Link
            key={it.to}
            to={it.to as never}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              active ? "text-paper" : "text-paper/45 hover:text-paper/80"
            }`}
          >
            <Icon className="size-5" />
            <span className="truncate max-w-full px-1">{it.label}</span>
            {active && <span className="absolute top-0 h-0.5 w-8 bg-paper rounded-full" />}
          </Link>
        );
      })}
    </nav>
  );
}