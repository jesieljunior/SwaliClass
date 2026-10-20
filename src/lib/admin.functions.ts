import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin only");
}

// ---------- LIST TENANTS (with counts) ----------
export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (tenants ?? []).map((t) => t.id);
    let userCounts: Record<string, number> = {};
    let studentCounts: Record<string, number> = {};
    if (ids.length) {
      const [{ data: profs }, { data: studs }] = await Promise.all([
        supabaseAdmin.from("profiles").select("tenant_id").in("tenant_id", ids),
        supabaseAdmin.from("students").select("tenant_id").in("tenant_id", ids),
      ]);
      for (const p of profs ?? [])
        if (p.tenant_id) userCounts[p.tenant_id] = (userCounts[p.tenant_id] ?? 0) + 1;
      for (const s of studs ?? [])
        studentCounts[s.tenant_id] = (studentCounts[s.tenant_id] ?? 0) + 1;
    }
    return (tenants ?? []).map((t) => ({
      ...t,
      user_count: userCounts[t.id] ?? 0,
      student_count: studentCounts[t.id] ?? 0,
    }));
  });

// ---------- CREATE TENANT + initial admin invite ----------
const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  plan: z.enum(["starter", "professional", "business", "enterprise"]),
  contact_email: z.string().email(),
  admin_email: z.string().email(),
});

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createTenantSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const baseSlug = slugify(data.name) || "tenant";
    let slug = baseSlug;
    for (let i = 2; i < 20; i++) {
      const { data: ex } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!ex) break;
      slug = `${baseSlug}-${i}`;
    }
    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: data.name,
        slug,
        plan: data.plan,
        contact_email: data.contact_email,
        status: "trial",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { data: invite, error: invErr } = await supabaseAdmin
      .from("invites")
      .insert({
        tenant_id: tenant.id,
        email: data.admin_email,
        role: "admin_instituicao",
        invited_by: context.userId,
      })
      .select("token")
      .single();
    if (invErr) throw new Error(invErr.message);
    return { tenant, invite_token: invite.token };
  });

// ---------- LIST INVITES ----------
export const listInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("invites")
      .select(
        "id, tenant_id, email, role, status, expires_at, accepted_at, created_at, token, tenants(name)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- REVOKE INVITE ----------
export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- PUBLIC: get invite by token ----------
export const getInviteByToken = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(8).max(128) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .select("id, email, role, status, expires_at, tenant_id, tenants(name)")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invite) return { ok: false as const, reason: "not_found" as const };
    if (invite.status !== "pending") return { ok: false as const, reason: invite.status };
    if (new Date(invite.expires_at) < new Date())
      return { ok: false as const, reason: "expired" as const };
    return { ok: true as const, invite };
  });

// ---------- PUBLIC: accept invite ----------
const acceptSchema = z.object({
  token: z.string().min(8).max(128),
  password: z.string().min(8).max(128),
  full_name: z.string().min(2).max(120),
});

export const acceptInvite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => acceptSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invite) throw new Error("Convite inválido.");
    if (invite.status !== "pending") throw new Error("Convite já utilizado ou revogado.");
    if (new Date(invite.expires_at) < new Date()) throw new Error("Convite expirado.");

    // Check if user already exists
    let userId: string | null = null;
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", invite.email)
      .maybeSingle();

    if (existing) {
      userId = existing.id;
      // update password
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: data.password,
        user_metadata: { full_name: data.full_name },
      });
    } else {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });
      if (cErr) throw new Error(cErr.message);
      userId = created.user!.id;
    }

    // Ensure profile row + tenant assignment
    await supabaseAdmin.from("profiles").upsert({
      id: userId!,
      email: invite.email,
      full_name: data.full_name,
      tenant_id: invite.tenant_id,
    });

    // Grant role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId!, role: invite.role, tenant_id: invite.tenant_id })
      .then((r) => {
        // ignore unique violation
        if (r.error && !r.error.message.includes("duplicate")) throw new Error(r.error.message);
      });

    // If accepting as student, link the auth user to the matching student row (by email + tenant).
    if (invite.role === "aluno" && invite.tenant_id) {
      await supabaseAdmin
        .from("students")
        .update({ user_id: userId! })
        .eq("tenant_id", invite.tenant_id)
        .ilike("email", invite.email)
        .is("user_id", null);
    }

    // Activate tenant if still trial-with-no-users
    if (invite.tenant_id) {
      await supabaseAdmin
        .from("tenants")
        .update({ status: "active" })
        .eq("id", invite.tenant_id)
        .eq("status", "trial");
    }

    // Mark invite accepted
    await supabaseAdmin
      .from("invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return { ok: true, email: invite.email };
  });
