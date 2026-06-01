import { Hero } from "@/components/marketing/hero";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1a1c1a]">
      <div className="mx-auto flex w-full max-w-none flex-col">
        <Hero />
      </div>
    </main>
  );
}
