import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, ChevronRight, HelpCircle, LogOut, Settings } from "lucide-react";
import { usePreviewStudent } from "@/lib/preview-student";
import { listStudents } from "@/lib/tenant.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — BitraHub" }, { name: "robots", content: "noindex" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const navigate = useNavigate();
  const fetchStudents = useServerFn(listStudents);
  const students = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents() });
  const list = (students.data ?? []) as any[];
  const { studentId } = usePreviewStudent(list[0]?.id);
  const current = list.find((s) => s.id === studentId);
  const name = current?.full_name ?? "Aluno";
  const initials = name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-border-subtle p-6 flex items-center gap-4 shadow-sm"
      >
        <div className="size-16 rounded-2xl bg-navy-900 text-paper grid place-items-center font-display font-extrabold text-xl">
          {initials || "AL"}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-widest text-navy-800/40">Aluno</p>
          <p className="font-display font-extrabold text-lg truncate">{name}</p>
          {current?.class_names && <p className="text-xs text-navy-800/60 truncate">{current.class_names}</p>}
        </div>
      </motion.div>

      <div className="bg-white border border-border-subtle rounded-2xl divide-y divide-border-subtle overflow-hidden">
        {[
          { icon: Bell, label: "Notificações" },
          { icon: Settings, label: "Preferências" },
          { icon: HelpCircle, label: "Ajuda e suporte" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="w-full flex items-center gap-3 p-4 hover:bg-surface/60 transition-colors text-left">
            <div className="size-9 rounded-xl bg-surface grid place-items-center text-navy-800/70 shrink-0">
              <Icon className="size-4" />
            </div>
            <span className="flex-1 font-medium">{label}</span>
            <ChevronRight className="size-4 text-navy-800/40" />
          </button>
        ))}
      </div>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/auth", replace: true });
        }}
        className="w-full bg-white border border-border-subtle rounded-2xl p-4 flex items-center justify-center gap-2 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
      >
        <LogOut className="size-4" /> Sair da conta
      </button>
    </div>
  );
}