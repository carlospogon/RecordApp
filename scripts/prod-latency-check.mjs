import { chromium } from "playwright";

const baseUrl = "https://record-app-indol.vercel.app";
const email = "fohahe3840@alf5.com";
const password = "5Kombat=";

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function measure(label, action, waiter) {
  const start = Date.now();
  await action();
  await waiter();
  const durationMs = Date.now() - start;
  return { label, durationMs };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const timings = [];

    await page.goto(`${baseUrl}/auth`, { waitUntil: "networkidle" });
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /^Entrar$/i }).click();
    await page.waitForURL(/\/app/, { timeout: 20000 });
    await page.getByText(/Hola,/i).waitFor({ timeout: 15000 });

    const listTitle = `latencia ${Date.now()}`;
    const productName = `producto latencia ${Date.now()}`;
    const tomorrow = addDays(1);

    await page.locator('input[name="title"]').fill(listTitle);
    await page.locator('input[name="shoppingDate"]').fill(tomorrow);
    const reminderInput = page.locator('input[name="reminderDate"]');
    if (await reminderInput.isVisible().catch(() => false)) {
      await reminderInput.fill(tomorrow);
    }

    const createTiming = await measure(
      "create_list",
      async () => {
        await page.getByRole("button", { name: /crear y abrir/i }).click();
      },
      async () => {
        await page.getByText("Paso 2", { exact: true }).waitFor({ timeout: 20000 });
        await page.getByText(listTitle, { exact: false }).waitFor({ timeout: 20000 });
      }
    );
    timings.push(createTiming);

    await page.locator('input[list="recordapp-product-catalog"]').fill(productName);
    const addTiming = await measure(
      "add_item",
      async () => {
        await page.getByRole("button", { name: /guardar producto/i }).click();
      },
      async () => {
        await page.getByText(productName, { exact: false }).waitFor({ timeout: 20000 });
      }
    );
    timings.push(addTiming);

    const itemCard = page.locator("article").filter({ hasText: productName }).first();
    const toggleTiming = await measure(
      "toggle_bought",
      async () => {
        await itemCard.getByRole("checkbox").click();
      },
      async () => {
        await itemCard.getByText(/Comprado/i).waitFor({ timeout: 20000 });
      }
    );
    timings.push(toggleTiming);

    const thresholds = {
      good: 400,
      acceptable: 900
    };

    const evaluation = timings.map((timing) => ({
      ...timing,
      verdict:
        timing.durationMs <= thresholds.good
          ? "good"
          : timing.durationMs <= thresholds.acceptable
            ? "acceptable"
            : "slow"
    }));

    console.log(
      JSON.stringify(
        {
          ok: true,
          thresholds,
          timings: evaluation
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message, stack: error.stack }, null, 2));
  process.exit(1);
});
