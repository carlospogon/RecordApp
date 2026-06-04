import { NextResponse } from "next/server";
import { logShoppingActivity } from "@/lib/shopping/activity-log";
import { sendPushNotificationToUsers } from "@/lib/push/send-push-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";

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

  const accessibleList = await getAccessibleListForUser(id, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta lista." }, { status: 403 });
  }

  const { data: listRow } = await admin.from("shopping_lists").select("title").eq("id", id).maybeSingle();

  const completedAt = new Date().toISOString();
  // RLS decides whether the authenticated user can update this list.
  // Shared members will be able to finalize once the shared-list policies are active.
  const { error } = await supabase
    .from("shopping_lists")
    .update({
      completed_at: completedAt
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actorMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const actorDisplayName =
    (typeof actorMetadata.full_name === "string" && actorMetadata.full_name.trim()) ||
    (typeof actorMetadata.name === "string" && actorMetadata.name.trim()) ||
    (user.email?.split("@")[0] ?? "Usuario");

  await logShoppingActivity({
    listId: id,
    actorUserId: user.id,
    eventType: "list_finalized",
    spaceId: accessibleList.spaceId ?? null,
    subjectName: typeof listRow?.title === "string" ? listRow.title : null
  });

  const { data: listMembers } = await admin.from("shopping_list_members").select("user_id").eq("list_id", id);
  const targetUserIds = (listMembers ?? [])
    .map((member) => member.user_id)
    .filter((memberUserId) => typeof memberUserId === "string" && memberUserId !== user.id);

  await sendPushNotificationToUsers(targetUserIds, {
    title: "RecordApp",
    body: `${actorDisplayName} ha finalizado ${typeof listRow?.title === "string" ? listRow.title : "la lista compartida"}.`,
    url: `/app?tab=historial`
  });

  return NextResponse.json({ ok: true, completedAt });
}
