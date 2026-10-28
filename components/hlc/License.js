// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Secondary call to action next to the free download: the paid "Enterprise Fleet Deployment" licence.
// Purchase starts a Stripe Checkout session through POST /api/checkout, then redirects to session.url.
import { useEffect, useRef, useState } from "react";
import { LICENSE_BANNER_COPY, SUPPORT_EMAIL, licenseBannerFromSearch } from "../../lib/hlc/license/banner";

const CONTACT = SUPPORT_EMAIL;
// Both are inlined at build time.
// ENABLED is the master switch: unless NEXT_PUBLIC_HLC_PURCHASE_ENABLED is exactly "true" the Purchase button is not shown at all.
// (The server enforces the same switch with HLC_PURCHASE_ENABLED in /api/checkout.)
const ENABLED = process.env.NEXT_PUBLIC_HLC_PURCHASE_ENABLED === "true";
// Without a publishable key the purchase button stays off and says so.
const ONLINE = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const FEATURES = [
  { text: "Production & revenue-generating use rights per licensed asset" },
  { text: "Commercial license agreement" },
  { text: "Priority support" },
  { text: "Multi-asset dashboard license", soon: true },
  { text: "Custom sensor schema generator", soon: true },
];

export default function License() {
  const [state, setState] = useState({ phase: "idle", message: "" }); // idle | loading | error
  const [banner, setBanner] = useState(null); // "success" | "cancelled" | null
  const sectionRef = useRef(null);

  useEffect(() => {
    // Read after hydration (browser only). The session_id in the same URL is deliberately ignored.
    const v = licenseBannerFromSearch(window.location.search);
    if (v) {
      setBanner(v);
      // The banner appears after the page has already jumped to #license, so bring the card back into view.
      sectionRef.current?.scrollIntoView({ block: "start" });
    }
  }, []);

  async function purchase() {
    if (!ENABLED || !ONLINE || state.phase === "loading") return;
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
    <section className="hx-paid" id="license" ref={sectionRef} aria-labelledby="hx-lic-h" tabIndex={-1}>
      <span className="hx-kicker">Commercial license</span>
      <h2 className="hx-h2" id="hx-lic-h">
        Enterprise Fleet Deployment
      </h2>
      <p className="hx-price" data-testid="license-price">
        <span className="hx-price-num">$499</span> / asset / year
      </p>

      {/* The live region is always in the page so screen readers announce the text when it is filled in. */}
      <div className="hx-live" role="status" aria-live="polite" aria-atomic="true" data-testid="license-live">
        {banner && (
          <div
            className={`hx-return ${banner === "success" ? "hx-return-ok" : "hx-return-cancel"}`}
            data-testid={banner === "success" ? "license-success" : "license-cancelled"}
          >
            <p className="hx-return-title">{LICENSE_BANNER_COPY[banner].title}</p>
            {LICENSE_BANNER_COPY[banner].lines.map((line) => (
              <p className="hx-return-line" key={line}>
                {line.includes(SUPPORT_EMAIL) ? (
                  <>
                    {line.split(SUPPORT_EMAIL)[0]}
                    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                    {line.split(SUPPORT_EMAIL)[1]}
                  </>
                ) : (
                  line
                )}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="hx-meta" data-testid="license-honest">
        The free evaluation build is for personal, non-commercial use only. The commercial license covers production use of the engine per asset, with a license agreement and support.
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

      {!ENABLED && (
        <p className="hx-closed" data-testid="purchase-closed">
          Commercial licenses open soon. Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
      )}
      {ENABLED && (
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
      )}

      {ENABLED && !ONLINE && (
        <p className="hx-soon-note" id="hx-lic-soon" data-testid="purchase-soon">
          Online purchase opens soon
        </p>
      )}
      {ENABLED && ONLINE && (
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
        Read the <a href="/hlc/commercial-terms" data-testid="commercial-terms-link">Cipher CTS Commercial License Terms</a>.{ENABLED ? " You accept them when you purchase." : ""}
      </p>
      <p className="hx-file">
        Questions, more than 50 assets, or prefer an invoice? Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </section>
  );
}
