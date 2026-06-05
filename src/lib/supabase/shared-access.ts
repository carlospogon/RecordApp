import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AccessibleList = {
  id: string;
  ownerId: string;
  spaceId?: string | null;
};

type AccessibleTemplate = {
  id: string;
  ownerId: string;
  spaceId?: string | null;
};

export async function getAccessibleListForUser(listId: string, userId: string): Promise<AccessibleList | null> {
  const admin = createSupabaseAdminClient();

  const { data: list, error: listError } = await admin
    .from("shopping_lists")
    .select("id, user_id, space_id")
    .eq("id", listId)
    .maybeSingle();

  if (listError || !list) {
    return null;
  }

  if (list.user_id === userId) {
    return {
      id: list.id,
      ownerId: list.user_id,
      spaceId: list.space_id ?? null
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
    ownerId: list.user_id,
    spaceId: list.space_id ?? null
  };
}

export async function getAccessibleItemForUser(
  itemId: string,
  userId: string
): Promise<{ itemId: string; listId: string; spaceId?: string | null } | null> {
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
    listId: item.list_id,
    spaceId: accessibleList.spaceId ?? null
  };
}

export async function getAccessibleTemplateForUser(templateId: string, userId: string): Promise<AccessibleTemplate | null> {
  const admin = createSupabaseAdminClient();

  const { data: template, error: templateError } = await admin
    .from("shopping_list_templates")
    .select("id, user_id, space_id")
    .eq("id", templateId)
    .maybeSingle();

  if (templateError || !template) {
    return null;
  }

  if (template.user_id === userId) {
    return {
      id: template.id,
      ownerId: template.user_id,
      spaceId: template.space_id ?? null
    };
  }

  if (!template.space_id) {
    return null;
  }

  const { data: membership, error: membershipError } = await admin
    .from("shopping_space_members")
    .select("space_id")
    .eq("space_id", template.space_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError || !membership?.space_id) {
    return null;
  }

  return {
    id: template.id,
    ownerId: template.user_id,
    spaceId: template.space_id ?? null
  };
}
