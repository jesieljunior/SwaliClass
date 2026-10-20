import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SessionRole =
  "super_admin" | "admin_instituicao" | "coordenador" | "professor" | "aluno";

/**
 * Returns the effective session for the currently authenticated user:
 * tenant, roles, and (when applicable) the linked student id.
 */
export const getMySession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [rolesR, profileR, studentR] = await Promise.all([
      context.supabase.from("user_roles").select("role, tenant_id").eq("user_id", context.userId),
      context.supabase
        .from("profiles")
        .select("tenant_id, full_name, email")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("students")
        .select("id, tenant_id, full_name, email")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    const roles = ((rolesR.data ?? []) as any[]).map((r) => r.role as SessionRole);
    const isStaff = roles.some(
      (r) =>
        r === "super_admin" ||
        r === "admin_instituicao" ||
        r === "coordenador" ||
        r === "professor",
    );
    const isAluno = roles.includes("aluno");
    const tenantId =
      profileR.data?.tenant_id ??
      studentR.data?.tenant_id ??
      (rolesR.data ?? []).find((r: any) => r.tenant_id)?.tenant_id ??
      null;
    let tenantName: string | null = null;
    if (tenantId) {
      const { data: tenant } = await context.supabase
        .from("tenants")
        .select("name")
        .eq("id", tenantId)
        .maybeSingle();
      tenantName = (tenant?.name as string | undefined) ?? null;
    }
    return {
      userId: context.userId,
      email: (profileR.data?.email ?? studentR.data?.email ?? null) as string | null,
      fullName: (profileR.data?.full_name ?? studentR.data?.full_name ?? null) as string | null,
      roles,
      isStaff,
      isAluno,
      isSuperAdmin: roles.includes("super_admin"),
      isAdmin: roles.includes("admin_instituicao") || roles.includes("super_admin"),
      isCoordenador: roles.includes("coordenador"),
      isProfessor: roles.includes("professor"),
      tenantId,
      tenantName,
      student: studentR.data
        ? { id: studentR.data.id as string, full_name: studentR.data.full_name as string }
        : null,
    };
  });

/**
 * Staff-only: create (or refresh) an invite for a student, so they can
 * claim their account and access the student portal.
 * Returns the invite token + shareable link.
 */
export const inviteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Must be tenant staff
    const { data: isStaff } = await context.supabase.rpc("is_tenant_staff", {
      _user_id: context.userId,
    });
    if (!isStaff) throw new Error("Somente professores ou administradores podem convidar alunos.");

    const { data: student, error: sErr } = await context.supabase
      .from("students")
      .select("id, tenant_id, email, user_id, full_name")
      .eq("id", data.student_id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!student) throw new Error("Aluno não encontrado.");
    if (!student.email)
      throw new Error(
        "Este aluno não tem e-mail cadastrado. Edite o aluno para adicionar o e-mail antes de convidar.",
      );
    if (student.user_id) throw new Error("Este aluno já tem acesso ativo ao portal.");

    // Revoke previous pending invites for the same email so a new token is issued
    await context.supabase
      .from("invites")
      .update({ status: "revoked" })
      .eq("email", student.email)
      .eq("role", "aluno")
      .eq("status", "pending");

    const { data: invite, error } = await context.supabase
      .from("invites")
      .insert({
        tenant_id: student.tenant_id,
        email: student.email,
        role: "aluno",
        invited_by: context.userId,
      })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return { token: invite.token as string, email: student.email as string };
  });
