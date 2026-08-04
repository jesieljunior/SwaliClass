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

// ---------- BULK IMPORT (CSV) ----------
const bulkStudentRow = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  document: z.string().max(40).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  guardian_name: z.string().max(120).optional().nullable(),
  guardian_phone: z.string().max(40).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  class_name: z.string().max(120).optional().nullable(),
});

const bulkImportSchema = z.object({
  rows: z.array(bulkStudentRow).min(1).max(1000),
});

/**
 * Importa alunos em lote (via CSV parseado no cliente).
 * - Deduplica por (tenant_id, email) e (tenant_id, full_name) para não duplicar existentes.
 * - Se `class_name` bater com uma turma existente do tenant, já matricula o aluno nela.
 * Retorna resumo: criados, ignorados (já existiam), matriculados, erros.
 */
export const bulkImportStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bulkImportSchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenant_id = await getTenantId(context.supabase);

    const { data: staffCheck } = await context.supabase.rpc("is_tenant_staff", {
      _user_id: context.userId,
    });
    if (!staffCheck) throw new Error("Somente staff pode importar alunos.");

    const { data: existing } = await context.supabase
      .from("students")
      .select("id, full_name, email");
    const byEmail = new Map<string, string>();
    const byName = new Map<string, string>();
    for (const s of existing ?? []) {
      if (s.email) byEmail.set(String(s.email).toLowerCase(), s.id);
      byName.set(String(s.full_name).toLowerCase().trim(), s.id);
    }

    const { data: classes } = await context.supabase
      .from("classes")
      .select("id, name");
    const classByName = new Map<string, string>();
    for (const c of classes ?? []) classByName.set(String(c.name).toLowerCase().trim(), c.id);

    let created = 0;
    let skipped = 0;
    let enrolled = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < data.rows.length; i++) {
      const r = data.rows[i];
      const emailKey = r.email ? r.email.toLowerCase() : null;
      const nameKey = r.full_name.toLowerCase().trim();
      let studentId = (emailKey && byEmail.get(emailKey)) || byName.get(nameKey);

      if (!studentId) {
        const insertRow: any = {
          tenant_id,
          full_name: r.full_name,
          email: r.email || null,
          phone: r.phone || null,
          document: r.document || null,
          birth_date: r.birth_date || null,
          guardian_name: r.guardian_name || null,
          guardian_phone: r.guardian_phone || null,
          notes: r.notes || null,
        };
        const { data: ins, error } = await context.supabase
          .from("students")
          .insert(insertRow)
          .select("id")
          .single();
        if (error) {
          errors.push({ row: i + 2, message: error.message });
          continue;
        }
        studentId = ins.id;
        created++;
        if (emailKey) byEmail.set(emailKey, studentId);
        byName.set(nameKey, studentId);
      } else {
        skipped++;
      }

      if (r.class_name && studentId) {
        const classId = classByName.get(r.class_name.toLowerCase().trim());
        if (classId) {
          const { error } = await context.supabase
            .from("enrollments")
            .insert({ tenant_id, student_id: studentId, class_id: classId });
          if (!error) enrolled++;
        }
      }
    }

    return { created, skipped, enrolled, errors };
  });

// ---------- SUBMISSION FILES ----------
const attachFileSchema = z.object({
  submission_id: z.string().uuid(),
  storage_path: z.string().min(1).max(500),
  file_name: z.string().min(1).max(200),
  mime_type: z.string().max(100).optional().nullable(),
  size_bytes: z.number().int().min(0).max(50 * 1024 * 1024).optional().nullable(),
});

export const attachSubmissionFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => attachFileSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: sub, error: e1 } = await context.supabase
      .from("submissions")
      .select("id, tenant_id, student_id, students!inner(user_id)")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!sub) throw new Error("Entrega não encontrada.");
    if ((sub as any).students?.user_id !== context.userId)
      throw new Error("Você só pode anexar arquivos à sua própria entrega.");

    const { data: row, error } = await context.supabase
      .from("submission_files")
      .insert({
        tenant_id: sub.tenant_id,
        submission_id: sub.id,
        student_id: sub.student_id,
        storage_path: data.storage_path,
        file_name: data.file_name,
        mime_type: data.mime_type ?? null,
        size_bytes: data.size_bytes ?? null,
        uploaded_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const listSubmissionFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ submission_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("submission_files")
      .select("id, storage_path, file_name, mime_type, size_bytes, created_at")
      .eq("submission_id", data.submission_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Signed URLs (10 min) para download pelo cliente
    const signed = await Promise.all(
      (rows ?? []).map(async (r) => {
        const { data: s } = await context.supabase.storage
          .from("submissions")
          .createSignedUrl(r.storage_path, 600);
        return { ...r, download_url: s?.signedUrl ?? null };
      }),
    );
    return signed;
  });

export const deleteSubmissionFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error: e1 } = await context.supabase
      .from("submission_files")
      .select("id, storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!row) return { ok: true };
    await context.supabase.storage.from("submissions").remove([row.storage_path]);
    const { error } = await context.supabase.from("submission_files").delete().eq("id", data.id);
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
      .select("id, topic, notes, created_at, updated_at")
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
        .update({ topic: data.topic ?? null, notes: data.notes ?? null, updated_at: new Date().toISOString() })
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

/**
 * Painel do professor: turmas que ele leciona, entregas pendentes de correção
 * e média de notas por turma.
 */
export const getTeacherDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links } = await context.supabase
      .from("class_teachers")
      .select("class_id, classes:class_id (id, name, courses:course_id (name))")
      .eq("teacher_id", context.userId);

    const classes = (links ?? []).map((l: any) => ({
      id: l.class_id as string,
      name: (l.classes?.name as string) ?? "Turma",
      course: (l.classes?.courses?.name as string) ?? null,
    }));
    const classIds = classes.map((c) => c.id);

    if (!classIds.length) {
      return { classes: [], pendingTotal: 0, gradedTotal: 0 };
    }

    const { data: acts } = await context.supabase
      .from("activities")
      .select("id, class_id, max_grade")
      .in("class_id", classIds);

    const actIds = (acts ?? []).map((a: any) => a.id as string);
    const actClass = new Map<string, { class_id: string; max: number }>();
    for (const a of acts ?? [])
      actClass.set(a.id as string, {
        class_id: a.class_id as string,
        max: Number(a.max_grade ?? 10) || 10,
      });

    const { data: subs } = actIds.length
      ? await context.supabase
          .from("submissions")
          .select("id, activity_id, status, grade")
          .in("activity_id", actIds)
      : { data: [] as any[] };

    const agg = new Map<string, { pending: number; graded: number; sum: number }>();
    for (const c of classes) agg.set(c.id, { pending: 0, graded: 0, sum: 0 });

    for (const s of (subs ?? []) as any[]) {
      const meta = actClass.get(s.activity_id as string);
      if (!meta) continue;
      const bucket = agg.get(meta.class_id);
      if (!bucket) continue;
      if (s.status === "entregue") bucket.pending += 1;
      if (s.grade !== null && s.grade !== undefined) {
        bucket.graded += 1;
        bucket.sum += (Number(s.grade) / meta.max) * 100;
      }
    }

    const out = classes.map((c) => {
      const b = agg.get(c.id)!;
      return {
        ...c,
        pending: b.pending,
        graded: b.graded,
        avg: b.graded ? Math.round((b.sum / b.graded) * 10) / 10 : null,
      };
    });

    return {
      classes: out,
      pendingTotal: out.reduce((s, c) => s + c.pending, 0),
      gradedTotal: out.reduce((s, c) => s + c.graded, 0),
    };
  });

// ============ REPORTS ============
const reportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  class_id: z.string().uuid().optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  student_id: z.string().uuid().optional().nullable(),
});

export const getReportData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reportSchema.parse(d))
  .handler(async ({ data, context }) => {
    // 1. Fetch sessions in the period, with optional class/course filter
    let sessQ = context.supabase
      .from("attendance_sessions")
      .select("id, session_date, topic, class_id, classes(id, name, course_id, courses(id, name))")
      .gte("session_date", data.start_date)
      .lte("session_date", data.end_date)
      .order("session_date", { ascending: true });
    if (data.class_id) sessQ = sessQ.eq("class_id", data.class_id);
    const { data: sessions, error: e1 } = await sessQ;
    if (e1) throw new Error(e1.message);

    let filteredSessions = (sessions ?? []) as any[];
    if (data.course_id) {
      filteredSessions = filteredSessions.filter((s) => s.classes?.course_id === data.course_id);
    }
    const sessionIds = filteredSessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return { sessions: [], records: [], byStudent: [], byClass: [], byCourse: [], totals: { sessions: 0, students: 0, present: 0, absent: 0, late: 0, justified: 0, rate: 0 } };
    }

    // 2. Fetch records for those sessions
    let recQ = context.supabase
      .from("attendance_records")
      .select("session_id, student_id, status, students(id, full_name, email)")
      .in("session_id", sessionIds);
    if (data.student_id) recQ = recQ.eq("student_id", data.student_id);
    const { data: records, error: e2 } = await recQ;
    if (e2) throw new Error(e2.message);

    const recs = (records ?? []) as any[];
    const sessById = new Map(filteredSessions.map((s) => [s.id, s]));

    const aggKey = <T,>(map: Map<string, T>, k: string, init: () => T) => {
      if (!map.has(k)) map.set(k, init());
      return map.get(k)!;
    };
    type Agg = { id: string; name: string; present: number; absent: number; late: number; justified: number; total: number };
    const byStudent = new Map<string, Agg>();
    const byClass = new Map<string, Agg>();
    const byCourse = new Map<string, Agg>();
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalJustified = 0;

    for (const r of recs) {
      const sess = sessById.get(r.session_id);
      if (!sess) continue;
      const cls = sess.classes;
      const course = cls?.courses;
      const st = aggKey(byStudent, r.student_id, () => ({ id: r.student_id, name: r.students?.full_name ?? "—", present: 0, absent: 0, late: 0, justified: 0, total: 0 }));
      const cl = cls ? aggKey(byClass, cls.id, () => ({ id: cls.id, name: cls.name, present: 0, absent: 0, late: 0, justified: 0, total: 0 })) : null;
      const co = course ? aggKey(byCourse, course.id, () => ({ id: course.id, name: course.name, present: 0, absent: 0, late: 0, justified: 0, total: 0 })) : null;
      const buckets = [st, cl, co].filter(Boolean) as Agg[];
      for (const b of buckets) {
        b.total++;
        if (r.status === "presente") b.present++;
        else if (r.status === "ausente") b.absent++;
        else if (r.status === "atrasado") b.late++;
        else if (r.status === "justificado") b.justified++;
      }
      if (r.status === "presente") totalPresent++;
      else if (r.status === "ausente") totalAbsent++;
      else if (r.status === "atrasado") totalLate++;
      else if (r.status === "justificado") totalJustified++;
    }

    const finish = (a: Agg) => ({
      ...a,
      rate: a.total ? Math.round(((a.present + a.late) / a.total) * 100) : 0,
    });

    const totalRecs = recs.length;
    return {
      sessions: filteredSessions.map((s) => ({
        id: s.id,
        date: s.session_date,
        topic: s.topic,
        class_name: s.classes?.name ?? "—",
        course_name: s.classes?.courses?.name ?? "—",
      })),
      records: recs.map((r) => ({
        session_id: r.session_id,
        date: sessById.get(r.session_id)?.session_date,
        class_name: sessById.get(r.session_id)?.classes?.name ?? "—",
        course_name: sessById.get(r.session_id)?.classes?.courses?.name ?? "—",
        student_id: r.student_id,
        student_name: r.students?.full_name ?? "—",
        status: r.status,
      })),
      byStudent: Array.from(byStudent.values()).map(finish).sort((a, b) => a.rate - b.rate),
      byClass: Array.from(byClass.values()).map(finish).sort((a, b) => b.rate - a.rate),
      byCourse: Array.from(byCourse.values()).map(finish).sort((a, b) => b.rate - a.rate),
      totals: {
        sessions: filteredSessions.length,
        students: byStudent.size,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        justified: totalJustified,
        rate: totalRecs ? Math.round(((totalPresent + totalLate) / totalRecs) * 100) : 0,
      },
    };
  });

// ============ GRADES REPORT ============
export const getGradesReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reportSchema.parse(d))
  .handler(async ({ data, context }) => {
    const empty = {
      records: [],
      byStudent: [],
      byClass: [],
      byActivity: [],
      totals: { activities: 0, students: 0, graded: 0, delivered: 0, pending: 0, average: 0 },
    };

    let actQ = context.supabase
      .from("activities")
      .select("id, title, due_at, max_grade, type, class_id, student_id, classes(id, name, course_id, courses(id, name))")
      .gte("due_at", `${data.start_date}T00:00:00Z`)
      .lte("due_at", `${data.end_date}T23:59:59Z`)
      .order("due_at", { ascending: true });
    if (data.class_id) actQ = actQ.eq("class_id", data.class_id);
    const { data: activities, error: e1 } = await actQ;
    if (e1) throw new Error(e1.message);

    let acts = (activities ?? []) as any[];
    if (data.course_id) acts = acts.filter((a) => a.classes?.course_id === data.course_id);
    if (acts.length === 0) return empty;

    const actIds = acts.map((a) => a.id);
    let subQ = context.supabase
      .from("submissions")
      .select("id, activity_id, student_id, grade, status, submitted_at, graded_at, students(id, full_name)")
      .in("activity_id", actIds);
    if (data.student_id) subQ = subQ.eq("student_id", data.student_id);
    const { data: submissions, error: e2 } = await subQ;
    if (e2) throw new Error(e2.message);

    const subs = (submissions ?? []) as any[];
    const actById = new Map(acts.map((a) => [a.id, a]));

    type Agg = {
      id: string;
      name: string;
      graded: number;
      delivered: number;
      pending: number;
      sumPct: number;
      average: number;
    };
    const mk = (id: string, name: string): Agg => ({ id, name, graded: 0, delivered: 0, pending: 0, sumPct: 0, average: 0 });
    const get = (map: Map<string, Agg>, id: string, name: string) => {
      if (!map.has(id)) map.set(id, mk(id, name));
      return map.get(id)!;
    };

    const byStudent = new Map<string, Agg>();
    const byClass = new Map<string, Agg>();
    const byActivity = new Map<string, Agg>();

    let graded = 0, delivered = 0, pending = 0, sumPct = 0;
    const records: any[] = [];

    for (const s of subs) {
      const act = actById.get(s.activity_id);
      if (!act) continue;
      const max = Number(act.max_grade ?? 10) || 10;
      const grade = s.grade === null || s.grade === undefined ? null : Number(s.grade);
      const pct = grade === null ? null : Math.round((grade / max) * 1000) / 10;

      const st = get(byStudent, s.student_id, s.students?.full_name ?? "—");
      const cl = act.classes ? get(byClass, act.classes.id, act.classes.name) : null;
      const ac = get(byActivity, act.id, act.title);
      const buckets = [st, cl, ac].filter(Boolean) as Agg[];

      for (const b of buckets) {
        if (s.status === "corrigida" && pct !== null) {
          b.graded++;
          b.sumPct += pct;
        } else if (s.status === "entregue") b.delivered++;
        else b.pending++;
      }
      if (s.status === "corrigida" && pct !== null) { graded++; sumPct += pct; }
      else if (s.status === "entregue") delivered++;
      else pending++;

      records.push({
        activity_id: act.id,
        activity_title: act.title,
        due_at: act.due_at,
        class_name: act.classes?.name ?? "Particular",
        course_name: act.classes?.courses?.name ?? "—",
        student_id: s.student_id,
        student_name: s.students?.full_name ?? "—",
        status: s.status,
        grade,
        max_grade: max,
        percent: pct,
        graded_at: s.graded_at,
      });
    }

    const finish = (a: Agg) => ({ ...a, average: a.graded ? Math.round((a.sumPct / a.graded) * 10) / 10 : 0 });

    return {
      records: records.sort((a, b) => String(a.due_at).localeCompare(String(b.due_at))),
      byStudent: Array.from(byStudent.values()).map(finish).sort((a, b) => a.average - b.average),
      byClass: Array.from(byClass.values()).map(finish).sort((a, b) => b.average - a.average),
      byActivity: Array.from(byActivity.values()).map(finish).sort((a, b) => b.average - a.average),
      totals: {
        activities: acts.length,
        students: byStudent.size,
        graded,
        delivered,
        pending,
        average: graded ? Math.round((sumPct / graded) * 10) / 10 : 0,
      },
    };
  });