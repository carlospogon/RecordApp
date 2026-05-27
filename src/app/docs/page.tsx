import { readFileSync } from "fs";
import path from "path";

export default function DocsPage() {
  const filePath = path.join(process.cwd(), "docs", "architecture.md");
  const content = readFileSync(filePath, "utf8");

  return (
    <main className="min-h-screen bg-[#0d1514] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-[#121b18] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-mint">{content}</pre>
      </div>
    </main>
  );
}
