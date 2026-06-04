import { NextResponse } from "next/server";
import { logShoppingActivity } from "@/lib/shopping/activity-log";
import { sendPushNotificationToUsers } from "@/lib/push/send-push-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleItemForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  const accessibleItem = await getAccessibleItemForUser(id, user.id);

  if (!accessibleItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { data: item, error: readError } = await admin
    .from("shopping_items")
    .select("id, name, status")
    .eq("id", id)
    .single();

  if (readError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const nextStatus = item.status === "bought" ? "pending" : "bought";
  const checkedAt = nextStatus === "bought" ? new Date().toISOString() : null;
  const { error: updateError } = await admin
    .from("shopping_items")
    .update({
      status: nextStatus,
      checked_at: checkedAt
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const actorMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const actorDisplayName =
    (typeof actorMetadata.full_name === "string" && actorMetadata.full_name.trim()) ||
    (typeof actorMetadata.name === "string" && actorMetadata.name.trim()) ||
    (user.email?.split("@")[0] ?? "Usuario");

  await logShoppingActivity({
    listId: accessibleItem.listId,
    actorUserId: user.id,
    eventType: nextStatus === "bought" ? "item_bought" : "item_reopened",
    itemId: id,
    spaceId: accessibleItem.spaceId ?? null,
    subjectName: item.name
  });

  if (nextStatus === "bought") {
    const [{ data: listMembers }, { data: listRow }] = await Promise.all([
      admin.from("shopping_list_members").select("user_id").eq("list_id", accessibleItem.listId),
      admin.from("shopping_lists").select("title").eq("id", accessibleItem.listId).maybeSingle()
    ]);

    const targetUserIds = (listMembers ?? [])
      .map((member) => member.user_id)
      .filter((memberUserId) => typeof memberUserId === "string" && memberUserId !== user.id);

    await sendPushNotificationToUsers(targetUserIds, {
      title: "RecordApp",
      body: `${actorDisplayName} ha marcado ${item.name} como comprado en ${listRow?.title ?? "la lista compartida"}.`,
      url: `/app?list=${accessibleItem.listId}&tab=lista`
    });
  }

  return NextResponse.json({ status: nextStatus, checkedAt });
}
