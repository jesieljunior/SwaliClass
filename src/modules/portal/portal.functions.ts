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

    const classIds = (enrollments ?? []).map((e) => e.class_id).filter(Boolean) as string[];

    const nowIso = new Date().toISOString();
    const { data: upcomingRaw } = classIds.length
      ? await supabase
          .from("activities")
          .select("id, title, type, due_at, class_id")
          .in("class_id", classIds)
          .gte("due_at", nowIso)
          .order("due_at", { ascending: true })
          .limit(20)
      : { data: [] };

    // Esconde atividades que o aluno já entregou/teve corrigidas (item 17)
    const upcomingIds = (upcomingRaw ?? []).map((a) => a.id);
    const { data: doneSubs } = upcomingIds.length
      ? await supabase
          .from("submissions")
          .select("activity_id, status")
          .eq("student_id", student.id)
          .in("activity_id", upcomingIds)
          .neq("status", "pendente")
      : { data: [] };
    const doneSet = new Set((doneSubs ?? []).map((s) => s.activity_id));
    const upcoming = (upcomingRaw ?? []).filter((a) => !doneSet.has(a.id)).slice(0, 10);

    // Frequência por turma (item 16)
    const { data: attRecords } = await supabase
      .from("attendance_records")
      .select("status, attendance_sessions:session_id (class_id)")
      .eq("student_id", student.id);

    const attByClass = new Map<string, { present: number; total: number }>();
    for (const r of attRecords ?? []) {
      const cid = (r as { attendance_sessions: { class_id: string } | null }).attendance_sessions
        ?.class_id;
      if (!cid) continue;
      const cur = attByClass.get(cid) ?? { present: 0, total: 0 };
      cur.total += 1;
      if (r.status === "presente" || r.status === "atrasado" || r.status === "justificado")
        cur.present += 1;
      attByClass.set(cid, cur);
    }

    const { data: recentGrades } = await supabase
      .from("submissions")
      .select("id, grade, feedback, graded_at, activity_id, activities:activity_id (title)")
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
      classes: (enrollments ?? []).map((e) => {
        const att = attByClass.get(e.class_id) ?? { present: 0, total: 0 };
        return {
          id: e.id,
          class_id: e.class_id,
          name: (e as { classes: { name: string } | null }).classes?.name ?? "Turma",
          attendance: {
            present: att.present,
            total: att.total,
            rate: att.total ? Math.round((att.present / att.total) * 100) : null,
          },
        };
      }),
      upcoming: upcoming ?? [],
      recentGrades: (recentGrades ?? []).map((g) => ({
        id: g.id,
        title: (g as { activities: { title: string } | null }).activities?.title ?? "Atividade",
        grade: g.grade,
        graded_at: g.graded_at,
        feedback: g.feedback,
      })),
    };
  });
