import { expect, test, type Page } from "@playwright/test";

// Existing-customer upgrade by email code against e2e/mock-api.mjs (see its header for the email/code conventions).
async function shot(page: Page, name: string) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const suffix = test.info().project.name === "mobile" ? "390" : "desktop";
  // A full-page capture would paint the fixed phone bar mid-page; show it where it ends up instead, under the content.
  const css = await page.addStyleTag({ content: "[data-sticky-bar]{position:static!important}" });
  await page.screenshot({ path: `docs/screenshots/${name}-${suffix}.png`, fullPage: true, animations: "disabled" });
  await css.evaluate((el) => (el as Element).remove());
}

const unique = (prefix: string) => `${prefix}-${test.info().project.name}-${Date.now()}@example.com`;
const h1 = (page: Page) => page.getByRole("heading", { level: 1 });

async function signInWithCode(page: Page, email: string, plan = "growth") {
  await page.goto(`/checkout/upgrade?plan=${plan}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(h1(page)).toHaveText("Check your email");
  await page.getByLabel("6-digit code").fill("123456");
}

test("pricing and checkout link existing customers to the upgrade", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("link", { name: "Upgrade your plan" })).toHaveAttribute("href", "/checkout/upgrade");
  await page.goto("/checkout?plan=enterprise");
  await page.getByRole("link", { name: "Upgrade your plan" }).click();
  await expect(page).toHaveURL(/\/checkout\/upgrade\?plan=enterprise$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("upgrade by email code: wrong code, compare, add-ons, pay, complete", async ({ page, context, request }) => {
  await page.goto("/checkout/upgrade?plan=growth");
  await expect(h1(page)).toHaveText("Upgrade your SideKick plan");
  await expect(page.getByRole("complementary", { name: "Growth plan" })).toContainText("$99.99 per month");
  await shot(page, "upgrade-email");

  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Please enter the email you use to sign in to SideKick.")).toBeVisible();

  const email = unique("owner");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(h1(page)).toHaveText("Check your email");
  await expect(h1(page)).toBeFocused();
  await expect(page.getByRole("status")).toContainText(`If ${email} has a SideKick account, we sent a 6-digit code.`);
  await expect(page.getByRole("button", { name: /Send a new code in 0:\d\d/ })).toBeDisabled();
  await expect(page.getByLabel("6-digit code")).toHaveAttribute("autocomplete", "one-time-code");
  await shot(page, "upgrade-code");

  // Paste-style input with spaces; a wrong code shows a field error and keeps the step.
  await page.getByLabel("6-digit code").fill("000 000");
  await expect(page.getByText("That code isn't right or has expired.")).toBeVisible();
  await expect(page.getByLabel("6-digit code")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("6-digit code").fill("123456");

  await expect(h1(page)).toHaveText("You're on Basic — upgrade to Growth");
  const cookie = (await context.cookies("http://127.0.0.1:3311/checkout")).find((c) => c.name === "sk_account");
  expect(cookie).toMatchObject({ httpOnly: true, path: "/checkout", sameSite: "Lax" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("sk_account");

  const compare = page.getByRole("table");
  await expect(compare).toContainText("Team members25");
  await expect(compare).toContainText("Website pagesHome pageUp to 6");
  await expect(page.getByRole("radio", { name: /Growth/ })).toBeChecked();

  const summary = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary).toContainText("Growth plan, rest of this cycle");
  await page.getByRole("button", { name: "Add one credit pack" }).click();
  await expect(summary).toContainText("1 AI credit pack");
  await expect(summary.locator("[aria-live]")).toContainText("Charged now$35");
  await expect(summary).toContainText("Charged now: $35 to Visa •••• 4242 — unlocks as soon as payment succeeds.");
  await shot(page, "upgrade-compare");

  const preview = (await (await request.get("http://127.0.0.1:4999/__upgrades")).json()).filter((c: { path: string; email?: string }) => c.path.endsWith("/preview") && c.email === email).at(-1);
  expect(preview.data).toEqual({ businessId: "biz_1", planKey: "growth", creditPacks: 1 });
  expect(preview.headers["x-sidekick-account-token"]).toMatch(/^acct_/);

  await page.getByRole("button", { name: "Pay $35 now" }).click();
  await expect(page).toHaveURL(/\/checkout\/upgrade\/complete\?change=chg_\d+$/);
  await expect(h1(page)).toHaveText("Upgrade complete", { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Open SideKick" })).toHaveAttribute("href", "http://127.0.0.1:4999/__crm/billing");
  await shot(page, "upgrade-complete");
  expect((await context.cookies("http://127.0.0.1:3311/checkout")).some((c) => c.name === "sk_account")).toBe(false);
});

test("several businesses: pick one, a lower plan is scheduled for the renewal with a warning", async ({ page }) => {
  await signInWithCode(page, unique("multi"), "basic");
  await expect(h1(page)).toHaveText("Choose a business");
  await expect(page.getByRole("radio", { name: /Brightside Washing/ })).not.toBeChecked();
  await page.getByRole("radio", { name: /Clearview Towing/ }).check();
  await expect(h1(page)).toHaveText("You're on Enterprise — switch to Basic");
  const summary = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary).toContainText("Nothing is charged now. The change takes effect at your next renewal on December 15, 2026.");
  await expect(summary).toContainText("Basic includes 2 team members.");
  await page.getByRole("button", { name: "Schedule change" }).click();
  await expect(h1(page)).toHaveText("Your change is scheduled", { timeout: 15_000 });
  await expect(page.getByText("Your plan changes at your next renewal on December 15, 2026.")).toBeVisible();
});

test("a bank check sends the customer to the Stripe invoice, then completes", async ({ page, request }) => {
  await signInWithCode(page, unique("sca"));
  await expect(h1(page)).toHaveText("You're on Basic — upgrade to Growth");
  await page.getByRole("button", { name: "Pay $25 now" }).click();
  await expect(h1(page)).toHaveText("Confirm the payment with your bank", { timeout: 15_000 });
  const pay = page.getByRole("link", { name: "Confirm payment on Stripe" });
  const href = await pay.getAttribute("href");
  expect(href).toMatch(/^http:\/\/127\.0\.0\.1:4999\/__invoice\/chg_\d+$/);
  await expect(pay).toHaveAttribute("target", "_blank");
  await expect(pay).toHaveAttribute("rel", "noopener noreferrer");
  await request.get(`${href}/pay`);
  await expect(h1(page)).toHaveText("Upgrade complete", { timeout: 15_000 });
});

test("a declined payment offers a retry, and too many code tries are explained", async ({ page }) => {
  await page.goto("/checkout/upgrade");
  await page.getByLabel("Email").fill(unique("decline"));
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("6-digit code").fill("999999");
  await expect(page.getByRole("form").getByRole("alert")).toContainText("Too many tries");
  await page.getByLabel("6-digit code").fill("123456");
  await expect(h1(page)).toHaveText("You're on Basic");
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("Choose a new plan or an add-on to see the price.");
  await page.locator("label", { hasText: "Enterprise" }).click();
  await expect(page.getByRole("radio", { name: /Enterprise/ })).toBeChecked();
  await page.getByRole("button", { name: "Pay $50 now" }).click();
  await expect(h1(page)).toHaveText("Your payment didn't go through", { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/checkout/upgrade");
});

test("upgrade pages have no horizontal overflow", async ({ page }) => {
  await signInWithCode(page, unique("multi"));
  await page.getByRole("radio", { name: /Brightside Washing/ }).check();
  await expect(page.getByRole("table")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
