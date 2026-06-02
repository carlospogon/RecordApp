import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateListPayload = {
  id?: string;
  title?: string;
  shoppingDate?: string;
  reminderDate?: string;
  spaceId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateListPayload;
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : crypto.randomUUID();
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Lista de compra";
  const shoppingDate = typeof body.shoppingDate === "string" ? body.shoppingDate.trim() : "";
  const reminderDate = typeof body.reminderDate === "string" && body.reminderDate.trim() ? body.reminderDate.trim() : null;
  const spaceId = typeof body.spaceId === "string" && body.spaceId.trim() ? body.spaceId.trim() : null;

  if (!shoppingDate) {
    return NextResponse.json({ error: "Introduce una fecha valida para crear la lista." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let spaceName: string | null = null;
  let shared = false;

  if (spaceId) {
    const { data: spaceMembership, error: spaceMembershipError } = await supabase
      .from("shopping_space_members")
      .select("space_id")
      .eq("space_id", spaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (spaceMembershipError || !spaceMembership?.space_id) {
      return NextResponse.json({ error: "No tienes acceso a ese espacio." }, { status: 403 });
    }

    const { data: space, error: spaceError } = await supabase
      .from("shopping_spaces")
      .select("name")
      .eq("id", spaceId)
      .maybeSingle();

    if (spaceError || !space?.name) {
      return NextResponse.json({ error: "No se pudo recuperar el espacio." }, { status: 404 });
    }

    spaceName = space.name;
    shared = true;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({
      id,
      user_id: user.id,
      space_id: spaceId,
      shared,
      title,
      shopping_date: shoppingDate,
      reminder_date: reminderDate
    });

  if (error) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear la lista." }, { status: 500 });
  }

  if (spaceId) {
    const { data: members, error: membersError } = await admin
      .from("shopping_space_members")
      .select("user_id, role")
      .eq("space_id", spaceId);

    if (membersError) {
      await admin.from("shopping_lists").delete().eq("id", id);
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const listMembers = (members ?? []).map((member) => ({
      list_id: id,
      user_id: member.user_id,
      role: member.user_id === user.id ? "owner" : "editor"
    }));

    const { error: membershipError } = await admin.from("shopping_list_members").upsert(listMembers, {
      onConflict: "list_id,user_id"
    });

    if (membershipError) {
      await admin.from("shopping_lists").delete().eq("id", id);
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    list: {
      id,
      ownerId: user.id,
      spaceId,
      spaceName,
      shared,
      accessRole: "owner",
      title,
      shoppingDate,
      reminderDate,
      reminderSentAt: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      itemCount: 0
    }
  });
}
