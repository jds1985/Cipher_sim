// © 2026 Cipher CTS. All Rights Reserved.
import ProductPage from "../components/ProductPage";
import { CONTACT, getProduct } from "../lib/products";
import p from "../styles/Product.module.css";

// Pricing is shown for information only. Concierge is intentionally NOT in paid checkout yet:
// trials start by email, so there is no purchase button here.
function Pricing() {
  const mailto = `mailto:${CONTACT}?subject=${encodeURIComponent("Cipher Concierge: start a free trial")}`;
  return (
    <section className={p.pricing} aria-labelledby="pricing-h" data-testid="concierge-pricing">
      <h2 id="pricing-h">Pricing</h2>
      <p className={p.priceMain}>$3 per room, per month</p>
      <p className={p.priceSub}>$99 monthly minimum</p>
      <ul className={p.priceList}>
        <li>30-day free trial.</li>
        <li>No extra hardware. Guests scan the QR card in their room.</li>
      </ul>
      <div className={p.founding} data-testid="founding-offer">
        <h3>Founding hotel offer: half off for 12 months</h3>
        <p>$1.50 per room, per month, with a $49.50 monthly minimum, for your first 12 months.</p>
        <p>In exchange, we ask for a testimonial. Limited founding spots.</p>
      </div>
      <div className={p.ctas}>
        <a className={`${p.btn} ${p.btnPrimary}`} href={mailto} data-testid="trial-cta">Contact us to start a free trial</a>
      </div>
    </section>
  );
}

export default function Page() {
  return <ProductPage product={getProduct("cipher-concierge")} pricing={<Pricing />} />;
}
