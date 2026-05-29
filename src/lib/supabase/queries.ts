import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { buildShoppingAnalysis } from "@/lib/shopping/analysis";
import { buildReminders, buildProductInsights } from "@/lib/shopping/product-insights";
import { normalizeProductName } from "@/lib/shopping/normalize-product";
import {
  ProductCatalogItem,
  ProductInsight,
  ScheduledListReminder,
  ShoppingDashboardData,
  ShoppingDuplicateNotice,
  ShoppingItem,
  ShoppingList,
  ShoppingListInvite
} from "@/types/shopping";

type ShoppingListRow = {
  id: string;
  user_id?: string;
  shared?: boolean | null;
  title: string;
  shopping_date: string;
  reminder_date?: string | null;
  reminder_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
};

type ShoppingItemRow = {
  id: string;
  list_id: string;
  name: string;
  normalized_name: string;
  quantity: string | null;
  unit: string | null;
  status: "pending" | "bought";
  created_at: string;
  updated_at: string;
  checked_at: string | null;
};

type ShoppingProductRow = {
  id: string;
  name: string;
  normalized_name: string;
  default_unit: string | null;
  category: ProductCatalogItem["category"] | null;
  active: boolean;
};

type ShoppingListMemberRow = {
  list_id: string;
  role: "owner" | "editor";
};

function mapListRow(row: ShoppingListRow): ShoppingList {
  return {
    id: row.id,
    ownerId: row.user_id,
    shared: row.shared ?? false,
    accessRole: row.user_id ? "owner" : null,
    title: row.title,
    shoppingDate: row.shopping_date,
    reminderDate: row.reminder_date ?? null,
    reminderSentAt: row.reminder_sent_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null
  };
}

function mapItemRow(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    normalizedName: row.normalized_name,
    quantity: row.quantity,
    unit: row.unit,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    checkedAt: row.checked_at
  };
}

function mapProductRow(row: ShoppingProductRow): ProductCatalogItem {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    defaultUnit: row.default_unit,
    category: row.category,
    active: row.active,
    source: "catalog"
  };
}

function buildHistoryCatalog(items: ShoppingItem[]): ProductCatalogItem[] {
  const seen = new Map<string, ProductCatalogItem>();

  for (const item of items) {
    if (!seen.has(item.normalizedName)) {
      seen.set(item.normalizedName, {
        name: item.name,
        normalizedName: item.normalizedName,
        defaultUnit: item.unit,
        source: "history"
      });
    }
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

async function getCatalogProducts(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, items: ShoppingItem[]) {
  try {
    const { data, error } = await supabase
      .from("shopping_products")
      .select("id, name, normalized_name, default_unit, category, active")
      .order("name", { ascending: true })
      .limit(200);

    if (error) {
      throw error;
    }

    const catalog = (data ?? []).map((row) => mapProductRow(row as ShoppingProductRow));
    const fallbackHistory = buildHistoryCatalog(items).filter(
      (item) => !catalog.some((catalogItem) => catalogItem.normalizedName === item.normalizedName)
    );

    return [...catalog, ...fallbackHistory];
  } catch {
    return buildHistoryCatalog(items);
  }
}

export async function requireAuthenticatedUser() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user ?? null;
}

export async function getShoppingDashboardData(selectedListId?: string | null): Promise<ShoppingDashboardData | null> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const user = await requireAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: memberRows } = await supabase
    .from("shopping_list_members")
    .select("list_id, role");
  const memberRoleByListId = new Map((memberRows ?? []).map((row) => [(row as ShoppingListMemberRow).list_id, (row as ShoppingListMemberRow).role]));
  let listsData: ShoppingListRow[] | null = null;
  let listError: { message: string } | null = null;

  try {
    const response = await supabase
      .from("shopping_lists")
      .select("id, user_id, shared, title, shopping_date, reminder_date, reminder_sent_at, created_at, updated_at, completed_at")
      .order("shopping_date", { ascending: false })
      .order("created_at", { ascending: false });

    listsData = response.data as ShoppingListRow[] | null;
    listError = response.error ? { message: response.error.message } : null;
  } catch {
    const fallbackResponse = await supabase
      .from("shopping_lists")
      .select("id, user_id, shared, title, shopping_date, created_at, updated_at")
      .order("shopping_date", { ascending: false })
      .order("created_at", { ascending: false });

    listsData = fallbackResponse.data as ShoppingListRow[] | null;
    listError = fallbackResponse.error ? { message: fallbackResponse.error.message } : null;
  }

  if (listError) {
    throw new Error(listError.message);
  }

  const { data: allItemsData, error: allItemsError } = await supabase
    .from("shopping_items")
    .select("id, list_id, name, normalized_name, quantity, unit, status, created_at, updated_at, checked_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (allItemsError) {
    throw new Error(allItemsError.message);
  }

  const allItems = (allItemsData ?? []).map((row) => mapItemRow(row as ShoppingItemRow));
  const itemCountByListId = allItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.listId] = (acc[item.listId] ?? 0) + 1;
    return acc;
  }, {});
  const lists = (listsData ?? []).map((row) => {
    const list = mapListRow(row as ShoppingListRow);
    return {
      ...list,
      accessRole: row.user_id === user.id ? "owner" : memberRoleByListId.get(list.id) ?? null,
      itemCount: itemCountByListId[list.id] ?? 0
    };
  });
  const currentList = selectedListId ? lists.find((list) => list.id === selectedListId) ?? null : null;

  const items = allItems
    .filter((item) => item.listId === currentList?.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const suggestionItems = (() => {
    const latestBoughtByProduct = new Map<string, ShoppingItem>();

    for (const item of allItems) {
      if (item.status !== "bought") {
        continue;
      }

      const current = latestBoughtByProduct.get(item.normalizedName);
      const currentDate = current ? new Date(current.checkedAt ?? current.updatedAt ?? current.createdAt).getTime() : 0;
      const candidateDate = new Date(item.checkedAt ?? item.updatedAt ?? item.createdAt).getTime();

      if (!current || candidateDate > currentDate) {
        latestBoughtByProduct.set(item.normalizedName, item);
      }
    }

    return [...latestBoughtByProduct.values()].sort((a, b) => {
      const aDate = new Date(a.checkedAt ?? a.updatedAt ?? a.createdAt).getTime();
      const bDate = new Date(b.checkedAt ?? b.updatedAt ?? b.createdAt).getTime();
      return bDate - aDate;
    });
  })();
  const frequentProducts = buildProductInsights(allItems);
  const reminders = buildReminders(frequentProducts);
  const catalogProducts = await getCatalogProducts(supabase, allItems);
  const today = new Date().toISOString().slice(0, 10);
  const scheduledListReminders: ScheduledListReminder[] = lists
    .filter((list) => !list.completedAt && list.reminderDate)
    .map((list) => ({
      listId: list.id,
      title: list.title,
      shoppingDate: list.shoppingDate,
      reminderDate: list.reminderDate as string,
      isDue: (list.reminderDate as string) <= today
    }))
    .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate));
  const analysis = buildShoppingAnalysis({
    lists,
    items: allItems,
    catalogProducts
  });

  return {
    userEmail: user.email ?? "Usuario",
    currentList,
    lists,
    items,
    suggestionItems,
    scheduledListReminders,
    reminders,
    frequentProducts,
    catalogProducts,
    analysis,
    selectedListId: currentList?.id ?? null
  };
}

export async function getExistingInviteForList(listId: string): Promise<ShoppingListInvite | null> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const user = await requireAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_list_invites")
    .select("list_id, share_code")
    .eq("list_id", listId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    listId: data.list_id,
    shareCode: data.share_code
  };
}

export async function findDuplicateNotice(productName: string): Promise<ShoppingDuplicateNotice | null> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const user = await requireAuthenticatedUser();

  if (!user) {
    return null;
  }

  const normalized = normalizeProductName(productName);

  if (!normalized) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, list_id, name, normalized_name, quantity, unit, status, created_at, updated_at, checked_at")
    .eq("normalized_name", normalized)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((row) => mapItemRow(row as ShoppingItemRow));

  if (items.length === 0) {
    return null;
  }

  const lastItem = items[0];
  let lastListTitle: string | undefined;

  if (lastItem?.listId) {
    const { data: listData } = await supabase
      .from("shopping_lists")
      .select("title")
      .eq("id", lastItem.listId)
      .maybeSingle();

    lastListTitle = typeof listData?.title === "string" ? listData.title : undefined;
  }

  return {
    normalizedName: normalized,
    lastSeenAt: lastItem?.createdAt,
    lastListTitle,
    lastQuantity: lastItem?.quantity,
    lastUnit: lastItem?.unit,
    lastStatus: lastItem?.status,
    appearances: items.length,
    message:
      "Ojo, este producto ya aparecio en una lista anterior. Revisa si todavia tienes suficiente antes de volver a comprarlo."
  };
}

export function getFrequentProductsForView(insights: ProductInsight[], limit = 8) {
  return insights.slice(0, limit);
}
