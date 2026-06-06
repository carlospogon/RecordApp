import { env } from "@/lib/env";

export const siteConfig = {
  name: "RecordApp",
  description: "Lista de la compra con memoria histórica y recordatorios inteligentes.",
  url: env.APP_PUBLIC_URL || "http://localhost:3000",
  themeColor: "#709682"
};
