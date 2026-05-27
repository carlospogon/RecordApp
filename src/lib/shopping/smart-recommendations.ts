import { ProductCatalogItem, ProductCategory, ShoppingItem } from "@/types/shopping";

type SmartRecommendation = {
  title: string;
  body: string;
  ctaLabel: string;
  productName: string;
  quantity?: string | null;
  unit?: string | null;
  badge: string;
};

type ComplementaryRule = {
  requires: string[];
  suggests: {
    productName: string;
    quantity?: string;
    unit?: string;
  };
  title: string;
  body: string;
  badge: string;
};

const complementaryRules: ComplementaryRule[] = [
  {
    requires: ["queso", "huevos"],
    suggests: { productName: "Pan", quantity: "1", unit: "barra" },
    title: "Combinacion detectada",
    body: "Has anadido queso y huevos. Tener pan a mano te puede cerrar desayunos, tostadas o cenas rapidas.",
    badge: "Complementario"
  },
  {
    requires: ["tomate", "mozzarella"],
    suggests: { productName: "Albahaca", quantity: "1", unit: "manojo" },
    title: "Toque final",
    body: "Tomate y mozzarella suelen encajar mejor si tambien tienes albahaca fresca para rematar la mezcla.",
    badge: "Complementario"
  },
  {
    requires: ["pasta", "tomate"],
    suggests: { productName: "Queso rallado", quantity: "1", unit: "bolsa" },
    title: "Cierre rapido",
    body: "Si hoy entra pasta con tomate, el queso rallado suele ser el complemento que mas se echa en falta despues.",
    badge: "Complementario"
  }
];

const healthySuggestionsByCategory: Partial<
  Record<
    ProductCategory,
    {
      productName: string;
      quantity?: string;
      unit?: string;
      title: string;
      body: string;
      badge: string;
    }
  >
> = {
  bebidas: {
    productName: "Agua de coco",
    quantity: "1",
    unit: "botella",
    title: "Hidratacion inteligente",
    body: "El agua de coco aporta electrolitos de forma natural y puede venir bien si quieres reforzar hidratacion sin complicarte.",
    badge: "Dato saludable"
  },
  panaderia: {
    productName: "Aguacate",
    quantity: "2",
    unit: "unidades",
    title: "Idea saludable",
    body: "Si compras pan con frecuencia, el aguacate puede darte una opcion rapida y mas saciante para desayunos o cenas ligeras.",
    badge: "Dato saludable"
  },
  huevos: {
    productName: "Espinacas",
    quantity: "1",
    unit: "bolsa",
    title: "Refuerzo verde",
    body: "Los huevos combinan muy bien con espinacas y te ayudan a montar comidas rapidas con mas fibra y micronutrientes.",
    badge: "Dato saludable"
  },
  fruta: {
    productName: "Yogur natural",
    quantity: "4",
    unit: "uds",
    title: "Combina mejor",
    body: "La fruta con yogur natural te deja desayunos o meriendas mas completos y faciles de repetir durante la semana.",
    badge: "Dato saludable"
  }
};

function normalizeLoose(value: string) {
  return value.toLowerCase().trim();
}

export function buildSmartSuggestion(
  currentItems: ShoppingItem[],
  catalogProducts: ProductCatalogItem[]
): SmartRecommendation | null {
  const activeNames = new Set(currentItems.map((item) => normalizeLoose(item.name)));

  for (const rule of complementaryRules) {
    const hasAll = rule.requires.every((required) => activeNames.has(normalizeLoose(required)));
    const suggestionAlreadyPresent = activeNames.has(normalizeLoose(rule.suggests.productName));

    if (hasAll && !suggestionAlreadyPresent) {
      return {
        title: rule.title,
        body: rule.body,
        ctaLabel: "Anadir recomendacion",
        productName: rule.suggests.productName,
        quantity: rule.suggests.quantity,
        unit: rule.suggests.unit,
        badge: rule.badge
      };
    }
  }

  const categoriesInCurrentList = currentItems
    .map((item) => catalogProducts.find((product) => product.normalizedName === item.normalizedName)?.category)
    .filter((category): category is ProductCategory => Boolean(category));

  for (const category of categoriesInCurrentList) {
    const healthySuggestion = healthySuggestionsByCategory[category];

    if (!healthySuggestion) {
      continue;
    }

    if (activeNames.has(normalizeLoose(healthySuggestion.productName))) {
      continue;
    }

    return {
      title: healthySuggestion.title,
      body: healthySuggestion.body,
      ctaLabel: "Lo anadimos?",
      productName: healthySuggestion.productName,
      quantity: healthySuggestion.quantity,
      unit: healthySuggestion.unit,
      badge: healthySuggestion.badge
    };
  }

  return null;
}
