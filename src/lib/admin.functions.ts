import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_USERNAME = "smantilas";
const ADMIN_PASSWORD = "smantilasburu";
const ADMIN_EMAIL = "smantilas@smanti13buru.id";

/**
 * Idempotently makes sure the school administrator account exists.
 * Safe to call from the public login page: it only ever creates one fixed
 * account and never returns credentials or tokens.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", ADMIN_USERNAME)
    .maybeSingle();

  if (existing) return { ready: true };

  let adminId: string | null = null;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (created?.user) {
    adminId = created.user.id;
  } else if (createError) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    adminId = list?.users.find((user) => user.email === ADMIN_EMAIL)?.id ?? null;
  }

  if (!adminId) return { ready: false };

  await supabaseAdmin.from("profiles").upsert({
    id: adminId,
    username: ADMIN_USERNAME,
    full_name: "Administrator Sekolah",
    role: "admin" as const,
    status: "approved" as const,
  });

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: adminId, role: "admin" as const }, { onConflict: "user_id,role" });

  return { ready: true };
});

async function assertAdmin(supabase: {
  rpc: (
    fn: "has_role",
    args: { _user_id: string; _role: "admin" | "guru" | "siswa" },
  ) => Promise<{ data: boolean | null }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Hanya admin yang boleh melakukan tindakan ini.");
}

/** Admin approves a pending registration and assigns the final role. */
export const decideRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; approve: boolean; role: "guru" | "siswa" }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.approve) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ status: "rejected" as const })
        .eq("id", data.userId);
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      return { ok: true };
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "approved" as const, role: data.role })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (roleError) throw new Error(roleError.message);

    return { ok: true };
  });

/** Admin removes an account entirely. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    if (data.userId === context.userId) {
      throw new Error("Admin tidak dapat menghapus akunnya sendiri.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
