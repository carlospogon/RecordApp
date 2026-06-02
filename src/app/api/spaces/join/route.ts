import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type JoinSpacePayload = {
  shareCode?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as JoinSpacePayload;
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

  const { data: space, error: spaceError } = await admin
    .from("shopping_spaces")
    .select("id, user_id, name, share_code, created_at, updated_at")
    .eq("share_code", shareCode)
    .maybeSingle();

  if (spaceError || !space?.id) {
    return NextResponse.json({ error: "No hemos encontrado ningun espacio con ese codigo." }, { status: 404 });
  }

  const { error: membershipError } = await admin.from("shopping_space_members").upsert(
    {
      space_id: space.id,
      user_id: user.id,
      role: space.user_id === user.id ? "owner" : "editor"
    },
    {
      onConflict: "space_id,user_id"
    }
  );

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const { data: listRows, error: listsError } = await admin
    .from("shopping_lists")
    .select("id, user_id, space_id, shared, title, shopping_date, reminder_date, reminder_sent_at, created_at, updated_at, completed_at")
    .eq("space_id", space.id)
    .order("shopping_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (listsError) {
    return NextResponse.json({ error: listsError.message }, { status: 500 });
  }

  const lists = listRows ?? [];

  if (lists.length > 0) {
    const { error: listMembershipError } = await admin.from("shopping_list_members").upsert(
      lists.map((list) => ({
        list_id: list.id,
        user_id: user.id,
        role: list.user_id === user.id ? "owner" : "editor"
      })),
      {
        onConflict: "list_id,user_id"
      }
    );

    if (listMembershipError) {
      return NextResponse.json({ error: listMembershipError.message }, { status: 500 });
    }
  }

  const { data: spaceMembers } = await admin.from("shopping_space_members").select("space_id").eq("space_id", space.id);

  return NextResponse.json({
    space: {
      id: space.id,
      ownerId: space.user_id,
      name: space.name,
      shareCode: space.share_code,
      accessRole: space.user_id === user.id ? "owner" : "editor",
      memberCount: (spaceMembers ?? []).length,
      listCount: lists.length,
      createdAt: space.created_at,
      updatedAt: space.updated_at
    },
    lists: lists.map((list) => ({
      id: list.id,
      ownerId: list.user_id,
      spaceId: list.space_id,
      spaceName: space.name,
      title: list.title,
      shared: list.shared ?? true,
      accessRole: list.user_id === user.id ? "owner" : "editor",
      shoppingDate: list.shopping_date,
      reminderDate: list.reminder_date,
      reminderSentAt: list.reminder_sent_at,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
      completedAt: list.completed_at,
      itemCount: 0
    }))
  });
}
