import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type JoinListPayload = {
  shareCode?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as JoinListPayload;
  const shareCode = typeof body.shareCode === "string" ? body.shareCode.trim().toUpperCase() : "";

  if (!shareCode) {
    return NextResponse.json({ error: "Introduce un codigo valido." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invite, error: inviteError } = await admin
    .from("shopping_list_invites")
    .select("list_id, expires_at")
    .eq("share_code", shareCode)
    .maybeSingle();

  if (inviteError || !invite?.list_id) {
    return NextResponse.json({ error: "No hemos encontrado ninguna lista con ese codigo." }, { status: 404 });
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Este codigo ha caducado." }, { status: 410 });
  }

  const { data: list, error: listError } = await admin
    .from("shopping_lists")
    .select("id, user_id, shared, title, shopping_date, reminder_date, reminder_sent_at, created_at, updated_at, completed_at")
    .eq("id", invite.list_id)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: "No se pudo recuperar la lista." }, { status: 404 });
  }

  if (list.user_id !== user.id) {
    const { error: membershipError } = await admin.from("shopping_list_members").upsert(
      {
        list_id: list.id,
        user_id: user.id,
        role: "editor"
      },
      {
        onConflict: "list_id,user_id"
      }
    );

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }
  }

  await admin.from("shopping_lists").update({ shared: true }).eq("id", list.id);

  return NextResponse.json({
    list: {
      id: list.id,
      ownerId: list.user_id,
      title: list.title,
      shared: true,
      accessRole: list.user_id === user.id ? "owner" : "editor",
      shoppingDate: list.shopping_date,
      reminderDate: list.reminder_date,
      reminderSentAt: list.reminder_sent_at,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
      completedAt: list.completed_at,
      itemCount: 0
    }
  });
}
