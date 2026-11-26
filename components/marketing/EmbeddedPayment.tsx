"use client";

import { useEffect, useMemo, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";

let stripe: Promise<Stripe | null> | null = null;

/** Loads Stripe.js once, only when checkout needs it (never on other pages). */
export function loadStripeOnce(publishableKey: string) {
  stripe ??= import("@stripe/stripe-js/pure").then((m) => m.loadStripe(publishableKey));
  return stripe;
}

/** Stripe's embedded Checkout form for one Checkout Session. Stripe returns to /checkout/complete?signup=… when paid. */
export default function EmbeddedPayment({ publishableKey, clientSecret, onLoadError }: { publishableKey: string; clientSecret: string; onLoadError: () => void }) {
  const promise = useMemo(() => loadStripeOnce(publishableKey), [publishableKey]);
  const options = useMemo(() => ({ clientSecret }), [clientSecret]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    promise.then(
      (s) => !s && live && setFailed(true),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [promise]);

  useEffect(() => {
    if (failed) {
      stripe = null; // let a later attempt load it again
      onLoadError();
    }
  }, [failed, onLoadError]);

  if (failed) return null;
  return (
    <EmbeddedCheckoutProvider stripe={promise} options={options}>
      <EmbeddedCheckout className="min-h-[420px]" />
    </EmbeddedCheckoutProvider>
  );
}
