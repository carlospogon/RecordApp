import Link from "next/link";
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
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl rounded-[36px] border border-white/60 bg-[rgba(255,255,255,0.45)] p-3 shadow-[0_30px_100px_rgba(12,28,22,0.12)] backdrop-blur sm:p-5">
        <div className="rounded-[30px] bg-[var(--surface-strong)] p-4 sm:p-5">
          <header className="rounded-[26px] bg-[linear-gradient(135deg,#12211b_0%,#1a2b24_100%)] px-5 py-5 text-white sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fe0b5]">RecordApp</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Hola, {userDisplayName}!</h1>
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
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
      </div>
    </main>
  );
}
