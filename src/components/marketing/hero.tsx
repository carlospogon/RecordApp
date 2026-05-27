import Link from "next/link";

export function Hero() {
  return (
    <section className="grid gap-10 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#101816_0%,#1a2722_55%,#111916_100%)] px-6 py-8 shadow-[0_32px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[1.4fr_0.9fr] lg:px-10 lg:py-12">
      <div className="space-y-6">
        <div className="inline-flex rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">
          MVP orientado a memoria de compra
        </div>
        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Tu lista de la compra con memoria histórica y recordatorios simples.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate">
            RecordApp no solo guarda listas: detecta productos repetidos, resume tu histórico y te ayuda a comprar con más cabeza.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app"
            className="rounded-full bg-lime px-5 py-3 text-sm font-semibold text-[#10150f] transition hover:bg-[#e2ff8f]"
          >
            Ver prototipo del panel
          </Link>
          <Link
            href="/docs"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-lime hover:text-lime"
          >
            Arquitectura del MVP
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[26px] border border-white/10 bg-[#0d1311] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Flujo central</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-mint">
            <li>1. Crear lista del día</li>
            <li>2. Añadir producto y detectar repetidos</li>
            <li>3. Marcar comprados sin perder historial</li>
            <li>4. Recalcular frecuencia y sugerencias</li>
          </ul>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-[#0d1311] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Decisión técnica</p>
          <p className="mt-4 text-sm leading-7 text-slate">
            Next.js + Supabase + Vercel. Sin backend aparte, sin costes iniciales y con una base fácil de escalar a PWA y push notifications.
          </p>
        </div>
      </div>
    </section>
  );
}
