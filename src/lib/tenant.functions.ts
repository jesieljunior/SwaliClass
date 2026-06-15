import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getTenantId(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc("current_tenant_id");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sem tenant associado ao usuário.");
  return data as string;
}

// ============ COURSES ============
export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("id, name, description, category, workload_hours, classes(id, students:enrollments(id))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((c: any) => ({
      ...c,
      class_count: c.classes?.length ?? 0,
      student_count: (c.classes ?? []).reduce((s: number, cl: any) => s + (cl.students?.length ?? 0), 0),
    }));
  });

const courseInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  workload_hours: z.number().int().min(0).max(10000).optional().nullable(),
});

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context.supabase);
    const payload = { ...data, tenant_id };
    const q = data.id
      ? context.supabase.from("courses").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("courses").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ CLASSES ============
export const listClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("classes")
      .select("id, name, schedule, start_date, end_date, room, course_id, courses(name), enrollments(id)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((c: any) => ({
      ...c,
      course_name: c.courses?.name ?? "—",
      enrolled: c.enrollments?.length ?? 0,
    }));
  });

const classInput = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  schedule: z.string().max(120).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  room: z.string().max(60).optional().nullable(),
});

export const upsertClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => classInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context.supabase);
    const payload = { ...data, tenant_id };
    const q = data.id
      ? context.supabase.from("classes").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("classes").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("classes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ STUDENTS ============
export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("students")
      .select("id, full_name, email, phone, document, birth_date, guardian_name, guardian_phone, notes, enrollments(class_id, classes(name))")
      .order("full_name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((s: any) => ({
      ...s,
      class_names: (s.enrollments ?? []).map((e: any) => e.classes?.name).filter(Boolean).join(", "),
    }));
  });

const studentInput = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2).max(120),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  document: z.string().max(40).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  guardian_name: z.string().max(120).optional().nullable(),
  guardian_phone: z.string().max(40).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const upsertStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => studentInput.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context.supabase);
    const clean: any = { ...data, tenant_id };
    if (clean.email === "") clean.email = null;
    const q = data.id
      ? context.supabase.from("students").update(clean).eq("id", data.id).select().single()
      : context.supabase.from("students").insert(clean).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ENROLLMENTS ============
export const enrollStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_id: z.string().uuid(), class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context.supabase);
    const { error } = await context.supabase
      .from("enrollments")
      .insert({ ...data, tenant_id })
      .select();
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const unenrollStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_id: z.string().uuid(), class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("enrollments")
      .delete()
      .eq("student_id", data.student_id)
      .eq("class_id", data.class_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ATTENDANCE ============
// Returns the class roster + existing marks for a given date (creating none).
export const getAttendanceRoster = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ class_id: z.string().uuid(), session_date: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: enrollments, error: e1 } = await context.supabase
      .from("enrollments")
      .select("student_id, students(id, full_name, email)")
      .eq("class_id", data.class_id)
      .eq("active", true);
    if (e1) throw new Error(e1.message);

    const { data: session } = await context.supabase
      .from("attendance_sessions")
      .select("id, topic, notes")
      .eq("class_id", data.class_id)
      .eq("session_date", data.session_date)
      .maybeSingle();

    let marks: Record<string, string> = {};
    if (session) {
      const { data: recs } = await context.supabase
        .from("attendance_records")
        .select("student_id, status")
        .eq("session_id", session.id);
      for (const r of recs ?? []) marks[r.student_id] = r.status;
    }
    return {
      session,
      roster: (enrollments ?? []).map((e: any) => e.students).filter(Boolean),
      marks,
    };
  });

const saveAttSchema = z.object({
  class_id: z.string().uuid(),
  session_date: z.string(),
  topic: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  marks: z.array(
    z.object({
      student_id: z.string().uuid(),
      status: z.enum(["presente", "ausente", "atrasado", "justificado"]),
    }),
  ),
});

export const saveAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveAttSchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context.supabase);
    // Upsert session
    const { data: existing } = await context.supabase
      .from("attendance_sessions")
      .select("id")
      .eq("class_id", data.class_id)
      .eq("session_date", data.session_date)
      .maybeSingle();
    let sessionId = existing?.id as string | undefined;
    if (sessionId) {
      await context.supabase
        .from("attendance_sessions")
        .update({ topic: data.topic ?? null, notes: data.notes ?? null })
        .eq("id", sessionId);
    } else {
      const { data: s, error } = await context.supabase
        .from("attendance_sessions")
        .insert({
          tenant_id,
          class_id: data.class_id,
          session_date: data.session_date,
          teacher_id: context.userId,
          topic: data.topic ?? null,
          notes: data.notes ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      sessionId = s.id;
    }
    // Replace records
    await context.supabase.from("attendance_records").delete().eq("session_id", sessionId);
    if (data.marks.length) {
      const rows = data.marks.map((m) => ({
        tenant_id,
        session_id: sessionId!,
        student_id: m.student_id,
        status: m.status,
      }));
      const { error } = await context.supabase.from("attendance_records").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true, session_id: sessionId };
  });

// ============ DASHBOARD STATS ============
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [studentsR, classesR, coursesR, sessionsR, recordsR] = await Promise.all([
      context.supabase.from("students").select("id", { count: "exact", head: true }),
      context.supabase.from("classes").select("id", { count: "exact", head: true }),
      context.supabase.from("courses").select("id", { count: "exact", head: true }),
      context.supabase
        .from("attendance_sessions")
        .select("id, session_date")
        .gte("session_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
      context.supabase
        .from("attendance_records")
        .select("status, student_id, attendance_sessions!inner(session_date)")
        .gte("attendance_sessions.session_date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
    ]);

    const records = (recordsR.data ?? []) as any[];
    const total = records.length;
    const present = records.filter((r) => r.status === "presente" || r.status === "atrasado").length;
    const avgAttendance = total ? Math.round((present / total) * 100) : 0;

    // Per-student attendance %
    const perStudent: Record<string, { ok: number; total: number }> = {};
    for (const r of records) {
      perStudent[r.student_id] ??= { ok: 0, total: 0 };
      perStudent[r.student_id].total++;
      if (r.status === "presente" || r.status === "atrasado") perStudent[r.student_id].ok++;
    }
    const lowFreqIds = Object.entries(perStudent)
      .filter(([, v]) => v.total >= 3 && v.ok / v.total < 0.75)
      .map(([id]) => id);

    let lowFreq: any[] = [];
    if (lowFreqIds.length) {
      const { data: studs } = await context.supabase
        .from("students")
        .select("id, full_name")
        .in("id", lowFreqIds)
        .limit(6);
      lowFreq = (studs ?? []).map((s: any) => ({
        ...s,
        attendance: Math.round((perStudent[s.id].ok / perStudent[s.id].total) * 100),
      }));
    }

    // Weekly chart: last 7 days
    const byDay: Record<string, { ok: number; total: number }> = {};
    for (const r of records) {
      const d = (r.attendance_sessions as any)?.session_date;
      if (!d) continue;
      byDay[d] ??= { ok: 0, total: 0 };
      byDay[d].total++;
      if (r.status === "presente" || r.status === "atrasado") byDay[d].ok++;
    }
    const weekly = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const key = d.toISOString().slice(0, 10);
      const b = byDay[key];
      return {
        day: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        value: b && b.total ? Math.round((b.ok / b.total) * 100) : 0,
      };
    });

    return {
      totalStudents: studentsR.count ?? 0,
      totalClasses: classesR.count ?? 0,
      totalCourses: coursesR.count ?? 0,
      sessionsThisWeek: (sessionsR.data ?? []).length,
      avgAttendance,
      lowFreq,
      weekly,
    };
  });