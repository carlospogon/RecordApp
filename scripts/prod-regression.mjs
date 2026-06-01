import { chromium } from "playwright";

const baseUrl = "https://record-app-indol.vercel.app";
const email = "fohahe3840@alf5.com";
const password = "5Kombat=";

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function ensureList(page) {
  const stepOne = page.getByText("Paso 1", { exact: true });

  if (!(await stepOne.isVisible().catch(() => false))) {
    return false;
  }

  const tomorrow = addDays(1);
  await page.locator('input[name="title"]').fill(`regresion ${Date.now()}`);
  await page.locator('input[name="shoppingDate"]').fill(tomorrow);
  const reminderInput = page.locator('input[name="reminderDate"]');
  if (await reminderInput.isVisible().catch(() => false)) {
    await reminderInput.fill(tomorrow);
  }
  await page.getByRole("button", { name: /crear y abrir/i }).click();
  await page.getByText("Paso 2", { exact: true }).waitFor({ timeout: 15000 });
  return true;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const results = [];

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /entrar/i }).waitFor({ timeout: 15000 });
    results.push("Landing OK");

    await page.getByRole("link", { name: /entrar/i }).click();
    await page.waitForURL(/\/auth/, { timeout: 15000 });
    await page.getByRole("button", { name: /entrar/i }).waitFor({ timeout: 15000 });
    results.push("Auth page OK");

    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /^Entrar$/i }).click();
    await page.waitForURL(/\/app/, { timeout: 20000 });
    await page.getByText(/Hola,/i).waitFor({ timeout: 15000 });
    results.push("Login OK");

    await ensureList(page);
    results.push("List flow reachable");

    if (await page.getByText("Paso 2", { exact: true }).isVisible().catch(() => false)) {
      const productName = `prueba regresion ${Date.now()}`;
      await page.locator('input[list="recordapp-product-catalog"]').fill(productName);
      await page.getByRole("button", { name: /guardar producto/i }).click();
      await page.getByText(productName, { exact: false }).waitFor({ timeout: 15000 });
      results.push("Add item OK");

      const itemCard = page.locator("article").filter({ hasText: productName }).first();
      const toggleButton = itemCard.getByRole("checkbox");
      await toggleButton.click();
      await itemCard.getByText(/Comprado/i).waitFor({ timeout: 15000 });
      results.push("Toggle bought OK");
    }

    for (const tabName of ["Historial", "Sugerencias", /an.+lisis/i, "Resumen", "Lista"]) {
      await page.getByRole("button", { name: tabName }).click();
      await page.waitForTimeout(250);
    }
    results.push("Tabs OK");

    console.log(JSON.stringify({ ok: true, checks: results }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message, stack: error.stack }, null, 2));
  process.exit(1);
});
