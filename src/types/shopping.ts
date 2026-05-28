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
  reminderDate?: string | null;
  reminderSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
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

export type AnalysisBucketKey = "vegetales" | "proteinas" | "carbohidratos" | "lacteos" | "otros";

export type AnalysisBucket = {
  key: AnalysisBucketKey;
  label: string;
  count: number;
  percentage: number;
  color: string;
};

export type AnalysisRecommendation = {
  title: string;
  body: string;
  productName?: string;
  quantity?: string | null;
  unit?: string | null;
};

export type ShoppingAnalysis = {
  consideredListsCount: number;
  totalItems: number;
  buckets: AnalysisBucket[];
  findings: string[];
  recommendations: AnalysisRecommendation[];
};

export type ScheduledListReminder = {
  listId: string;
  title: string;
  shoppingDate: string;
  reminderDate: string;
  isDue: boolean;
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
  suggestionItems: ShoppingItem[];
  scheduledListReminders: ScheduledListReminder[];
  reminders: ReminderSuggestion[];
  frequentProducts: ProductInsight[];
  catalogProducts: ProductCatalogItem[];
  analysis: ShoppingAnalysis;
  selectedListId?: string | null;
};
