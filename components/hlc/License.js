// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// Secondary call to action next to the free download: the paid "Enterprise Fleet Deployment" licence.
// Purchase starts a Stripe Checkout session through POST /api/checkout, then redirects to session.url.
import { useEffect, useState } from "react";

const CONTACT = "team@ciphercts.com";
// Inlined at build time. Without a publishable key the purchase button stays off and says so.
const ONLINE = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const FEATURES = [
  { text: "Commercial production package, sent by a secure one-time download link" },
  { text: "Written commercial license agreement for your fleet" },
  { text: "Priority support" },
  { text: "Multi-asset dashboard license", soon: true },
  { text: "Custom sensor schema generator", soon: true },
];

export default function License() {
  const [state, setState] = useState({ phase: "idle", message: "" }); // idle | loading | error
  const [banner, setBanner] = useState(null); // "success" | "cancelled" | null

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("license");
    if (v === "success" || v === "cancelled") setBanner(v);
  }, []);

  async function purchase() {
    if (!ONLINE || state.phase === "loading") return;
    setState({ phase: "loading", message: "" });
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "We could not start the checkout.");
      window.location.assign(data.url);
    } catch (err) {
      const base = err.message || "We could not start the checkout.";
      const tail = base.includes(CONTACT) ? "Nothing was charged. Please try again later." : `Nothing was charged. Please try again, or write to ${CONTACT}.`;
      setState({ phase: "error", message: `${base} ${tail}` });
    }
  }

  const loading = state.phase === "loading";
  return (
    <section className="hx-lic" id="license" aria-labelledby="hx-lic-h" tabIndex={-1}>
      <span className="hx-kicker">Commercial license</span>
      <h2 className="hx-h2" id="hx-lic-h">
        Enterprise Fleet Deployment
      </h2>
      <p className="hx-price" data-testid="license-price">
        <span className="hx-price-num">$499</span> / asset / year
      </p>

      {banner === "success" && (
        <p className="hx-note hx-note-ok" role="status" data-testid="license-success">
          Thank you. Your payment was received. Please check your email for the secure download link. It can take a few minutes to arrive.
        </p>
      )}
      {banner === "cancelled" && (
        <p className="hx-note" role="status" data-testid="license-cancelled">
          Checkout was cancelled. Nothing was charged.
        </p>
      )}

      <p className="hx-meta" data-testid="license-honest">
        The open evaluation engine stays free under Apache 2.0. The commercial license adds the production package below, a license agreement, and support.
      </p>

      <ul className="hx-feat" aria-label="What the commercial license includes">
        {FEATURES.map((f) => (
          <li key={f.text}>
            <span aria-hidden="true" className="hx-tick">✓</span>
            <span>
              {f.text}
              {f.soon && (
                <>
                  {" "}
                  <span className="hx-soon" data-testid="coming-soon">Coming soon</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`hx-btn ${ONLINE ? "hx-btn-buy" : "hx-btn-off"}`}
        onClick={purchase}
        aria-disabled={!ONLINE || loading ? "true" : undefined}
        aria-describedby={ONLINE ? "hx-lic-help" : "hx-lic-soon"}
        data-testid="purchase-btn"
      >
        {loading ? "Opening secure checkout…" : "Purchase Commercial Production License"}
      </button>

      {!ONLINE && (
        <p className="hx-soon-note" id="hx-lic-soon" data-testid="purchase-soon">
          Online purchase opens soon
        </p>
      )}
      {ONLINE && (
        <p className="hx-file" id="hx-lic-help">
          You choose how many assets (1 to 50) on the secure Stripe page. Payments are handled by Stripe.
        </p>
      )}
      {state.phase === "error" && (
        <p className="hx-err" role="alert" data-testid="purchase-error">
          {state.message}
        </p>
      )}
      <p className="hx-file">
        Questions, more than 50 assets, or prefer an invoice? Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </section>
  );
}
