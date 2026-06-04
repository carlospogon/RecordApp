import { NextResponse } from "next/server";
import { logShoppingActivity } from "@/lib/shopping/activity-log";
import { sendPushNotificationToUsers } from "@/lib/push/send-push-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleItemForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AssignPayload = {
  assignedToUserId?: string | null;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as AssignPayload;
  const assignedToUserId =
    typeof body.assignedToUserId === "string" && body.assignedToUserId.trim() ? body.assignedToUserId.trim() : null;

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleItem = await getAccessibleItemForUser(id, user.id);

  if (!accessibleItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (assignedToUserId) {
    const { data: member } = await admin
      .from("shopping_list_members")
      .select("user_id")
      .eq("list_id", accessibleItem.listId)
      .eq("user_id", assignedToUserId)
      .maybeSingle();

    if (!member?.user_id) {
      return NextResponse.json({ error: "Ese miembro no pertenece a la lista." }, { status: 400 });
    }
  }

  const actorMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const actorDisplayName =
    (typeof actorMetadata.full_name === "string" && actorMetadata.full_name.trim()) ||
    (typeof actorMetadata.name === "string" && actorMetadata.name.trim()) ||
    (user.email?.split("@")[0] ?? "Usuario");

  const { data: itemRow } = await admin
    .from("shopping_items")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  const { data: listRow } = await admin.from("shopping_lists").select("title").eq("id", accessibleItem.listId).maybeSingle();

  const { error } = await admin.from("shopping_items").update({ assigned_to_user_id: assignedToUserId }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let assigneeDisplayName: string | null = null;

  if (assignedToUserId) {
    const authUser = await admin.auth.admin.getUserById(assignedToUserId);
    const assignee = authUser.data.user;
    const metadata = (assignee?.user_metadata ?? {}) as Record<string, unknown>;
    assigneeDisplayName =
      (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
      (typeof metadata.name === "string" && metadata.name.trim()) ||
      (assignee?.email?.split("@")[0] ?? "Usuario");
  }

  await logShoppingActivity({
    listId: accessibleItem.listId,
    actorUserId: user.id,
    eventType: "item_assigned",
    itemId: id,
    spaceId: accessibleItem.spaceId ?? null,
    subjectName: typeof itemRow?.name === "string" ? itemRow.name : null,
    metadata: {
      assignedToUserId,
      assigneeDisplayName
    }
  });

  if (assignedToUserId && assignedToUserId !== user.id) {
    await sendPushNotificationToUsers([assignedToUserId], {
      title: "RecordApp",
      body: `${actorDisplayName} te ha asignado ${itemRow?.name ?? "un producto"} en ${listRow?.title ?? "una lista compartida"}.`,
      url: `/app?list=${accessibleItem.listId}&tab=lista`
    });
  }

  return NextResponse.json({ assignedToUserId });
}
