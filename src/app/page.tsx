import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { PrototypePanel } from "@/components/dashboard/prototype-panel";
import { InstallAppButton } from "@/components/pwa/install-app-button";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-[#101816]/80 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xl font-semibold">RecordApp</p>
            <p className="text-xs uppercase tracking-[0.16em] text-slate">Compra con memoria</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate">
            <InstallAppButton />
            <Link href="/app" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-lime hover:text-lime">
              Panel MVP
            </Link>
            <Link href="/docs" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-lime hover:text-lime">
              Arquitectura
            </Link>
          </div>
        </header>

        <Hero />
        <PrototypePanel />
      </div>
    </main>
  );
}
