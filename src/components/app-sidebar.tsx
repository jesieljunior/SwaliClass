import { useState, useEffect } from "react";
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
  FileText,
  UserCircle2,
  Sparkles,
  MessageSquare,
  Flame,
  Coins,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { usePermissions } from "@/core/rbac/use-permission";
import { useViewMode } from "@/lib/view-mode";
import { PERMISSIONS, type Permission } from "@/core/rbac/permissions";
import { creditsStore, type CreditBalances, type StudyStreak } from "@/lib/credits-store";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  require?: Permission;
  studentOnly?: boolean;
  badge?: string;
};

// Staff / School navigation
const staffNav: NavItem[] = [
  {
    to: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
    require: PERMISSIONS.CLASS_VIEW,
  },
  {
    to: "/app/chamada",
    label: "Chamada",
    icon: ClipboardCheck,
    require: PERMISSIONS.ATTENDANCE_TAKE,
  },
  { to: "/app/atividades", label: "Atividades", icon: FileText },
  { to: "/app/alunos", label: "Alunos", icon: Users, require: PERMISSIONS.STUDENT_MANAGE },
  { to: "/app/turmas", label: "Turmas", icon: GraduationCap, require: PERMISSIONS.CLASS_VIEW },
  { to: "/app/cursos", label: "Cursos", icon: BookOpen, require: PERMISSIONS.CLASS_MANAGE },
  {
    to: "/app/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    require: PERMISSIONS.REPORTS_VIEW,
  },
  {
    to: "/app/ia",
    label: "Swali AI",
    icon: Sparkles,
    badge: "IA",
  },
  {
    to: "/app/biblioteca",
    label: "Biblioteca",
    icon: BookOpen,
  },
  {
    to: "/app/comunidade",
    label: "Comunidade",
    icon: MessageSquare,
  },
  {
    to: "/app/cobranca",
    label: "Planos & Cobrança",
    icon: CreditCard,
  },
];

// Student Solo / Autônomo navigation (no teacher, no classes, focused on self-study & AI)
const studentSoloNav: NavItem[] = [
  {
    to: "/app",
    label: "Meu Espaço",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/app/ia",
    label: "Swali AI",
    icon: Sparkles,
    badge: "IA",
  },
  {
    to: "/app/biblioteca",
    label: "Biblioteca",
    icon: BookOpen,
  },
  {
    to: "/app/comunidade",
    label: "Comunidade",
    icon: MessageSquare,
  },
  {
    to: "/app/portal",
    label: "Meu Desempenho",
    icon: UserCircle2,
  },
  {
    to: "/app/cobranca",
    label: "Planos & Créditos",
    icon: CreditCard,
    badge: "PRO",
  },
];

const admin: { to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/app/clientes", label: "Clientes (SaaS)", icon: Building2 },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user, roles, fullName } = useAuth();
  const session = useSession();
  const { mode } = useViewMode();
  const tenantName = session.data?.tenantName?.trim() || "SwaliClass";
  const isSuper = roles.includes("super_admin");
  const { can, roles: sessionRoles } = usePermissions();
  const isStudent = sessionRoles.includes("aluno") || !!session.data?.isAluno;
  const isStudentView = isStudent || mode === "student";

  const [balances, setBalances] = useState<CreditBalances>({
    planCredits: 0,
    contributionCredits: 0,
    purchasedCredits: 0,
    total: 0,
  });
  const [streak, setStreak] = useState<StudyStreak>({
    currentDays: 0,
    longestDays: 0,
    lastStudyDate: "",
    activeToday: false,
  });

  useEffect(() => {
    setBalances(creditsStore.getBalances());
    setStreak(creditsStore.getStreak());

    const onUpdate = () => {
      setBalances(creditsStore.getBalances());
      setStreak(creditsStore.getStreak());
    };
    window.addEventListener("swali_credits_updated", onUpdate);
    return () => window.removeEventListener("swali_credits_updated", onUpdate);
  }, []);

  const visibleNav = isStudentView
    ? studentSoloNav
    : staffNav.filter((item) => {
        if (item.require) return can(item.require);
        return true;
      });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-navy-900 text-paper flex-col">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/5">
        <div className="size-9 bg-navy-600 rounded-md flex items-center justify-center font-display font-extrabold text-paper shadow-sm">
          S
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm tracking-wide truncate">
            {isStudentView ? "Meu Espaço de Estudos" : tenantName}
          </p>
          <p className="text-[10px] font-mono uppercase text-paper/40 tracking-widest truncate">
            {isStudentView ? "Estudante Autônomo" : "Tenant ativo"}
          </p>
        </div>
      </div>

      {/* Gamification Streak & Credits Bar */}
      <div className="px-4 py-2.5 mx-3 mt-3 bg-white/[0.04] rounded-lg border border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5" title="Sequência de estudos contínua">
          <Flame
            className={`size-3.5 ${streak.currentDays > 0 ? "text-amber-400" : "text-paper/30"}`}
          />
          <span className="font-mono text-[11px] font-bold text-paper">
            {streak.currentDays} {streak.currentDays === 1 ? "dia" : "dias"}
          </span>
        </div>
        <Link
          to="/app/cobranca"
          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
          title="Recarregar créditos via InfinitePay Pix ou Cartão"
        >
          <Coins className="size-3.5 text-amber-400" />
          <span className="font-mono text-[11px] font-bold text-paper/90">
            {balances.total} <span className="text-[10px] text-paper/50">créd.</span>
          </span>
          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-400/10 px-1 rounded">
            +
          </span>
        </Link>
      </div>

      <nav className="px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-paper/30">
          {isStudentView ? "Estudos & IA" : "Operação"}
        </p>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to as never}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-paper/10 text-paper font-semibold"
                  : "text-paper/55 hover:text-paper hover:bg-paper/5"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {!isStudentView && isSuper && (
          <>
            <p className="px-3 pt-6 pb-2 text-[10px] font-mono uppercase tracking-widest text-paper/30">
              Super Admin
            </p>
            {admin.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-paper/10 text-paper font-semibold"
                      : "text-paper/55 hover:text-paper hover:bg-paper/5"
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
            {isStudentView ? "Estudante Individual" : isSuper ? "Super Admin" : "Conta"}
          </p>
          <p className="text-xs text-paper font-semibold truncate mt-1">
            {fullName || user?.email || (isStudentView ? "Lucas Silva" : "—")}
          </p>
          <p className="text-[10px] text-paper/50 truncate">
            {user?.email || (isStudentView ? "estudante@swaliclass.com" : "")}
          </p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-[11px] font-bold bg-paper text-navy-900 py-1.5 rounded-sm flex items-center justify-center gap-1.5 hover:bg-paper/90 cursor-pointer"
          >
            <LogOut className="size-3" /> Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
