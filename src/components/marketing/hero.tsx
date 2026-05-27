import Image from "next/image";
import Link from "next/link";

const featureCards = [
  {
    title: "Compra con memoria",
    body: "Detecta si ya compraste algo antes y evita repetir productos por inercia."
  },
  {
    title: "Sugerencias utiles",
    body: "RecordApp estima reposiciones, propone complementarios y ordena mejor tu compra."
  },
  {
    title: "Todo en una sola app",
    body: "Listas, historial, recordatorios y catalogo de productos bajo tu cuenta."
  }
];

export function Hero() {
  return (
    <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,#101816_0%,#18241f_40%,#eef5ef_40%,#f8fbf8_100%)] shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="inline-flex rounded-full border border-lime/25 bg-lime/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">
            Compra mejor, no solo mas rapido
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            La lista de la compra que recuerda contigo.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate">
            RecordApp guarda lo que compras, detecta repetidos, estima reposiciones y te ayuda a decidir con mas contexto
            antes de volver al super.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-full bg-lime px-5 py-3 text-sm font-semibold text-[#111711] transition hover:bg-[#e6ff95]"
            >
              Empecemos
            </Link>
            <Link
              href="/auth"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-lime hover:text-lime"
            >
              Entrar a mi cuenta
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {featureCards.map((feature) => (
              <article key={feature.title} className="rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative bg-[linear-gradient(180deg,#f8fbf8_0%,#edf5ee_100%)] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="rounded-[30px] border border-[#dfe9e1] bg-white p-4 shadow-[0_28px_60px_rgba(23,45,34,0.12)]">
            <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#eef8f0_0%,#d9efdf_100%)]">
              <Image
                src="/shopping-hero.svg"
                alt="Ilustracion de una compra organizada en el supermercado"
                width={640}
                height={480}
                className="h-auto w-full"
                priority
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] bg-[#f4f8f5] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d7669]">Recuerda antes de comprar</p>
                <p className="mt-2 text-sm leading-6 text-[#2d4339]">
                  Si ya compraste huevos, pan o leche hace pocos dias, la app te lo recuerda antes de repetir.
                </p>
              </div>
              <div className="rounded-[20px] bg-[#f4f8f5] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d7669]">Ve tus patrones</p>
                <p className="mt-2 text-sm leading-6 text-[#2d4339]">
                  Historial, frecuencias y sugerencias visuales para entender mejor como compras cada semana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
