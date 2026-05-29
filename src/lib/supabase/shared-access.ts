import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AccessibleList = {
  id: string;
  ownerId: string;
};

export async function getAccessibleListForUser(listId: string, userId: string): Promise<AccessibleList | null> {
  const admin = createSupabaseAdminClient();

  const { data: list, error: listError } = await admin
    .from("shopping_lists")
    .select("id, user_id")
    .eq("id", listId)
    .maybeSingle();

  if (listError || !list) {
    return null;
  }

  if (list.user_id === userId) {
    return {
      id: list.id,
      ownerId: list.user_id
    };
  }

  const { data: membership, error: membershipError } = await admin
    .from("shopping_list_members")
    .select("list_id")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError || !membership?.list_id) {
    return null;
  }

  return {
    id: list.id,
    ownerId: list.user_id
  };
}

export async function getAccessibleItemForUser(itemId: string, userId: string): Promise<{ itemId: string; listId: string } | null> {
  const admin = createSupabaseAdminClient();

  const { data: item, error: itemError } = await admin
    .from("shopping_items")
    .select("id, list_id")
    .eq("id", itemId)
    .maybeSingle();

  if (itemError || !item) {
    return null;
  }

  const accessibleList = await getAccessibleListForUser(item.list_id, userId);

  if (!accessibleList) {
    return null;
  }

  return {
    itemId: item.id,
    listId: item.list_id
  };
}
