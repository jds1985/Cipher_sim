// © 2026 Cipher CTS. All Rights Reserved.
import ProductPage from "../components/ProductPage";
import { getProduct } from "../lib/products";
import p from "../styles/Product.module.css";

// Pricing is not set yet. Dispatch is Coming Soon: no purchase button, no checkout, no price.
function Pricing() {
  return (
    <section className={p.pricing} aria-labelledby="pricing-h" data-testid="dispatch-pricing">
      <h2 id="pricing-h">Pricing</h2>
      <p className={p.priceMain}>Pricing coming soon</p>
      <p className={p.body}>Cipher Dispatch is not for sale yet. If you would like to hear when it is ready, ask for early access and we will write to you.</p>
      <div className={p.ctas}>
        <a className={`${p.btn} ${p.btnPrimary}`} href="/#early-access" data-testid="dispatch-early-access">Get early access</a>
      </div>
    </section>
  );
}

export default function Page() {
  return <ProductPage product={getProduct("cipher-dispatch")} pricing={<Pricing />} />;
}
