import Image from "next/image";
import Link from "next/link";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import { AuthForms } from "@/components/auth/auth-forms";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"]
});

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

export default async function AuthPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; mode?: string; invite?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const showGoogleError = params.error === "google";
  const initialMode = params.mode === "signup" ? "signup" : "signin";
  const inviteCode = typeof params.invite === "string" ? params.invite.trim().toUpperCase() : "";

  return (
    <main className={`relative min-h-screen overflow-hidden bg-[#faf9f6] text-[#1a1c1a] ${bodyFont.className}`}>
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/auth-mindful-background.jpg"
          alt="Despensa ordenada y luminosa"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,249,246,0.14)_0%,rgba(250,249,246,0.24)_55%,rgba(250,249,246,0.82)_100%)]" />
      </div>

      <div className="relative z-10 min-h-screen px-5 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col">
          <header className="flex items-center justify-between gap-3 rounded-full border border-white/45 bg-[rgba(250,249,246,0.72)] px-4 py-3 backdrop-blur-[20px] shadow-[0_16px_30px_rgba(74,97,80,0.08)] sm:px-6 sm:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Image
                src="/landing-logo-reference.png"
                alt="Logo de RecordApp"
                width={40}
                height={40}
                priority
                className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
              />
              <span className={`${displayFont.className} truncate text-[clamp(1.6rem,7vw,3.15rem)] font-semibold tracking-[-0.04em] text-[#4a6150]`}>
                RecordApp
              </span>
            </div>
            <Link
              href="/"
              className={`${displayFont.className} shrink-0 rounded-full border border-white/45 bg-white/90 px-4 py-2 text-base font-semibold tracking-[-0.02em] text-[#645e4f] shadow-[0_10px_24px_rgba(74,97,80,0.10)] transition hover:bg-white sm:px-6 sm:py-3 sm:text-xl`}
            >
              Volver
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-12">
            <div className="w-full max-w-[34rem]">
              <div className="mb-5 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a6150]">Acceso</p>
                <h1 className={`${displayFont.className} mt-3 text-[clamp(2.3rem,4vw,3.9rem)] font-bold tracking-[-0.045em] text-[#111311]`}>
                  Entra en RecordApp
                </h1>
                <p className="mx-auto mt-3 max-w-[34rem] text-base leading-7 text-[#5e665f] sm:text-lg">
                  Tu despensa organizada, tus listas siempre a mano y recordatorios pensados para una compra más tranquila.
                </p>
              </div>

              {showGoogleError ? (
                <div className="mb-4 rounded-[22px] border border-[#e7c8be] bg-[rgba(255,244,240,0.92)] p-4 text-sm text-[#a45f4a]">
                  Google Auth no terminó bien. Revisa que el proveedor esté activado en Supabase y que el redirect URL apunte a
                  `/auth/callback`.
                </div>
              ) : null}

              {inviteCode ? (
                <div className="mb-4 rounded-[22px] border border-[#d8e2d7] bg-[rgba(246,243,238,0.92)] p-4 text-sm text-[#4f6a56]">
                  Tienes una invitaciÃ³n pendiente para una lista compartida. En cuanto entres, RecordApp intentarÃ¡ abrirla por ti.
                </div>
              ) : null}

              <AuthForms initialMode={initialMode} inviteCode={inviteCode} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
