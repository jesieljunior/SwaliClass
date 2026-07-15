import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Portal do Aluno — visão geral (dados reais, sem mock).
 * Retorna as turmas do aluno, próximas atividades e notas recentes.
 * Se o usuário não for um aluno cadastrado, retorna `student: null`.
 */
export const getMyPortalOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: student } = await supabase
      .from("students")
      .select("id, full_name, email, tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!student) {
      return {
        student: null,
        classes: [],
        upcoming: [],
        recentGrades: [],
      };
    }

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, class_id, active, classes:class_id (id, name)")
      .eq("student_id", student.id)
      .eq("active", true);

    const classIds = (enrollments ?? [])
      .map((e) => e.class_id)
      .filter(Boolean) as string[];

    const nowIso = new Date().toISOString();
    const { data: upcoming } = classIds.length
      ? await supabase
          .from("activities")
          .select("id, title, type, due_at, class_id")
          .in("class_id", classIds)
          .gte("due_at", nowIso)
          .order("due_at", { ascending: true })
          .limit(10)
      : { data: [] };

    const { data: recentGrades } = await supabase
      .from("submissions")
      .select(
        "id, grade, feedback, graded_at, activity_id, activities:activity_id (title)",
      )
      .eq("student_id", student.id)
      .not("grade", "is", null)
      .order("graded_at", { ascending: false })
      .limit(5);

    return {
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
      },
      classes: (enrollments ?? []).map((e) => ({
        id: e.id,
        class_id: e.class_id,
        name:
          (e as { classes: { name: string } | null }).classes?.name ??
          "Turma",
      })),
      upcoming: upcoming ?? [],
      recentGrades: (recentGrades ?? []).map((g) => ({
        id: g.id,
        title:
          (g as { activities: { title: string } | null }).activities?.title ??
          "Atividade",
        grade: g.grade,
        graded_at: g.graded_at,
        feedback: g.feedback,
      })),
    };
  });