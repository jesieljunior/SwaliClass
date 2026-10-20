import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertTenantAdmin(supabase: any, userId: string): Promise<string> {
  const { data: tenantId, error: tErr } = await supabase.rpc("current_tenant_id");
  if (tErr) throw new Error(tErr.message);
  if (!tenantId) throw new Error("Sem tenant associado ao usuário.");
  const { data: isSuper } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (isSuper) return tenantId as string;
  const { data: isAdmin, error: aErr } = await supabase.rpc("is_tenant_admin", {
    _user_id: userId,
    _tenant_id: tenantId,
  });
  if (aErr) throw new Error(aErr.message);
  if (!isAdmin)
    throw new Error("Somente administradores da instituição podem gerenciar professores.");
  return tenantId as string;
}

// ---------- LIST tenant professors (admin) ----------
export const listTenantProfessors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await assertTenantAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("role", "professor");
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (!ids.length) return [] as { id: string; full_name: string; email: string }[];
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    return (profiles ?? []).map((p) => ({
      id: p.id as string,
      full_name: (p.full_name as string) || (p.email as string),
      email: p.email as string,
    }));
  });

// ---------- LIST class teachers ----------
export const listClassTeachers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await assertTenantAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("class_teachers")
      .select("id, teacher_id, created_at")
      .eq("class_id", data.class_id)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.teacher_id);
    let profileMap = new Map<string, { full_name: string; email: string }>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      for (const p of profs ?? []) {
        profileMap.set(p.id as string, {
          full_name: (p.full_name as string) || (p.email as string),
          email: p.email as string,
        });
      }
    }
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      teacher_id: r.teacher_id as string,
      full_name: profileMap.get(r.teacher_id as string)?.full_name ?? "—",
      email: profileMap.get(r.teacher_id as string)?.email ?? "",
    }));
  });

// ---------- ASSIGN teacher to class ----------
export const assignTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ class_id: z.string().uuid(), teacher_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tenantId = await assertTenantAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Teacher must belong to the same tenant with professor role
    const { data: hasRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", data.teacher_id)
      .eq("tenant_id", tenantId)
      .eq("role", "professor")
      .maybeSingle();
    if (!hasRole) throw new Error("O usuário não é professor desta instituição.");
    const { error } = await supabaseAdmin
      .from("class_teachers")
      .insert({ tenant_id: tenantId, class_id: data.class_id, teacher_id: data.teacher_id });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

// ---------- UNASSIGN ----------
export const unassignTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await assertTenantAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("class_teachers")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- INVITE professor (generates invite link) ----------
export const inviteProfessor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await assertTenantAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Revoke previous pending invites for the same email/role
    await supabaseAdmin
      .from("invites")
      .update({ status: "revoked" })
      .eq("email", data.email)
      .eq("role", "professor")
      .eq("tenant_id", tenantId)
      .eq("status", "pending");
    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .insert({
        tenant_id: tenantId,
        email: data.email,
        role: "professor",
        invited_by: context.userId,
      })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return { token: invite.token as string, email: data.email };
  });
