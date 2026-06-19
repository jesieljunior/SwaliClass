import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, TrendingUp } from "lucide-react";
import { mockActivities, CURRENT_STUDENT_ID, CURRENT_STUDENT_NAME } from "@/lib/mock-activities";

export const Route = createFileRoute("/_authenticated/app/notas")({
  head: () => ({ meta: [{ title: "Notas — BitraHub" }, { name: "robots", content: "noindex" }] }),
  component: NotasPage,
});

function NotasPage() {
  const graded = mockActivities
    .map(a => {
      const s = a.submissions.find(s => s.studentId === CURRENT_STUDENT_ID && s.status === "corrigida");
      return s ? { a, s } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const avg = graded.length
    ? (graded.reduce((sum, g) => sum + (g.s.grade || 0), 0) / graded.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-navy-800/40">Olá, {CURRENT_STUDENT_NAME.split(" ")[0]}</p>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">Minhas notas</h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-navy-900 text-paper p-6 flex items-center gap-4"
      >
        <div className="size-14 rounded-2xl bg-paper/10 grid place-items-center">
          <TrendingUp className="size-6" />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-paper/50">Média geral</p>
          <p className="text-4xl font-display font-extrabold">{avg}</p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {graded.length === 0 && (
          <div className="bg-white border border-border-subtle rounded-2xl p-8 text-center text-sm text-navy-800/60">
            Você ainda não tem atividades corrigidas.
          </div>
        )}
        {graded.map(({ a, s }, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white border border-border-subtle rounded-2xl p-4 flex items-center gap-3 shadow-sm"
          >
            <div className="size-11 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
              <Award className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold truncate">{a.title}</p>
              <p className="text-xs text-navy-800/60 truncate">{a.type === "turma" ? a.className : "Aula particular"}</p>
            </div>
            <span className="text-2xl font-display font-extrabold text-emerald-700 shrink-0">{s.grade?.toFixed(1)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}