import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleTemplateForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type InstantiateTemplatePayload = {
  listId?: string;
  title?: string;
  shoppingDate?: string;
  spaceId?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as InstantiateTemplatePayload;
  const listId = typeof body.listId === "string" && body.listId.trim() ? body.listId.trim() : crypto.randomUUID();
  const requestedTitle = typeof body.title === "string" ? body.title.trim() : "";
  const shoppingDate = typeof body.shoppingDate === "string" && body.shoppingDate.trim() ? body.shoppingDate.trim() : "";
  const overrideSpaceId = typeof body.spaceId === "string" && body.spaceId.trim() ? body.spaceId.trim() : null;

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

  const accessibleTemplate = await getAccessibleTemplateForUser(id, user.id);

  if (!accessibleTemplate?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta plantilla." }, { status: 403 });
  }

  const { data: template, error: templateError } = await admin
    .from("shopping_list_templates")
    .select("id, title, description, space_id")
    .eq("id", id)
    .maybeSingle();

  if (templateError || !template) {
    return NextResponse.json({ error: "No se encontro la plantilla." }, { status: 404 });
  }

  const targetSpaceId = overrideSpaceId ?? template.space_id ?? null;
  let targetSpaceName: string | null = null;

  if (targetSpaceId) {
    const { data: membership, error: membershipError } = await admin
      .from("shopping_space_members")
      .select("space_id")
      .eq("space_id", targetSpaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership?.space_id) {
      return NextResponse.json({ error: "No tienes acceso al espacio destino." }, { status: 403 });
    }

    const { data: spaceData } = await admin.from("shopping_spaces").select("name").eq("id", targetSpaceId).maybeSingle();
    targetSpaceName = typeof spaceData?.name === "string" ? spaceData.name : null;
  }

  const { data: templateItems, error: templateItemsError } = await admin
    .from("shopping_list_template_items")
    .select("name, normalized_name, quantity, unit, section, notes, position")
    .eq("template_id", id)
    .order("position", { ascending: true });

  if (templateItemsError) {
    return NextResponse.json({ error: templateItemsError.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const finalTitle = requestedTitle || template.title.replace(/\s*\(plantilla\)$/i, "").trim() || "Lista de compra";

  const { error: listError } = await admin.from("shopping_lists").insert({
    id: listId,
    user_id: user.id,
    space_id: targetSpaceId,
    shared: Boolean(targetSpaceId),
    title: finalTitle,
    shopping_date: shoppingDate,
    reminder_date: null
  });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  if (targetSpaceId) {
    const { data: members, error: membersError } = await admin
      .from("shopping_space_members")
      .select("user_id")
      .eq("space_id", targetSpaceId);

    if (membersError) {
      await admin.from("shopping_lists").delete().eq("id", listId);
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const { error: membershipInsertError } = await admin.from("shopping_list_members").upsert(
      (members ?? []).map((member) => ({
        list_id: listId,
        user_id: member.user_id,
        role: member.user_id === user.id ? "owner" : "editor"
      })),
      { onConflict: "list_id,user_id" }
    );

    if (membershipInsertError) {
      await admin.from("shopping_lists").delete().eq("id", listId);
      return NextResponse.json({ error: membershipInsertError.message }, { status: 500 });
    }
  }

  const insertedItems = (templateItems ?? []).map((item) => {
    const itemId = crypto.randomUUID();

    return {
      row: {
        id: itemId,
        list_id: listId,
        user_id: user.id,
        name: item.name,
        normalized_name: item.normalized_name,
        quantity: item.quantity,
        unit: item.unit,
        section: item.section,
        notes: item.notes,
        status: "pending" as const
      },
      payload: {
        id: itemId,
        listId,
        name: item.name,
        normalizedName: item.normalized_name,
        quantity: item.quantity,
        unit: item.unit,
        section: item.section,
        notes: item.notes,
        assignedToUserId: null,
        status: "pending" as const,
        createdAt: now,
        updatedAt: now,
        checkedAt: null
      }
    };
  });

  if (insertedItems.length > 0) {
    const { error: insertItemsError } = await admin.from("shopping_items").insert(insertedItems.map((item) => item.row));

    if (insertItemsError) {
      await admin.from("shopping_lists").delete().eq("id", listId);
      return NextResponse.json({ error: insertItemsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    list: {
      id: listId,
      ownerId: user.id,
      spaceId: targetSpaceId,
      spaceName: targetSpaceName,
      shared: Boolean(targetSpaceId),
      accessRole: "owner",
      title: finalTitle,
      shoppingDate,
      reminderDate: null,
      reminderSentAt: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      itemCount: insertedItems.length
    },
    items: insertedItems.map((item) => item.payload)
  });
}
