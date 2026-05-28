import Image from "next/image";
import Link from "next/link";
import { InstallAppButton } from "@/components/pwa/install-app-button";

const features = [
  "Recuerda compras recientes",
  "Detecta productos repetidos",
  "Sugiere reposiciones utiles"
];

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-md rounded-[34px] border border-[#d7e7db] bg-[linear-gradient(180deg,#f7fcf8_0%,#eef7f0_100%)] p-4 shadow-[0_28px_70px_rgba(23,54,38,0.10)] sm:p-5">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#12824f_0%,#0c6b41_100%)] shadow-[0_16px_28px_rgba(18,130,79,0.24)]">
          <Image src="/logo-mark.svg" alt="Logo de RecordApp" width={54} height={54} className="h-14 w-14" priority />
        </div>

        <div className="mt-4">
          <p className="text-[34px] font-semibold tracking-[-0.05em] text-[#0f7e4c]">RecordApp</p>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.28em] text-[#6f8d7d]">Compra con memoria</p>
        </div>

        <div className="relative mt-8 w-full overflow-hidden rounded-[34px] border-[3px] border-white bg-[linear-gradient(180deg,#4f715b_0%,#81b490_100%)] p-3 shadow-[0_24px_40px_rgba(39,84,57,0.18)]">
          <div className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#4f6c5d] shadow-[0_10px_20px_rgba(26,48,38,0.10)]">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#1d8f59]" />
            Organizado
          </div>
          <div className="absolute left-3 top-[62%] rounded-full bg-white/92 px-4 py-2 text-xs font-semibold text-[#657d71] shadow-[0_10px_20px_rgba(26,48,38,0.10)]">
            <span className="mr-2">+</span>
            Inteligente
          </div>
          <Image
            src="/shopping-hero.svg"
            alt="Compra organizada con bolsa de supermercado"
            width={640}
            height={480}
            className="h-auto w-full rounded-[28px]"
          />
        </div>

        <div className="mt-8 max-w-[26rem]">
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.05em] text-[#13261f] sm:text-[38px]">
            Bienvenido a RecordApp
          </h1>
          <p className="mt-3 text-base leading-7 text-[#688274]">
            Tu lista de la compra, ahora mas inteligente y mucho mas facil de recordar.
          </p>
        </div>

        <div className="mt-7 grid w-full gap-3">
          <Link
            href="/auth?mode=signup"
            className="rounded-[18px] bg-[linear-gradient(180deg,#11814f_0%,#0c6c42_100%)] px-5 py-4 text-base font-semibold text-white shadow-[0_14px_24px_rgba(17,129,79,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_28px_rgba(17,129,79,0.26)]"
          >
            Registrarme
          </Link>
          <Link
            href="/auth?mode=signin"
            className="rounded-[18px] border border-[#d4e4d8] bg-white px-5 py-4 text-base font-semibold text-[#173025] transition hover:border-[#1d8f59] hover:text-[#1d8f59]"
          >
            Iniciar sesion
          </Link>
          <div className="pt-1">
            <InstallAppButton />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {features.map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-[#dbe9de] bg-white/90 px-3 py-2 text-xs font-semibold text-[#607b6d] shadow-[0_6px_16px_rgba(28,46,36,0.05)]"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
