import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc("current_tenant_id");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sem tenant associado ao usuário.");
  return data as string;
}

// ---------- LIST (teacher view) ----------
export const listActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: acts, error } = await context.supabase
      .from("activities")
      .select(
        "id, title, description, due_at, type, class_id, student_id, max_grade, created_at, classes(id, name), students(id, full_name)"
      )
      .order("due_at", { ascending: true });
    if (error) throw new Error(error.message);

    const ids = (acts ?? []).map((a: any) => a.id);
    let subs: any[] = [];
    if (ids.length) {
      const { data, error: e2 } = await context.supabase
        .from("submissions")
        .select("id, activity_id, student_id, status, note, submitted_at, grade, feedback, graded_at, students(id, full_name)")
        .in("activity_id", ids);
      if (e2) throw new Error(e2.message);
      subs = data ?? [];
    }
    const byAct = new Map<string, any[]>();
    for (const s of subs) {
      const arr = byAct.get(s.activity_id) ?? [];
      arr.push({
        id: s.id,
        studentId: s.student_id,
        studentName: s.students?.full_name ?? "—",
        status: s.status,
        note: s.note ?? undefined,
        submittedAt: s.submitted_at ?? undefined,
        grade: s.grade != null ? Number(s.grade) : undefined,
        feedback: s.feedback ?? undefined,
        gradedAt: s.graded_at ?? undefined,
      });
      byAct.set(s.activity_id, arr);
    }
    return (acts ?? []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      due: a.due_at,
      createdAt: a.created_at,
      type: a.type,
      classId: a.class_id ?? undefined,
      className: a.classes?.name,
      studentId: a.student_id ?? undefined,
      studentName: a.students?.full_name,
      maxGrade: a.max_grade != null ? Number(a.max_grade) : 10,
      submissions: byAct.get(a.id) ?? [],
    }));
  });

// ---------- CREATE ----------
const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  due: z.string(), // ISO or yyyy-mm-dd
  type: z.enum(["particular", "turma"]),
  targetId: z.string().uuid(),
  maxGrade: z.number().positive().max(1000).optional(),
});

export const createActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context.supabase);
    const insertRow: any = {
      tenant_id,
      created_by: context.userId,
      title: data.title,
      description: data.description ?? null,
      due_at: new Date(data.due).toISOString(),
      type: data.type,
      class_id: data.type === "turma" ? data.targetId : null,
      student_id: data.type === "particular" ? data.targetId : null,
      max_grade: data.maxGrade ?? 10,
    };
    const { data: act, error } = await context.supabase
      .from("activities")
      .insert(insertRow)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Create submissions
    let studentIds: string[] = [];
    if (data.type === "turma") {
      const { data: enrolls, error: e2 } = await context.supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", data.targetId)
        .eq("active", true);
      if (e2) throw new Error(e2.message);
      studentIds = (enrolls ?? []).map((e: any) => e.student_id);
    } else {
      studentIds = [data.targetId];
    }
    if (studentIds.length) {
      const rows = studentIds.map((sid) => ({
        tenant_id,
        activity_id: act.id,
        student_id: sid,
        status: "pendente" as const,
      }));
      const { error: e3 } = await context.supabase.from("submissions").insert(rows);
      if (e3) throw new Error(e3.message);
    }
    return { ok: true, id: act.id };
  });

// ---------- DELETE ----------
export const deleteActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("activities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- MARK COMPLETE (student action) ----------
const markSchema = z.object({
  submission_id: z.string().uuid(),
  note: z.string().max(2000).optional().nullable(),
});

export const markSubmissionComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => markSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("submissions")
      .update({
        status: "entregue",
        note: data.note ?? null,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", data.submission_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- GRADE (teacher action) ----------
const gradeSchema = z.object({
  submission_id: z.string().uuid(),
  grade: z.number().min(0),
  feedback: z.string().max(2000).optional().nullable(),
});

export const gradeSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => gradeSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Validate against activity.max_grade
    const { data: sub, error: subErr } = await context.supabase
      .from("submissions")
      .select("activity_id, activities:activity_id(max_grade)")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (subErr) throw new Error(subErr.message);
    const maxGrade = Number(
      (sub as any)?.activities?.max_grade ?? 10,
    );
    if (data.grade > maxGrade) {
      throw new Error(`Nota acima do máximo permitido (${maxGrade}).`);
    }
    const { error } = await context.supabase
      .from("submissions")
      .update({
        status: "corrigida",
        grade: data.grade,
        feedback: data.feedback ?? null,
        graded_at: new Date().toISOString(),
        graded_by: context.userId,
      })
      .eq("id", data.submission_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- STUDENT NOTAS ----------
export const listStudentGrades = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("submissions")
      .select("id, status, grade, feedback, graded_at, activities(id, title, type, max_grade, classes(name))")
      .eq("student_id", data.student_id)
      .eq("status", "corrigida")
      .order("graded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      grade: r.grade != null ? Number(r.grade) : 0,
      feedback: r.feedback ?? "",
      gradedAt: r.graded_at,
      activity: {
        id: r.activities?.id,
        title: r.activities?.title ?? "—",
        type: r.activities?.type,
        maxGrade: r.activities?.max_grade != null ? Number(r.activities.max_grade) : 10,
        className: r.activities?.classes?.name,
      },
    }));
  });