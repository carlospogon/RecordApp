import { ProductCategory } from "@/types/shopping";

type ProductVisual = {
  src: string;
  alt: string;
  accentClass: string;
};

const categoryVisuals: Record<ProductCategory, ProductVisual> = {
  fruta: {
    src: "/product-visuals/fruta.svg",
    alt: "Ilustracion de fruta fresca",
    accentClass: "from-[#ffe0e0] to-[#ffd2b4]"
  },
  verdura: {
    src: "/product-visuals/verdura.svg",
    alt: "Ilustracion de verduras frescas",
    accentClass: "from-[#daf4d7] to-[#bce8c5]"
  },
  lacteos: {
    src: "/product-visuals/lacteos.svg",
    alt: "Ilustracion de lacteos",
    accentClass: "from-[#f8f2ff] to-[#dfeaff]"
  },
  huevos: {
    src: "/product-visuals/huevos.svg",
    alt: "Ilustracion de huevos",
    accentClass: "from-[#fff2da] to-[#ffe3b0]"
  },
  panaderia: {
    src: "/product-visuals/panaderia.svg",
    alt: "Ilustracion de panaderia",
    accentClass: "from-[#ffe9d4] to-[#ffd1a1]"
  },
  carne: {
    src: "/product-visuals/proteina.svg",
    alt: "Ilustracion de proteina fresca",
    accentClass: "from-[#ffe0e0] to-[#ffc6c6]"
  },
  pescado: {
    src: "/product-visuals/proteina.svg",
    alt: "Ilustracion de pescado fresco",
    accentClass: "from-[#dcefff] to-[#bedeff]"
  },
  despensa: {
    src: "/product-visuals/despensa.svg",
    alt: "Ilustracion de despensa",
    accentClass: "from-[#f4ecd9] to-[#ecd6af]"
  },
  bebidas: {
    src: "/product-visuals/bebidas.svg",
    alt: "Ilustracion de bebidas",
    accentClass: "from-[#d8f5ff] to-[#bce9ff]"
  },
  hogar: {
    src: "/product-visuals/hogar.svg",
    alt: "Ilustracion de hogar",
    accentClass: "from-[#eaeaea] to-[#d8e0e8]"
  },
  otros: {
    src: "/product-visuals/otros.svg",
    alt: "Ilustracion de producto general",
    accentClass: "from-[#ecf0ec] to-[#d7e2d9]"
  }
};

export function getProductVisual(name: string, category?: ProductCategory | null): ProductVisual {
  const normalized = name.toLowerCase();

  if (normalized.includes("fresa") || normalized.includes("fruta")) {
    return categoryVisuals.fruta;
  }

  if (normalized.includes("huevo")) {
    return categoryVisuals.huevos;
  }

  if (normalized.includes("leche") || normalized.includes("queso") || normalized.includes("yogur") || normalized.includes("mozzarella")) {
    return categoryVisuals.lacteos;
  }

  if (normalized.includes("pan")) {
    return categoryVisuals.panaderia;
  }

  if (normalized.includes("coco") || normalized.includes("agua")) {
    return categoryVisuals.bebidas;
  }

  if (normalized.includes("espinaca") || normalized.includes("albahaca") || normalized.includes("tomate")) {
    return categoryVisuals.verdura;
  }

  return categoryVisuals[category ?? "otros"] ?? categoryVisuals.otros;
}
