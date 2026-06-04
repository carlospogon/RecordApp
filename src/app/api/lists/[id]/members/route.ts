import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getDisplayName(email: string | undefined, metadata: Record<string, unknown> | undefined) {
  return (
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata?.name === "string" && metadata.name.trim()) ||
    (email?.split("@")[0] ?? "Usuario")
  );
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleList = await getAccessibleListForUser(id, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta lista." }, { status: 403 });
  }

  const { data: memberRows, error } = await admin
    .from("shopping_list_members")
    .select("user_id, role")
    .eq("list_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const members = await Promise.all(
    (memberRows ?? []).map(async (member) => {
      const authUser = await admin.auth.admin.getUserById(member.user_id);
      const authMember = authUser.data.user;
      const metadata = (authMember?.user_metadata ?? {}) as Record<string, unknown>;

      return {
        userId: member.user_id,
        displayName: getDisplayName(authMember?.email, metadata),
        email: authMember?.email ?? null,
        role: member.role
      };
    })
  );

  return NextResponse.json({ members });
}
