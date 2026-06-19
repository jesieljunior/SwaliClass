import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, ChevronRight, HelpCircle, LogOut, Settings } from "lucide-react";
import { CURRENT_STUDENT_NAME } from "@/lib/mock-activities";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — BitraHub" }, { name: "robots", content: "noindex" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-border-subtle p-6 flex items-center gap-4 shadow-sm"
      >
        <div className="size-16 rounded-2xl bg-navy-900 text-paper grid place-items-center font-display font-extrabold text-xl">
          {CURRENT_STUDENT_NAME.split(" ").map(p => p[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-widest text-navy-800/40">Aluno</p>
          <p className="font-display font-extrabold text-lg truncate">{CURRENT_STUDENT_NAME}</p>
          <p className="text-xs text-navy-800/60">9º Ano A</p>
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

      <button className="w-full bg-white border border-border-subtle rounded-2xl p-4 flex items-center justify-center gap-2 text-rose-600 font-semibold hover:bg-rose-50 transition-colors">
        <LogOut className="size-4" /> Sair da conta
      </button>
    </div>
  );
}