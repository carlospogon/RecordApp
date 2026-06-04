import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ShoppingActivityEventType =
  | "list_created"
  | "list_finalized"
  | "item_added"
  | "item_updated"
  | "item_deleted"
  | "item_assigned"
  | "item_bought"
  | "item_reopened";

type LogShoppingActivityInput = {
  listId: string;
  actorUserId: string;
  eventType: ShoppingActivityEventType;
  spaceId?: string | null;
  itemId?: string | null;
  subjectName?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logShoppingActivity({
  listId,
  actorUserId,
  eventType,
  spaceId = null,
  itemId = null,
  subjectName = null,
  metadata = {}
}: LogShoppingActivityInput) {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("shopping_activity_events").insert({
    list_id: listId,
    space_id: spaceId,
    item_id: itemId,
    actor_user_id: actorUserId,
    event_type: eventType,
    subject_name: subjectName,
    metadata
  });

  if (error) {
    throw new Error(error.message);
  }
}
