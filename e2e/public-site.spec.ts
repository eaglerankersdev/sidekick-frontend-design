import { expect, test } from "@playwright/test";

test("pricing shows live plans, add-ons and the comparison", async ({ page }) => {
  await page.goto("/pricing");
  for (const [name, price] of [["Basic", "$49.99"], ["Growth", "$99.99"], ["Enterprise", "$149.99"]]) {
    const card = page.getByRole("article", { name });
    await expect(card.getByText(price, { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Get started" })).toHaveAttribute("href", `/checkout?plan=${name.toLowerCase()}`);
    await expect(card.getByRole("link", { name: "Talk to sales" })).toHaveAttribute("href", `/contact?plan=${name.toLowerCase()}`);
  }
  await expect(page.getByText("$10 for 1,000 credits")).toBeVisible();
  await expect(page.getByRole("table")).toContainText("One per service");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("contact preselects only known plans", async ({ page }) => {
  await page.goto("/contact?plan=enterprise");
  await expect(page.getByRole("radio", { name: "Enterprise" })).toBeChecked();
  await page.goto("/contact?plan=platinum");
  await expect(page.getByRole("radio", { name: "Not sure" })).toBeChecked();
});

async function fill(page: import("@playwright/test").Page, email: string) {
  await page.getByLabel("Your name").fill("Sam Rivera");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Business name").fill("Brightside Washing");
  await page.getByLabel("Your industry").selectOption({ label: "Pressure Washing" });
  await page.waitForTimeout(2600); // the server rejects submits faster than a person could type
}

test("contact sends the inquiry to the SideKick API", async ({ page, request }) => {
  await page.goto("/contact?plan=growth");
  await fill(page, `e2e-${test.info().project.name}-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Book a Demo" }).click();
  await expect(page.getByRole("status")).toContainText("Thanks, we have your request.");
  const received = await (await request.get("http://127.0.0.1:4999/__received")).json();
  const last = received.at(-1);
  expect(last.data).toMatchObject({ planKey: "growth", source: "public-website", industry: "pressure-washing" });
  expect(last.headers["idempotency-key"]).toMatch(/^[0-9a-f-]{36}$/);
});

test("contact shows friendly API errors and keeps the typed values", async ({ page }) => {
  await page.goto("/contact");
  await fill(page, "limit@example.com");
  await page.getByRole("button", { name: "Book a Demo" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "wait a few minutes" })).toBeVisible();
  await expect(page.getByLabel("Business name")).toHaveValue("Brightside Washing");
  await page.getByLabel("Work email").fill("bad@example.com");
  await page.getByRole("button", { name: "Book a Demo" }).click();
  await expect(page.getByText("Please enter a valid work email.")).toBeVisible();
  await expect(page.getByLabel("Work email")).toHaveAttribute("aria-invalid", "true");
});
