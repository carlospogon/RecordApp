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
    <main className="min-h-screen bg-[#0d1514] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,#101816_0%,#1a2722_58%,#111916_100%)] p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Acceso</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Guarda tus listas, detecta repetidos y convierte el historial en recordatorios utiles.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate">
            RecordApp asocia cada lista a tu cuenta para que la memoria historica, los productos frecuentes y las sugerencias se mantengan separadas por usuario.
          </p>
          <div className="mt-8 rounded-[26px] border border-white/10 bg-[#101816] p-5 text-sm leading-7 text-mint">
            Puedes entrar con email y contrasena o activar Google desde Supabase Auth para acelerar el alta en movil.
          </div>
          {showGoogleError ? (
            <div className="mt-4 rounded-[22px] border border-[#6b2323] bg-[#311515] p-4 text-sm text-[#ffb0b0]">
              Google Auth no termino bien. Revisa que el proveedor este activado en Supabase y que el redirect URL apunte a
              `/auth/callback`.
            </div>
          ) : null}
          <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-lime">
            Volver a la portada
          </Link>
        </section>

        <AuthForms initialMode={initialMode} />
      </div>
    </main>
  );
}
