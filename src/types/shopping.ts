export type ShoppingItemStatus = "pending" | "bought";

export type ProductCategory =
  | "fruta"
  | "verdura"
  | "lacteos"
  | "huevos"
  | "panaderia"
  | "carne"
  | "pescado"
  | "despensa"
  | "bebidas"
  | "hogar"
  | "otros";

export type ShoppingList = {
  id: string;
  title: string;
  shoppingDate: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
};

export type ShoppingItem = {
  id: string;
  listId: string;
  name: string;
  normalizedName: string;
  quantity?: string | null;
  unit?: string | null;
  status: ShoppingItemStatus;
  createdAt: string;
  updatedAt: string;
  checkedAt?: string | null;
};

export type ProductHistoryEntry = {
  itemId: string;
  listId: string;
  date: string;
  quantity?: string | null;
  unit?: string | null;
  status: ShoppingItemStatus;
};

export type ProductInsight = {
  normalizedName: string;
  displayName: string;
  appearances: number;
  lastSeenAt?: string;
  averageIntervalDays?: number;
  estimatedNextPurchaseAt?: string;
  history: ProductHistoryEntry[];
};

export type ReminderSuggestion = {
  product: string;
  message: string;
  estimatedNextPurchaseAt: string;
};

export type ProductCatalogItem = {
  id?: string;
  name: string;
  normalizedName: string;
  defaultUnit?: string | null;
  category?: ProductCategory | null;
  active?: boolean;
  source: "catalog" | "history";
};

export type ShoppingDuplicateNotice = {
  normalizedName: string;
  lastSeenAt?: string;
  lastListTitle?: string;
  lastQuantity?: string | null;
  lastUnit?: string | null;
  lastStatus?: ShoppingItemStatus;
  appearances: number;
  message: string;
};

export type ShoppingDashboardData = {
  userEmail: string;
  currentList: ShoppingList | null;
  lists: ShoppingList[];
  items: ShoppingItem[];
  reminders: ReminderSuggestion[];
  frequentProducts: ProductInsight[];
  catalogProducts: ProductCatalogItem[];
  selectedListId?: string | null;
};
