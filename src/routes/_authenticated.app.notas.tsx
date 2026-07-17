import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Loader2, TrendingUp } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePreviewStudent } from "@/lib/preview-student";
import { listStudents } from "@/lib/tenant.functions";
import { listStudentGrades } from "@/lib/activities.functions";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/app/notas")({
  head: () => ({ meta: [{ title: "Notas — BitraHub" }, { name: "robots", content: "noindex" }] }),
  component: NotasPage,
});

function NotasPage() {
  const session = useSession();
  const isRealStudent = !!session.data?.isAluno && !session.data?.isStaff;
  const fetchStudents = useServerFn(listStudents);
  const students = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchStudents(),
    enabled: !isRealStudent,
  });
  const list = (students.data ?? []) as any[];
  const { studentId: previewId, setStudentId } = usePreviewStudent(list[0]?.id);
  const studentId = isRealStudent ? session.data?.student?.id : previewId;
  const current = isRealStudent
    ? session.data?.student
    : list.find((s) => s.id === studentId);

  const fetchGrades = useServerFn(listStudentGrades);
  const grades = useQuery({
    queryKey: ["grades", studentId],
    queryFn: () => fetchGrades({ data: { student_id: studentId! } }),
    enabled: !!studentId,
  });
  const graded = (grades.data ?? []) as any[];
  const avg = graded.length
    ? (graded.reduce((sum, g) => sum + (g.grade || 0), 0) / graded.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-navy-800/40">
            Olá{current ? `, ${current.full_name.split(" ")[0]}` : ""}
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">Minhas notas</h1>
        </div>
        {!isRealStudent && list.length > 0 && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 flex items-center gap-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-800">Prévia</div>
            <Select value={studentId ?? ""} onValueChange={setStudentId}>
              <SelectTrigger className="h-9 rounded-lg bg-white flex-1 max-w-xs"><SelectValue placeholder="Selecione aluno" /></SelectTrigger>
              <SelectContent>
                {list.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {!isRealStudent && list.length === 0 && (
        <div className="bg-white border border-border-subtle rounded-2xl p-8 text-center text-sm text-navy-800/60">
          Cadastre alunos para visualizar notas.
        </div>
      )}

      {studentId && (
        <>
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

          {grades.isLoading && (
            <div className="p-8 text-center text-navy-800/40"><Loader2 className="inline size-5 animate-spin" /></div>
          )}

          <div className="space-y-3">
            {!grades.isLoading && graded.length === 0 && (
              <div className="bg-white border border-border-subtle rounded-2xl p-8 text-center text-sm text-navy-800/60">
                Nenhuma atividade corrigida ainda.
              </div>
            )}
            {graded.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-border-subtle rounded-2xl p-4 flex items-start gap-3 shadow-sm"
              >
                <div className="size-11 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                  <Award className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold truncate">{g.activity.title}</p>
                  <p className="text-xs text-navy-800/60 truncate">
                    {g.activity.type === "turma" ? g.activity.className ?? "Turma" : "Aula particular"}
                  </p>
                  {g.feedback && (
                    <p className="mt-2 text-xs text-navy-800/70 italic line-clamp-2">"{g.feedback}"</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-display font-extrabold text-emerald-700">
                    {g.grade.toFixed(1)}
                  </span>
                  <span className="block text-[11px] text-navy-800/50">
                    / {(g.activity.maxGrade ?? 10)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}