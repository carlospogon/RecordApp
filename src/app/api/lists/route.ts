import { NextResponse } from "next/server";
import { logShoppingActivity } from "@/lib/shopping/activity-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateListPayload = {
  id?: string;
  title?: string;
  shoppingDate?: string;
  reminderDate?: string;
  spaceId?: string;
  sourceListId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateListPayload;
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : crypto.randomUUID();
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Lista de compra";
  const shoppingDate = typeof body.shoppingDate === "string" ? body.shoppingDate.trim() : "";
  const reminderDate = typeof body.reminderDate === "string" && body.reminderDate.trim() ? body.reminderDate.trim() : null;
  const spaceId = typeof body.spaceId === "string" && body.spaceId.trim() ? body.spaceId.trim() : null;
  const sourceListId = typeof body.sourceListId === "string" && body.sourceListId.trim() ? body.sourceListId.trim() : null;

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

  let clonedItems: Array<{
    id: string;
    listId: string;
    name: string;
    normalizedName: string;
    quantity: string | null;
    unit: string | null;
    section: string | null;
    notes: string | null;
    assignedToUserId: string | null;
    status: "pending" | "bought";
    createdAt: string;
    updatedAt: string;
    checkedAt: string | null;
  }> = [];

  if (sourceListId) {
    const { data: sourceList, error: sourceListError } = await supabase
      .from("shopping_lists")
      .select("user_id")
      .eq("id", sourceListId)
      .maybeSingle();

    if (sourceListError || !sourceList) {
      await admin.from("shopping_lists").delete().eq("id", id);
      return NextResponse.json({ error: "No se encontro la lista que quieres reutilizar." }, { status: 404 });
    }

    const { data: sourceMembership, error: sourceMembershipError } = await supabase
      .from("shopping_list_members")
      .select("list_id")
      .eq("list_id", sourceListId)
      .eq("user_id", user.id)
      .maybeSingle();

    const canReuseSourceList = sourceList.user_id === user.id || Boolean(sourceMembership?.list_id);

    if (sourceMembershipError || !canReuseSourceList) {
      await admin.from("shopping_lists").delete().eq("id", id);
      return NextResponse.json({ error: "No tienes acceso a la lista que quieres reutilizar." }, { status: 403 });
    }

    const { data: sourceItems, error: sourceItemsError } = await supabase
      .from("shopping_items")
      .select("name, normalized_name, quantity, unit, section, notes")
      .eq("list_id", sourceListId)
      .order("created_at", { ascending: true });

    if (sourceItemsError) {
      await admin.from("shopping_lists").delete().eq("id", id);
      return NextResponse.json({ error: sourceItemsError.message }, { status: 500 });
    }

    const itemRows = (sourceItems ?? []).map((item) => {
      const itemId = crypto.randomUUID();

      return {
        id: itemId,
        list_id: id,
        user_id: user.id,
        name: item.name,
        normalized_name: item.normalized_name,
        quantity: item.quantity,
        unit: item.unit,
        section: item.section,
        notes: item.notes,
        status: "pending" as const
      };
    });

    if (itemRows.length > 0) {
      const { error: insertItemsError } = await admin.from("shopping_items").insert(itemRows);

      if (insertItemsError) {
        await admin.from("shopping_lists").delete().eq("id", id);
        return NextResponse.json({ error: insertItemsError.message }, { status: 500 });
      }

      clonedItems = itemRows.map((item) => ({
        id: item.id,
        listId: id,
        name: item.name,
        normalizedName: item.normalized_name,
        quantity: item.quantity,
        unit: item.unit,
        section: item.section,
        notes: item.notes,
        assignedToUserId: null,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        checkedAt: null
      }));
    }
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

  await logShoppingActivity({
    listId: id,
    actorUserId: user.id,
    eventType: "list_created",
    spaceId,
    subjectName: title,
    metadata: {
      listTitle: title
    }
  });

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
      itemCount: clonedItems.length
    },
    items: clonedItems
  });
}
