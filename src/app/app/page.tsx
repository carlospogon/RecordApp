import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shopping/dashboard-shell";
import { signOutAction } from "@/app/app/actions";
import { env } from "@/lib/env";
import { getFrequentProductsForView, getShoppingDashboardData } from "@/lib/supabase/queries";

function getUserDisplayName(email: string) {
  const localPart = email.split("@")[0] ?? "usuario";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  if (!cleaned) {
    return "Usuario";
  }

  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function AppPage({
  searchParams
}: {
  searchParams?: Promise<{ list?: string; tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedListId = typeof params.list === "string" ? params.list : null;
  const activeTab =
    typeof params.tab === "string" &&
    ["lista", "historial", "sugerencias", "analisis", "resumen"].includes(params.tab)
      ? (params.tab as "lista" | "historial" | "sugerencias" | "analisis" | "resumen")
      : "lista";
  const supabaseConfigured = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const data = await getShoppingDashboardData(selectedListId);

  if (!supabaseConfigured) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Configuracion pendiente</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--text)]">Falta conectar Supabase para activar el MVP real.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Anade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` para encender auth, listas e
            historial persistente.
          </p>
          <Link
            href="/docs"
            className="mt-6 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Ver arquitectura y esquema
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    redirect("/auth");
  }

  const frequentProducts = getFrequentProductsForView(data.frequentProducts);
  const userDisplayName = getUserDisplayName(data.userEmail);

  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-4 sm:px-6 sm:py-8">
      <div className="absolute inset-0">
        <Image
          src="/app-mindful-background.jpg"
          alt="Despensa y cocina organizada"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,249,246,0.18)_0%,rgba(250,249,246,0.28)_55%,rgba(250,249,246,0.86)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl rounded-[34px] border border-white/55 bg-[rgba(250,249,246,0.78)] p-4 shadow-[0_28px_70px_rgba(74,97,80,0.10)] backdrop-blur-[20px] sm:p-6">
          <header className="rounded-[26px] border border-white/55 bg-[rgba(255,255,255,0.74)] px-5 py-5 text-[var(--text)] backdrop-blur-[18px] sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">RecordApp</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Hola, {userDisplayName}!</h1>
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--border)] bg-white/88 px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-white"
                >
                  Cerrar sesion
                </button>
              </form>
            </div>
          </header>

          <DashboardShell
            currentList={data.currentList}
            items={data.items}
            suggestionItems={data.suggestionItems}
            scheduledListReminders={data.scheduledListReminders}
            lists={data.lists}
            reminders={data.reminders}
            frequentProducts={frequentProducts}
            catalogProducts={data.catalogProducts}
            analysis={data.analysis}
            selectedListId={data.selectedListId}
            activeTab={activeTab}
            pushPublicKey={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
            userDisplayName={userDisplayName}
          />
      </div>
    </main>
  );
}
