// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Purchase card for a product page (slot `purchase` of <ProductPage>). Same pattern as the HLC card (components/hlc/License.js):
//   * OFF by default. The Purchase button exists only when NEXT_PUBLIC_<ID>_PURCHASE_ENABLED is exactly "true" AND a publishable key is set.
//     (The server enforces its own switch, <ID>_PURCHASE_ENABLED, in /api/checkout.)
//   * Until then the card says only "Opens soon". It never shows a price, a feature or a date.
//   * A price is shown only when NEXT_PUBLIC_PRICE_LABEL_<ID> is set (display text; the amount charged comes from Stripe).
//   * Reads ?license=success|cancelled on return from Stripe and shows the same messages as HLC. session_id is ignored.
// Next.js inlines NEXT_PUBLIC_* only when written out literally, so every product's names are spelled out in the map below
// (tests/product-flow.test.mjs checks the map against lib/products.js).
import { useEffect, useRef, useState } from "react";
import { LICENSE_BANNER_COPY, SUPPORT_EMAIL, licenseBannerFromSearch } from "../lib/hlc/license/banner";
import { getProduct } from "../lib/products";
import p from "../styles/Product.module.css";

export const PUBLIC_FLAGS = {
  cipher: { enabled: process.env.NEXT_PUBLIC_CIPHER_PURCHASE_ENABLED, label: process.env.NEXT_PUBLIC_PRICE_LABEL_CIPHER },
  "cipher-bot": { enabled: process.env.NEXT_PUBLIC_CIPHER_BOT_PURCHASE_ENABLED, label: process.env.NEXT_PUBLIC_PRICE_LABEL_CIPHER_BOT },
  "cipher-studio": { enabled: process.env.NEXT_PUBLIC_CIPHER_STUDIO_PURCHASE_ENABLED, label: process.env.NEXT_PUBLIC_PRICE_LABEL_CIPHER_STUDIO },
};
const ONLINE = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function ProductPurchase({ id }) {
  const product = getProduct(id);
  const flags = PUBLIC_FLAGS[id] || {};
  const enabled = flags.enabled === "true";
  const label = enabled && typeof flags.label === "string" ? flags.label.trim() : "";
  const [state, setState] = useState({ phase: "idle", message: "" }); // idle | loading | error
  const [banner, setBanner] = useState(null); // "success" | "cancelled" | null
  const sectionRef = useRef(null);

  useEffect(() => {
    // Browser only, after hydration. The session_id in the same URL is deliberately ignored.
    const v = licenseBannerFromSearch(window.location.search);
    if (v) {
      setBanner(v);
      sectionRef.current?.scrollIntoView({ block: "start" });
    }
  }, []);

  async function purchase() {
    if (!enabled || !ONLINE || state.phase === "loading") return;
    setState({ phase: "loading", message: "" });
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: id }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "We could not start the checkout.");
      window.location.assign(data.url);
    } catch (err) {
      const base = err.message || "We could not start the checkout.";
      const tail = base.includes(SUPPORT_EMAIL) ? "Nothing was charged. Please try again later." : `Nothing was charged. Please try again, or write to ${SUPPORT_EMAIL}.`;
      setState({ phase: "error", message: `${base} ${tail}` });
    }
  }

  const loading = state.phase === "loading";
  return (
    <div className={p.buy} id="license" ref={sectionRef} tabIndex={-1} data-testid={`purchase-${id}`}>
      <h2 className={p.buyH} id={`buy-${id}-h`}>Buy {product.name}</h2>
      {label && <p className={p.buyPrice} data-testid="purchase-price">{label}</p>}

      {/* The live region is always in the page so screen readers announce the text when it is filled in. */}
      <div className={p.live} role="status" aria-live="polite" aria-atomic="true" data-testid="license-live">
        {banner && (
          <div className={`${p.ret} ${banner === "success" ? p.retOk : p.retCancel}`} data-testid={banner === "success" ? "license-success" : "license-cancelled"}>
            <p className={p.retTitle}>{LICENSE_BANNER_COPY[banner].title}</p>
            {LICENSE_BANNER_COPY[banner].lines.map((line) => (
              <p className={p.retLine} key={line}>
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

      {!enabled && (
        <p className={p.closed} data-testid="purchase-closed">
          Opens soon. Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      )}
      {enabled && (
        <button
          type="button"
          className={`${p.btn} ${p.buyBtn}`}
          onClick={purchase}
          aria-disabled={!ONLINE || loading ? "true" : undefined}
          aria-describedby={ONLINE ? `buy-${id}-help` : `buy-${id}-soon`}
          data-testid="purchase-btn"
        >
          {loading ? "Opening secure checkout…" : `Buy ${product.name}`}
        </button>
      )}
      {enabled && !ONLINE && (
        <p className={p.closed} id={`buy-${id}-soon`} data-testid="purchase-soon">Online purchase opens soon</p>
      )}
      {enabled && ONLINE && (
        <p className={p.buyHelp} id={`buy-${id}-help`}>You pay on the secure Stripe page. Payments are handled by Stripe.</p>
      )}
      {state.phase === "error" && (
        <p className={p.err} role="alert" data-testid="purchase-error">{state.message}</p>
      )}
    </div>
  );
}
