import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function buildShareCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(_: Request, context: RouteContext) {
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

  if (!accessibleList?.id || accessibleList.ownerId !== user.id) {
    return NextResponse.json({ error: "Solo el propietario puede generar un código compartido." }, { status: 403 });
  }

  const { data: existingInvite } = await admin
    .from("shopping_list_invites")
    .select("list_id, share_code")
    .eq("list_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingInvite?.share_code) {
    await admin.from("shopping_lists").update({ shared: true }).eq("id", id);
    return NextResponse.json({
      invite: {
        listId: existingInvite.list_id,
        shareCode: existingInvite.share_code
      }
    });
  }

  const shareCode = buildShareCode();
  const { data, error } = await admin
    .from("shopping_list_invites")
    .insert({
      list_id: id,
      invited_by: user.id,
      share_code: shareCode
    })
    .select("list_id, share_code")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No se pudo generar el código." }, { status: 500 });
  }

  await admin.from("shopping_lists").update({ shared: true }).eq("id", id);

  return NextResponse.json({
    invite: {
      listId: data.list_id,
      shareCode: data.share_code
    }
  });
}
