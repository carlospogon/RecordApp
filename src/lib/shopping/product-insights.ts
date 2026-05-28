import { ProductCategory, ProductInsight, ShoppingItem } from "@/types/shopping";

const categoryEstimateDays: Record<ProductCategory, number> = {
  fruta: 5,
  verdura: 6,
  lacteos: 7,
  huevos: 12,
  panaderia: 4,
  carne: 5,
  pescado: 3,
  despensa: 14,
  bebidas: 10,
  hogar: 21,
  otros: 7
};

const categoryEstimateLabels: Record<ProductCategory, string> = {
  fruta: "fruta fresca",
  verdura: "verdura fresca",
  lacteos: "lacteos",
  huevos: "huevos",
  panaderia: "panaderia",
  carne: "carne",
  pescado: "pescado",
  despensa: "despensa seca",
  bebidas: "bebidas",
  hogar: "productos de hogar",
  otros: "productos generales"
};

function diffInDays(from: Date, to: Date) {
  const delta = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)));
}

function average(values: number[]) {
  if (values.length === 0) {
    return undefined;
  }

  const result = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return result > 0 ? result : undefined;
}

export function buildProductInsights(items: ShoppingItem[]): ProductInsight[] {
  const grouped = new Map<string, ShoppingItem[]>();

  for (const item of items) {
    const list = grouped.get(item.normalizedName) ?? [];
    list.push(item);
    grouped.set(item.normalizedName, list);
  }

  return [...grouped.entries()]
    .map(([normalizedName, group]) => {
      const ordered = [...group].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const boughtOrdered = ordered.filter((item) => item.status === "bought" && item.checkedAt);
      const dates = (boughtOrdered.length > 0 ? boughtOrdered : ordered).map((item) =>
        new Date(item.checkedAt ?? item.createdAt)
      );
      const intervals: number[] = [];

      for (let index = 1; index < dates.length; index += 1) {
        intervals.push(diffInDays(dates[index - 1], dates[index]));
      }

      const averageIntervalDays = average(intervals);
      const lastSeenAt = (boughtOrdered.at(-1)?.checkedAt ?? ordered.at(-1)?.createdAt) || undefined;
      const estimatedNextPurchaseAt =
        averageIntervalDays && lastSeenAt
          ? new Date(new Date(lastSeenAt).getTime() + averageIntervalDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

      return {
        normalizedName,
        displayName: ordered.at(-1)?.name ?? normalizedName,
        appearances: ordered.length,
        lastSeenAt,
        averageIntervalDays,
        estimatedNextPurchaseAt,
        history: ordered.map((item) => ({
          itemId: item.id,
          listId: item.listId,
          date: item.checkedAt ?? item.createdAt,
          quantity: item.quantity,
          unit: item.unit,
          status: item.status
        }))
      };
    })
    .sort((a, b) => b.appearances - a.appearances);
}

export function getCategoryEstimateDays(category?: ProductCategory | null) {
  if (!category) {
    return categoryEstimateDays.otros;
  }

  return categoryEstimateDays[category] ?? categoryEstimateDays.otros;
}

export function getCategoryEstimateLabel(category?: ProductCategory | null) {
  if (!category) {
    return categoryEstimateLabels.otros;
  }

  return categoryEstimateLabels[category] ?? categoryEstimateLabels.otros;
}

export function buildReminders(insights: ProductInsight[], now = new Date()) {
  return insights
    .filter((insight) => insight.appearances >= 3 && insight.estimatedNextPurchaseAt)
    .filter((insight) => new Date(insight.estimatedNextPurchaseAt as string).getTime() <= now.getTime())
    .map((insight) => ({
      product: insight.displayName,
      message: `Hace alrededor de ${insight.averageIntervalDays} dias que sueles volver a comprar ${insight.displayName}. Revisa si necesitas mas.`,
      estimatedNextPurchaseAt: insight.estimatedNextPurchaseAt as string
    }));
}
