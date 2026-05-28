import Link from "next/link";
import { AuthForms } from "@/components/auth/auth-forms";

export default async function AuthPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; mode?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const showGoogleError = params.error === "google";
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff8f1_0%,#f7fbf8_100%)] px-4 py-8 text-[#173025] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f7e4c]">Acceso</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#173025]">Entra en RecordApp</h1>
          </div>
          <Link href="/" className="text-sm font-semibold text-[#0f7e4c]">
            Volver
          </Link>
        </div>

        {showGoogleError ? (
          <div className="rounded-[22px] border border-[#e9b1b1] bg-[#fff3f3] p-4 text-sm text-[#b44d4d]">
            Google Auth no termino bien. Revisa que el proveedor este activado en Supabase y que el redirect URL apunte a
            `/auth/callback`.
          </div>
        ) : null}

        <AuthForms initialMode={initialMode} />
      </div>
    </main>
  );
}
