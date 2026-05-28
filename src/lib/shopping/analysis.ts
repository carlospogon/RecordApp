import {
  AnalysisBucket,
  AnalysisBucketKey,
  AnalysisRecommendation,
  ProductCatalogItem,
  ShoppingAnalysis,
  ShoppingItem,
  ShoppingList
} from "@/types/shopping";

const bucketMeta: Record<AnalysisBucketKey, { label: string; color: string }> = {
  vegetales: { label: "Vegetales", color: "#3aa86b" },
  proteinas: { label: "Proteinas", color: "#ff8a65" },
  carbohidratos: { label: "Carbohidratos", color: "#f2c94c" },
  lacteos: { label: "Lacteos", color: "#7bb6ff" },
  otros: { label: "Otros", color: "#c8d3cc" }
};

function mapCategoryToBucket(category?: ProductCatalogItem["category"] | null): AnalysisBucketKey {
  if (category === "fruta" || category === "verdura") {
    return "vegetales";
  }

  if (category === "carne" || category === "pescado" || category === "huevos") {
    return "proteinas";
  }

  if (category === "panaderia" || category === "despensa") {
    return "carbohidratos";
  }

  if (category === "lacteos") {
    return "lacteos";
  }

  return "otros";
}

function percentage(count: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

export function buildShoppingAnalysis({
  lists,
  items,
  catalogProducts
}: {
  lists: ShoppingList[];
  items: ShoppingItem[];
  catalogProducts: ProductCatalogItem[];
}): ShoppingAnalysis {
  const latestClosedLists = [...lists]
    .filter((list) => Boolean(list.completedAt))
    .sort((a, b) => new Date(b.completedAt ?? b.shoppingDate).getTime() - new Date(a.completedAt ?? a.shoppingDate).getTime())
    .slice(0, 3);

  if (latestClosedLists.length === 0) {
    return {
      consideredListsCount: 0,
      totalItems: 0,
      buckets: Object.entries(bucketMeta).map(([key, value]) => ({
        key: key as AnalysisBucketKey,
        label: value.label,
        count: 0,
        percentage: 0,
        color: value.color
      })),
      findings: ["Cierra al menos una lista para que RecordApp empiece a detectar patrones de compra."],
      recommendations: []
    };
  }

  const closedListIds = new Set(latestClosedLists.map((list) => list.id));
  const categoryByNormalizedName = new Map(catalogProducts.map((product) => [product.normalizedName, product.category ?? "otros"]));
  const analysisItems = items.filter((item) => closedListIds.has(item.listId));

  const counters: Record<AnalysisBucketKey, number> = {
    vegetales: 0,
    proteinas: 0,
    carbohidratos: 0,
    lacteos: 0,
    otros: 0
  };

  for (const item of analysisItems) {
    const bucket = mapCategoryToBucket(categoryByNormalizedName.get(item.normalizedName));
    counters[bucket] += 1;
  }

  const totalItems = analysisItems.length;
  const buckets: AnalysisBucket[] = (Object.keys(bucketMeta) as AnalysisBucketKey[]).map((key) => ({
    key,
    label: bucketMeta[key].label,
    count: counters[key],
    percentage: percentage(counters[key], totalItems),
    color: bucketMeta[key].color
  }));

  const vegetalesShare = totalItems ? counters.vegetales / totalItems : 0;
  const proteinasShare = totalItems ? counters.proteinas / totalItems : 0;
  const carbsShare = totalItems ? counters.carbohidratos / totalItems : 0;
  const varietyCount = (Object.keys(counters) as AnalysisBucketKey[]).filter((key) => counters[key] > 0).length;

  const findings: string[] = [];
  const recommendations: AnalysisRecommendation[] = [];

  if (vegetalesShare < 0.25) {
    findings.push("En tus 3 ultimas listas aparecen pocos vegetales frente al resto de categorias.");
    recommendations.push({
      title: "Sube la base vegetal",
      body: "Te vendria bien reforzar verduras de hoja, tomate o fruta fresca para equilibrar mejor la compra semanal.",
      productName: "Espinacas",
      quantity: "1",
      unit: "bolsa"
    });
  }

  if (proteinasShare < 0.2) {
    findings.push("La proteina aparece por debajo de lo deseable para sostener comidas mas completas.");
    recommendations.push({
      title: "Refuerza la proteina",
      body: "Anade una fuente clara de proteina en la siguiente lista para no apoyarte solo en pan, pasta o extras.",
      productName: "Pechuga de pollo",
      quantity: "2",
      unit: "filetes"
    });
  }

  if (carbsShare > 0.45 && vegetalesShare < 0.25) {
    findings.push("Predominan carbohidratos y despensa seca, pero falta compensarlos con mas vegetal fresco.");
    recommendations.push({
      title: "Compensa los carbohidratos",
      body: "Si la base de la compra es pan, pasta o arroz, intenta equilibrarla con verdura y algo de proteina.",
      productName: "Brocoli",
      quantity: "1",
      unit: "unidad"
    });
  }

  if (varietyCount < 3) {
    findings.push("Hay poca variedad entre categorias, lo que suele traducirse en una compra menos equilibrada.");
    recommendations.push({
      title: "Aumenta la variedad",
      body: "Introduce al menos una categoria que ahora no este apareciendo para mejorar el balance general.",
      productName: "Yogur natural",
      quantity: "4",
      unit: "uds"
    });
  }

  if (findings.length === 0) {
    findings.push("Tus 3 ultimas listas muestran un reparto bastante equilibrado entre vegetales, proteinas y base de despensa.");
    recommendations.push({
      title: "Balance correcto",
      body: "Mantienes una mezcla razonable. La mejora ahora vendria por variar un poco mas los productos frescos.",
      productName: "Frutos rojos",
      quantity: "1",
      unit: "bandeja"
    });
  }

  return {
    consideredListsCount: latestClosedLists.length,
    totalItems,
    buckets,
    findings,
    recommendations: recommendations.slice(0, 3)
  };
}
