import fs from "node:fs/promises";
import path from "node:path";

const serverDir = path.join(process.cwd(), ".next", "server");
const chunksDir = path.join(serverDir, "chunks");

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await fileExists(chunksDir))) {
    return;
  }

  const entries = await fs.readdir(chunksDir, { withFileTypes: true });
  const chunkFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".js"));

  await Promise.all(
    chunkFiles.map(async (entry) => {
      const from = path.join(chunksDir, entry.name);
      const to = path.join(serverDir, entry.name);
      await fs.copyFile(from, to);
    })
  );

  console.log(`Mirrored ${chunkFiles.length} server chunks into .next/server for local runtime compatibility.`);
}

main().catch((error) => {
  console.error("Failed to mirror Next server chunks:", error);
  process.exit(1);
});
