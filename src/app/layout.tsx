import type { Metadata, Viewport } from "next";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "RecordApp | Lista de la compra con memoria",
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
