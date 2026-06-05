import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";

type CreateTemplatePayload = {
  listId?: string;
  title?: string;
  description?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateTemplatePayload;
  const listId = typeof body.listId === "string" && body.listId.trim() ? body.listId.trim() : "";
  const requestedTitle = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;

  if (!listId) {
    return NextResponse.json({ error: "Falta la lista origen." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleList = await getAccessibleListForUser(listId, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a la lista que quieres guardar como plantilla." }, { status: 403 });
  }

  const { data: sourceList, error: sourceListError } = await admin
    .from("shopping_lists")
    .select("id, title, space_id")
    .eq("id", listId)
    .maybeSingle();

  if (sourceListError || !sourceList) {
    return NextResponse.json({ error: "No se encontro la lista origen." }, { status: 404 });
  }

  const { data: sourceItems, error: sourceItemsError } = await admin
    .from("shopping_items")
    .select("name, normalized_name, quantity, unit, section, notes, created_at")
    .eq("list_id", listId)
    .order("created_at", { ascending: true });

  if (sourceItemsError) {
    return NextResponse.json({ error: sourceItemsError.message }, { status: 500 });
  }

  if (!sourceItems || sourceItems.length === 0) {
    return NextResponse.json({ error: "No puedes crear una plantilla vacia." }, { status: 400 });
  }

  const templateTitle = requestedTitle || `${sourceList.title} (plantilla)`;
  let spaceName: string | null = null;

  if (sourceList.space_id) {
    const { data: spaceData } = await admin.from("shopping_spaces").select("name").eq("id", sourceList.space_id).maybeSingle();
    spaceName = typeof spaceData?.name === "string" ? spaceData.name : null;
  }
  const now = new Date().toISOString();
  const templateId = crypto.randomUUID();

  const { error: templateError } = await admin.from("shopping_list_templates").insert({
    id: templateId,
    user_id: user.id,
    space_id: sourceList.space_id,
    source_list_id: sourceList.id,
    title: templateTitle,
    description
  });

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 500 });
  }

  const templateItems = sourceItems.map((item, index) => ({
    template_id: templateId,
    name: item.name,
    normalized_name: item.normalized_name,
    quantity: item.quantity,
    unit: item.unit,
    section: item.section,
    notes: item.notes,
    position: index
  }));

  const { error: templateItemsError } = await admin.from("shopping_list_template_items").insert(templateItems);

  if (templateItemsError) {
    await admin.from("shopping_list_templates").delete().eq("id", templateId);
    return NextResponse.json({ error: templateItemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    template: {
      id: templateId,
      ownerId: user.id,
      spaceId: sourceList.space_id,
      spaceName,
      sourceListId: sourceList.id,
      title: templateTitle,
      description,
      createdAt: now,
      updatedAt: now,
      itemCount: templateItems.length
    }
  });
}
