import { expect, test, type Page } from "@playwright/test";

// SHOTS=1 also saves the screenshots kept in docs/screenshots (converted to webp afterwards).
async function shot(page: Page, name: string) {
  if (!process.env.SHOTS) return;
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const suffix = test.info().project.name === "mobile" ? "390" : "desktop";
  await page.screenshot({ path: `docs/screenshots/${name}-${suffix}.png`, fullPage: true, animations: "disabled" });
}

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
  await expect(page).toHaveURL(/127\.0\.0\.1:4999\/__stripe\/su_\d+$/);
  await page.getByRole("link", { name: "Pay" }).click();
  await expect(page).toHaveURL(/\/checkout\/complete\?signup=su_\d+$/);
}

test("checkout shows the live plan, then pays on Stripe and forwards to set the password", async ({ page, context, request }) => {
  await page.goto("/checkout?plan=growth");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Start your Growth plan");
  for (const text of ["$99.99", "1,500", "$10/month each"]) await expect(page.getByRole("form")).toContainText(text);
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("Due today$99.99");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await shot(page, "checkout-form");

  const email = unique("e2e");
  await fillCheckout(page, email);
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page).toHaveURL(/__stripe\/su_\d+$/);

  const last = (await (await request.get("http://127.0.0.1:4999/__signups")).json()).find((s: { data: { email: string } }) => s.data.email === email);
  expect(last.data).toMatchObject({ planKey: "growth", phone: "+1 555 0100", businessName: "Brightside Washing", acceptTerms: true });
  expect(last.headers["idempotency-key"]).toMatch(/^[0-9a-f-]{36}$/);
  const cookie = (await context.cookies("http://127.0.0.1:3311/checkout")).find((c) => c.name === `sk_signup_${last.id}`);
  expect(cookie).toMatchObject({ httpOnly: true, path: "/checkout", sameSite: "Lax" });

  await page.getByRole("link", { name: "Pay" }).click();
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
  await expect(summary.locator("[aria-live]")).toHaveText("Due today$149.99Then $129.99 per month");
  if (test.info().project.name === "mobile") {
    const toggle = page.getByRole("button", { name: /Show order summary/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(summary.getByText("Due today")).toBeVisible();
  }

  // Typing works too, and stays within the limit.
  await page.getByLabel("AI credit packs").fill("35");
  await expect(page.getByLabel("AI credit packs")).toHaveValue("20");
  await page.getByLabel("AI credit packs").fill("2");
  await page.getByRole("button", { name: "Remove one team member" }).click();
  await expect(summary.locator("[aria-live]")).toHaveText("Due today$139.99Then $119.99 per month");
  await shot(page, "checkout-addons");

  const email = unique("addons");
  await fillCheckout(page, email);
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page).toHaveURL(/__stripe\/su_\d+$/);
  const last = (await (await request.get("http://127.0.0.1:4999/__signups")).json()).find((s: { data: { email: string } }) => s.data.email === email);
  expect(last.data.addons).toEqual({ extraSeats: 2, creditPacks: 2, callRail: true });
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

test("cancelling on Stripe returns to the form with a note", async ({ page }) => {
  await page.goto("/checkout?plan=growth");
  await fillCheckout(page, unique("e2e"));
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
