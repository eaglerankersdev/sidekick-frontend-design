import type { Page } from "@playwright/test";

/**
 * Stands in for Stripe.js so tests never reach Stripe: `createEmbeddedCheckoutPage` mounts a static form that looks like
 * Stripe's embedded Checkout, with a "Pay" link to the mock API (which marks the signup paid and returns to /checkout/complete).
 */
const FAKE_STRIPE = String.raw`
(function () {
  var api = "http://127.0.0.1:4999";
  var field = "height:44px;border:1px solid #e0e0e6;border-radius:6px;padding:0 12px;display:flex;align-items:center;color:#a3acb9;font:15px system-ui;background:#fff";
  var label = "display:block;margin:16px 0 6px;font:500 13px system-ui;color:#30313d";
  function form(id) {
    return '<div style="padding:24px 24px 28px;font-family:system-ui;color:#30313d">' +
      '<div style="font:600 16px system-ui;margin-bottom:4px">Pay with card</div>' +
      '<span style="' + label + '">Email</span><div style="' + field + '">sam@brightside.co</div>' +
      '<span style="' + label + '">Card information</span>' +
      '<div style="' + field + ';border-radius:6px 6px 0 0;justify-content:space-between">1234 1234 1234 1234<span style="letter-spacing:4px">▭▭▭</span></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr"><div style="' + field + ';border-top:0;border-radius:0 0 0 6px">MM / YY</div><div style="' + field + ';border-top:0;border-left:0;border-radius:0 0 6px 0">CVC</div></div>' +
      '<span style="' + label + '">Cardholder name</span><div style="' + field + '">Full name on card</div>' +
      '<span style="' + label + '">Country or region</span><div style="' + field + ';color:#30313d">United States</div>' +
      '<a target="_top" href="' + api + '/__stripe/' + id + '/pay" style="margin-top:24px;height:46px;border-radius:6px;background:#0062fd;color:#fff;display:flex;align-items:center;justify-content:center;font:600 16px system-ui;text-decoration:none">Pay</a>' +
      '<p style="margin:14px 0 0;font:12px system-ui;color:#6a7383;text-align:center">Mock Stripe embedded Checkout (tests only)</p></div>';
  }
  function Stripe() {
    var noop = function () {};
    return {
      elements: noop, createToken: noop, createPaymentMethod: noop, confirmCardPayment: noop, _registerWrapper: noop, registerAppInfo: noop,
      createEmbeddedCheckoutPage: function (opts) {
        var m = /^cs_test_(su_\d+)_secret/.exec((opts && opts.clientSecret) || "");
        var node = null;
        window.__embeddedSecret = opts && opts.clientSecret;
        return Promise.resolve({
          mount: function (el) {
            if (typeof el === "string") el = document.querySelector(el);
            node = document.createElement("div");
            node.setAttribute("data-fake-stripe", "");
            node.innerHTML = form(m ? m[1] : "unknown");
            el.appendChild(node);
          },
          unmount: function () { if (node) node.remove(); },
          destroy: function () { if (node) node.remove(); },
        });
      },
    };
  }
  Stripe.version = "endive";
  window.Stripe = Stripe;
})();
`;

export async function mockStripe(page: Page) {
  // The last registered route wins: block every other Stripe host, then serve the fake Stripe.js.
  await page.route("https://*.stripe.com/**", (route) => route.abort());
  await page.route("https://js.stripe.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: FAKE_STRIPE }));
}
