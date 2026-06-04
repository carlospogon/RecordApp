import { ProductCategory } from "@/types/shopping";

const categoryKeywords: Record<ProductCategory, string[]> = {
  fruta: [
    "platano",
    "banana",
    "manzana",
    "pera",
    "naranja",
    "mandarina",
    "limon",
    "lima",
    "fresa",
    "freson",
    "uva",
    "kiwi",
    "melon",
    "sandia",
    "mango",
    "pina",
    "aguacate",
    "cereza",
    "melocoton",
    "nectarina"
  ],
  verdura: [
    "tomate",
    "lechuga",
    "cebolla",
    "ajo",
    "zanahoria",
    "pepino",
    "calabacin",
    "berenjena",
    "pimiento",
    "brocoli",
    "coliflor",
    "patata",
    "papa",
    "espinaca",
    "seta",
    "champinon"
  ],
  lacteos: ["leche", "queso", "yogur", "yoghurt", "mantequilla", "nata", "kefir"],
  huevos: ["huevo"],
  panaderia: ["pan", "barra", "baguette", "croissant", "galleta", "bizcocho", "tostada", "mollete"],
  carne: ["pollo", "ternera", "cerdo", "pavo", "jamon", "salchicha", "hamburguesa", "carne"],
  pescado: ["salmon", "atun", "merluza", "bacalao", "gamba", "langostino", "mejillon", "pescado"],
  despensa: [
    "arroz",
    "pasta",
    "macarron",
    "espagueti",
    "lenteja",
    "garbanzo",
    "alubia",
    "harina",
    "azucar",
    "sal",
    "aceite",
    "vinagre",
    "cereal",
    "tomate frito",
    "salsa",
    "conserva"
  ],
  bebidas: ["agua", "zumo", "jugo", "refresco", "cola", "cafe", "te", "cerveza", "vino", "bebida"],
  hogar: [
    "detergente",
    "lavavajilla",
    "lavavajillas",
    "suavizante",
    "lejia",
    "papel higienico",
    "papel de cocina",
    "servilleta",
    "bolsa basura",
    "estropajo",
    "fregona",
    "limpiador",
    "gel",
    "champu",
    "jabon",
    "pasta de dientes"
  ],
  otros: []
};

export function inferCategoryFromNormalizedName(normalizedName: string): ProductCategory {
  for (const [category, keywords] of Object.entries(categoryKeywords) as [ProductCategory, string[]][]) {
    if (category === "otros") {
      continue;
    }

    if (keywords.some((keyword) => normalizedName.includes(keyword))) {
      return category;
    }
  }

  return "otros";
}
