import { Hero } from "@/components/marketing/hero";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff8f1_0%,#f7fbf8_100%)] px-4 py-5 text-[#173025] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col">
        <Hero />
      </div>
    </main>
  );
}
