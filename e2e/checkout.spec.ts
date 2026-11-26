import { expect, test, type Page } from "@playwright/test";
import { mockStripe } from "./fake-stripe";

// Stripe.js is always the local fake (e2e/fake-stripe.ts): these tests never reach Stripe.
test.beforeEach(async ({ page }) => mockStripe(page));

// SHOTS=1 also saves the screenshots kept in docs/screenshots (converted to webp afterwards).
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

/** Phones only: the first screen as a buyer sees it, with the sticky total bar. */
async function viewportShot(page: Page, name: string) {
  if (!process.env.SHOTS || test.info().project.name !== "mobile") return;
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: `docs/screenshots/${name}-390-viewport.png`, animations: "disabled" });
}

const embedded = (page: Page) => page.locator("[data-fake-stripe]");

const unique = (prefix: string) => `${prefix}-${test.info().project.name}-${Date.now()}@example.com`;

async function fillCheckout(page: Page, email: string) {
  await page.getByLabel("Full name").fill("Sam Rivera");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Phone").fill("+1 555 0100");
  await page.getByLabel("Business name").fill("Brightside Washing");
  await page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/ }).check();
}

async function payWith(page: Page, email: string) {
  await page.goto("/checkout?plan=growth");
  await fillCheckout(page, email);
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await embedded(page).getByRole("link", { name: "Pay" }).click();
  await expect(page).toHaveURL(/\/checkout\/complete\?signup=su_\d+$/);
}

test("checkout shows the live plan, opens the embedded Stripe form and forwards to set the password", async ({ page, context, request }) => {
  await page.goto("/checkout?plan=growth");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your Growth plan");
  for (const text of ["$99.99", "+$10/mo each", "+$10 per 1,000", "Free · billed by CallRail", "Most popular"]) await expect(page.getByRole("form")).toContainText(text);
  const summary = page.getByRole("complementary", { name: "Order summary" });
  for (const text of ["Service workspaces2", "AI credits each month1,500", "Team members5", "Website pagesUp to 6", "Service pagesOne page", "Due today$99.99"]) await expect(summary).toContainText(text);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  // Plans switch in place: title, summary and the upgrade link follow.
  await page.locator("label", { hasText: "Enterprise" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your Enterprise plan");
  await expect(summary).toContainText("Due today$149.99");
  await expect(page).toHaveURL(/\/checkout\?plan=enterprise$/);
  await expect(page.getByRole("link", { name: "Upgrade your plan" })).toHaveAttribute("href", "/checkout/upgrade?plan=enterprise");
  await page.getByRole("button", { name: "Compare everything each plan includes" }).click();
  await expect(page.getByRole("table")).toContainText("Service pagesNot includedOne pageOne per service");
  await page.locator("label", { hasText: "Growth" }).click();
  await expect(page.getByRole("radio", { name: /Growth/ })).toBeChecked();

  const email = unique("e2e");
  await fillCheckout(page, email);
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(embedded(page)).toBeVisible();
  await expect(page).toHaveURL(/\/checkout\?plan=growth$/);
  // Details are locked while Stripe's form is open, so what Stripe charges matches the summary.
  await expect(page.getByLabel("Work email")).toBeDisabled();
  expect(await page.evaluate(() => (window as unknown as { __embeddedSecret?: string }).__embeddedSecret)).toMatch(/^cs_test_su_\d+_secret_mock$/);

  const last = (await (await request.get("http://127.0.0.1:4999/__signups")).json()).find((s: { data: { email: string } }) => s.data.email === email);
  expect(last.data).toMatchObject({ planKey: "growth", phone: "+1 555 0100", businessName: "Brightside Washing", acceptTerms: true, checkoutMode: "embedded" });
  expect(last.headers["idempotency-key"]).toMatch(/^[0-9a-f-]{36}$/);
  const cookie = (await context.cookies("http://127.0.0.1:3311/checkout")).find((c) => c.name === `sk_signup_${last.id}`);
  expect(cookie).toMatchObject({ httpOnly: true, path: "/checkout", sameSite: "Lax" });
  // The signup token stays in the httpOnly cookie: never in the page.
  expect(await page.content()).not.toContain("tok_");
  expect(await page.evaluate(() => document.cookie)).not.toContain("sk_signup_");

  await embedded(page).getByRole("link", { name: "Pay" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Payment confirmed. Set your password", { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Set your password" })).toHaveAttribute("href", "http://127.0.0.1:4999/__crm/set-password?t=mock");
  await expect(page).toHaveURL("http://127.0.0.1:4999/__crm/set-password?t=mock", { timeout: 10_000 });
  expect((await context.cookies("http://127.0.0.1:3311/checkout")).some((c) => c.name === `sk_signup_${last.id}`)).toBe(false);
});

test("add-ons update the order summary live and reach the signup", async ({ page, request }) => {
  await page.goto("/checkout?plan=growth");
  const seats = page.getByRole("button", { name: "Add one team member" });
  for (let i = 0; i < 3; i++) await seats.click();
  await page.getByRole("button", { name: "Add one credit pack" }).click();
  await page.getByRole("button", { name: "Add one credit pack" }).click();
  await page.getByRole("switch", { name: /CallRail/ }).check();
  await expect(page.getByLabel("Extra team members")).toHaveValue("3");

  const summary = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary).toContainText("3 extra team members");
  await expect(summary).toContainText("2 AI credit packs2,000 credits");
  await expect(summary).toContainText("CallRail call tracking");
  await expect(summary.locator("[aria-live]")).toHaveText("Due today$149.99then $129.99/month");
  if (test.info().project.name === "mobile") {
    const toggle = page.getByRole("button", { name: /^Order/ });
    await expect(toggle).toContainText("$149.99 due today");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(summary.getByText("Due today", { exact: true })).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  }

  // Typing works too, and stays within the limit.
  await page.getByLabel("AI credit packs").fill("35");
  await expect(page.getByLabel("AI credit packs")).toHaveValue("20");
  await page.getByLabel("AI credit packs").fill("2");
  await page.getByRole("button", { name: "Remove one team member" }).click();
  await expect(summary.locator("[aria-live]")).toHaveText("Due today$139.99then $119.99/month");

  const email = unique("addons");
  await fillCheckout(page, email);
  await shot(page, "checkout-form");
  await viewportShot(page, "checkout-form");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(embedded(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to payment" })).toHaveCount(0);
  const last = (await (await request.get("http://127.0.0.1:4999/__signups")).json()).find((s: { data: { email: string } }) => s.data.email === email);
  expect(last.data.addons).toEqual({ extraSeats: 2, creditPacks: 2, callRail: true });
  await shot(page, "checkout-embedded");

  // Editing the order closes Stripe's form and unlocks the details; the next attempt is a new signup.
  await page.getByRole("button", { name: "Edit order" }).click();
  await expect(embedded(page)).toHaveCount(0);
  await expect(page.getByLabel("Work email")).toBeEnabled();
  await page.getByRole("button", { name: "Add one team member" }).click();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(embedded(page)).toBeVisible();
  const again = (await (await request.get("http://127.0.0.1:4999/__signups")).json()).filter((s: { data: { email: string } }) => s.data.email === email);
  expect(again).toHaveLength(2);
  expect(again[1].data.addons.extraSeats).toBe(3);
});

test("an API without embedded Checkout falls back to Stripe's hosted page", async ({ page }) => {
  await page.goto("/checkout?plan=growth");
  await fillCheckout(page, unique("hosted"));
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4999\/__stripe\/su_\d+$/);
  await page.getByRole("link", { name: "Pay" }).click();
  await expect(page).toHaveURL(/\/checkout\/complete\?signup=su_\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Payment confirmed. Set your password", { timeout: 15_000 });
});

test("ready state, captured before the auto-forward", async ({ page }) => {
  test.skip(!process.env.SHOTS, "screenshot only");
  await page.clock.install();
  await payWith(page, unique("e2e"));
  const h1 = page.getByRole("heading", { level: 1 });
  for (let i = 0; i < 8 && (await h1.textContent()) !== "Payment confirmed. Set your password"; i++) {
    await page.clock.runFor(2100);
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Payment confirmed. Set your password");
  await shot(page, "checkout-ready");
});

test("a slow confirmation keeps polling", async ({ page }) => {
  await payWith(page, unique("slow"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Confirming your payment");
  await page.waitForTimeout(2500);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Confirming your payment");
  await shot(page, "checkout-processing");
});

test("cancelling on Stripe's hosted page returns to the form with a note", async ({ page }) => {
  await page.goto("/checkout?plan=growth");
  await fillCheckout(page, unique("hosted"));
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL(/\/checkout\?plan=growth&cancelled=1$/);
  await expect(page.getByRole("status")).toHaveText("Checkout cancelled. Nothing was charged.");
  await shot(page, "checkout-cancelled");
});

test("an existing account is sent to sign in", async ({ page }) => {
  await payWith(page, unique("existing"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You already have an account");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "http://127.0.0.1:4999/__crm/sign-in");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await shot(page, "checkout-existing-account");
});

test("a failed payment offers a retry for the same plan", async ({ page }) => {
  await payWith(page, unique("fail"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your payment didn't go through");
  await expect(page.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/checkout?plan=growth");
  await shot(page, "checkout-failed");
});

test("an unavailable plan and field errors keep the typed values", async ({ page }) => {
  await page.goto("/checkout?plan=growth");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByRole("form").getByRole("alert")).toHaveText("Please fix the highlighted fields.");
  await expect(page.getByText("Please agree to the Terms and Privacy Policy to continue.")).toBeVisible();
  await expect(page.getByLabel("Work email")).toHaveAttribute("aria-invalid", "true");

  await fillCheckout(page, "bad@example.com");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByText("Please enter a valid work email.")).toBeVisible();

  await page.getByLabel("Work email").fill("sold@example.com");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByRole("form").getByRole("alert")).toContainText("can't be bought online right now");
  await expect(page.getByRole("form").getByRole("alert").getByRole("link", { name: "Talk to sales" })).toHaveAttribute("href", "/contact?plan=growth");
  await expect(page.getByLabel("Business name")).toHaveValue("Brightside Washing");
});

test("unknown checkouts and plans fail safely", async ({ page }) => {
  await page.goto("/checkout/complete?signup=su_404");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find this checkout");
  await page.goto("/checkout?plan=platinum");
  await expect(page).toHaveURL(/\/pricing#plans$/);
});

test("checkout has no horizontal overflow", async ({ page }) => {
  await page.goto("/checkout?plan=enterprise");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
