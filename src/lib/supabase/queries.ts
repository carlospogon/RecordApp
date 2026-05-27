import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { buildReminders, buildProductInsights } from "@/lib/shopping/product-insights";
import { normalizeProductName } from "@/lib/shopping/normalize-product";
import {
  ProductCatalogItem,
  ProductInsight,
  ShoppingDashboardData,
  ShoppingDuplicateNotice,
  ShoppingItem,
  ShoppingList
} from "@/types/shopping";

type ShoppingListRow = {
  id: string;
  title: string;
  shopping_date: string;
  created_at: string;
  updated_at: string;
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

function mapListRow(row: ShoppingListRow): ShoppingList {
  return {
    id: row.id,
    title: row.title,
    shoppingDate: row.shopping_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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
  const { data: listsData, error: listError } = await supabase
    .from("shopping_lists")
    .select("id, title, shopping_date, created_at, updated_at")
    .order("shopping_date", { ascending: false })
    .order("created_at", { ascending: false });

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
      itemCount: itemCountByListId[list.id] ?? 0
    };
  });
  const currentList =
    lists.find((list) => list.id === selectedListId) ??
    lists[0] ??
    null;

  const items = allItems
    .filter((item) => item.listId === currentList?.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const frequentProducts = buildProductInsights(allItems);
  const reminders = buildReminders(frequentProducts);
  const catalogProducts = await getCatalogProducts(supabase, allItems);

  return {
    userEmail: user.email ?? "Usuario",
    currentList,
    lists,
    items,
    reminders,
    frequentProducts,
    catalogProducts,
    selectedListId: currentList?.id ?? null
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
