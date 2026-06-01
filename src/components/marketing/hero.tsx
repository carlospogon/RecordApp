import Image from "next/image";
import Link from "next/link";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import { InstallAppButton } from "@/components/pwa/install-app-button";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"]
});

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

export function Hero() {
  return (
    <section
      className={`relative isolate mx-auto min-h-[100svh] w-full overflow-hidden bg-[#faf9f6] text-[#1a1c1a] sm:rounded-[32px] ${bodyFont.className}`}
    >
      <div className="absolute inset-0">
        <Image
          src="/landing-mindful-background.jpg"
          alt="Ambiente sereno de cocina"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,249,246,0.18)_0%,rgba(250,249,246,0.24)_52%,rgba(250,249,246,0.86)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col px-5 pb-10 pt-4 sm:px-8 sm:pt-6">
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
            <span
              className={`${displayFont.className} truncate text-[clamp(1.6rem,7vw,3.15rem)] font-semibold tracking-[-0.04em] text-[#4a6150]`}
            >
              RecordApp
            </span>
          </div>
          <Link
            href="/docs"
            className={`${displayFont.className} shrink-0 rounded-full border border-white/45 bg-white/90 px-4 py-2 text-base font-semibold tracking-[-0.02em] text-[#645e4f] shadow-[0_10px_24px_rgba(74,97,80,0.10)] transition hover:bg-white sm:px-6 sm:py-3 sm:text-xl`}
          >
            Ayuda
          </Link>
        </header>

        <div className="flex-1" />

        <div className="pb-2 sm:pb-4">
          <div className="mx-auto w-full max-w-[58rem] rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.84)] px-6 py-8 text-center backdrop-blur-[22px] shadow-[0_30px_70px_rgba(74,97,80,0.10)] sm:px-12 sm:py-12">
            <h1 className={`${displayFont.className} text-[clamp(2.25rem,4vw,4rem)] font-bold tracking-[-0.045em] text-[#111311]`}>
              Bienvenidos a RecordApp.
            </h1>
            <p className="mx-auto mt-4 max-w-[42rem] text-[clamp(1.2rem,2vw,1.9rem)] leading-[1.45] tracking-[-0.02em] text-[#1f211f]">
              Cuidamos de tu despensa para que tu solo disfrutes de tu tiempo.
              <br />
              Organiza, planifica y vive con tranquilidad.
            </p>

            <div className="mx-auto mt-8 grid max-w-[31rem] gap-4">
              <Link
                href="/auth"
                className={`${displayFont.className} rounded-full border border-[#b77259] bg-[linear-gradient(180deg,#b97055_0%,#ab634a_100%)] px-6 py-4 text-[1.45rem] font-semibold text-white shadow-[0_16px_30px_rgba(134,77,53,0.18)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_rgba(134,77,53,0.22)]`}
              >
                Entrar
              </Link>
              <InstallAppButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
