// © 2026 Cipher CTS. All Rights Reserved.
// Reusable product page layout. Every product on the homepage gets its own page built from this, the same way /hlc was.
// Props: product (from lib/products.js); optional slots: `purchase` (a pricing / Stripe card) and `download` (a download card).
import Head from "next/head";
import { Space_Grotesk } from "next/font/google";
import Logo from "./Logo";
import ProductIcon from "./ProductIcon";
import { CONTACT, SITE, STATUS, products, productHref } from "../lib/products";
import p from "../styles/Product.module.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export default function ProductPage({ product, purchase = null, download = null }) {
  const status = STATUS[product.status];
  const url = `${SITE}/${product.slug}`;
  const title = `${product.name} | Cipher CTS`;
  const desc = product.summary;
  const mailto = `mailto:${CONTACT}?subject=${encodeURIComponent(`${product.name}: question for Cipher CTS`)}`;
  const others = products.filter((o) => o.slug !== product.slug);
  const ext = product.primary.external;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cipher CTS" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className={`${p.page} ${font.className}`}>
        <a className={p.skip} href="#main">Skip to the content</a>
        <header className={p.header}>
          <nav className={p.nav} aria-label="Main">
            <a href="/" className={p.brand} aria-label="Cipher CTS home"><Logo size={40} /></a>
            <ul className={p.navLinks}>
              <li><a href="/#products">All products</a></li>
              <li><a href="/hlc">HLC</a></li>
            </ul>
          </nav>
        </header>

        <main id="main" className={p.main} tabIndex={-1}>
          <nav aria-label="Breadcrumb" className={p.crumbs}>
            <a href="/#products">← All products</a>
          </nav>

          <section className={p.hero} aria-labelledby="product-title">
            <div className={p.heroHead}>
              <ProductIcon slug={product.slug} size={72} className={p.heroIcon} />
              <div>
                <h1 id="product-title" data-testid="product-title">{product.name}</h1>
                <p className={`${p.badge} ${p[`badge_${product.status}`]}`} data-testid="status-badge">
                  <span aria-hidden="true" className={p.dot} />
                  <span className={p.srOnly}>Status: </span>{status}
                </p>
              </div>
            </div>
            <p className={p.lead} data-testid="product-summary">{product.summary}</p>
            <p className={p.tagline}>Intelligent Systems. Zero Data Extraction.</p>
            <div className={p.ctas}>
              <a
                className={`${p.btn} ${p.btnPrimary}`}
                href={product.primary.href}
                data-testid="primary-cta"
                {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {product.primary.label}{ext ? <span aria-hidden="true"> →</span> : null}
                {ext ? <span className={p.srOnly}> (opens in a new tab)</span> : null}
              </a>
              <a className={`${p.btn} ${p.btnGhost}`} href={mailto} data-testid="contact-cta">Contact Cipher CTS</a>
            </div>
          </section>

          <section className={p.block} aria-labelledby="what-h">
            <h2 id="what-h">What it is</h2>
            {product.what.map((t, i) => <p key={i} className={p.body}>{t}</p>)}
          </section>

          <section className={p.block} aria-labelledby="points-h">
            <h2 id="points-h">Key points</h2>
            <ul className={p.points} data-testid="key-points">
              {product.points.map((k) => (
                <li key={k.title} className={p.point}>
                  <h3>{k.title}</h3>
                  <p>{k.text}</p>
                </li>
              ))}
            </ul>
          </section>

          {product.statusNote && (
            <section className={p.note} aria-labelledby="status-h" data-testid="status-note">
              <h2 id="status-h">Status</h2>
              <p>{product.statusNote}</p>
            </section>
          )}

          {purchase && <section className={p.slot} aria-label="Purchase" data-testid="slot-purchase">{purchase}</section>}
          {download && <section className={p.slot} aria-label="Download" data-testid="slot-download">{download}</section>}

          <section className={p.block} aria-labelledby="more-h">
            <h2 id="more-h">Other Cipher CTS products</h2>
            <ul className={p.others}>
              {others.map((o) => (
                <li key={o.slug}>
                  <a href={productHref(o)} className={p.otherLink}>
                    <ProductIcon slug={o.slug} size={36} />
                    <span>{o.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className={p.footer}>
          <p data-testid="footer-copyright">© 2026 Cipher CTS. All Rights Reserved.</p>
          <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
        </footer>
      </div>
    </>
  );
}
