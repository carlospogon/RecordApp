import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";
import { ShoppingActivityEvent } from "@/types/shopping";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ActivityRow = {
  id: string;
  actor_user_id: string;
  event_type: ShoppingActivityEvent["eventType"];
  subject_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function getDisplayName(email: string | undefined, metadata: Record<string, unknown> | undefined) {
  return (
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata?.name === "string" && metadata.name.trim()) ||
    (email?.split("@")[0] ?? "Usuario")
  );
}

function buildDetail(eventType: ShoppingActivityEvent["eventType"], metadata: Record<string, unknown> | null) {
  if (!metadata) {
    return null;
  }

  if (eventType === "item_assigned") {
    const assigneeName = typeof metadata.assigneeDisplayName === "string" ? metadata.assigneeDisplayName : null;
    return assigneeName ? `Asignado a ${assigneeName}` : "Asignación actualizada";
  }

  if (eventType === "item_updated") {
    const fields = Array.isArray(metadata.changedFields) ? metadata.changedFields.filter((value): value is string => typeof value === "string") : [];
    return fields.length > 0 ? `Cambios: ${fields.join(", ")}` : "Producto actualizado";
  }

  if (eventType === "item_deleted") {
    return "Producto eliminado de la lista";
  }

  if (eventType === "list_created") {
    const title = typeof metadata.listTitle === "string" ? metadata.listTitle : null;
    return title ? `Lista: ${title}` : "Nueva lista compartida";
  }

  if (eventType === "list_finalized") {
    return "La lista se ha cerrado";
  }

  return null;
}

export async function GET(_: Request, context: RouteContext) {
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

  const { data, error } = await admin
    .from("shopping_activity_events")
    .select("id, actor_user_id, event_type, subject_name, metadata, created_at")
    .eq("list_id", id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actorIds = [...new Set(((data ?? []) as ActivityRow[]).map((row) => row.actor_user_id))];
  const actorEntries = await Promise.all(
    actorIds.map(async (actorUserId) => {
      const authUser = await admin.auth.admin.getUserById(actorUserId);
      const actor = authUser.data.user;
      const metadata = (actor?.user_metadata ?? {}) as Record<string, unknown>;

      return [
        actorUserId,
        {
          displayName: getDisplayName(actor?.email, metadata)
        }
      ] as const;
    })
  );
  const actorById = new Map(actorEntries);

  const activity = ((data ?? []) as ActivityRow[]).map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorDisplayName: actorById.get(row.actor_user_id)?.displayName ?? "Usuario",
    eventType: row.event_type,
    subjectName: row.subject_name,
    detail: buildDetail(row.event_type, row.metadata),
    createdAt: row.created_at
  })) satisfies ShoppingActivityEvent[];

  return NextResponse.json({ activity });
}
