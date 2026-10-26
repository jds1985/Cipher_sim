import Head from "next/head";
import { useState } from "react";
import { Space_Grotesk } from "next/font/google";
import Logo from "../components/Logo";
import ProductIcon from "../components/ProductIcon";
import { products, productHref } from "../lib/products";
import s from "../styles/Home.module.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

import { CONTACT, SITE } from "../lib/products";


const pillars = [
  { icon: "🔒", title: "Complete Data Sovereignty", text: "We reject the surveillance data-pipeline. Our systems run statelessly with zero cloud retention, logging, or dataset harvesting." },
  { icon: "⚡", title: "Extreme Computational Efficiency", text: "Instead of requiring bloated server clusters, our models operate within lean footprints, reducing cost and energy consumption." },
  { icon: "📦", title: "Zero-Friction Deployment", text: "Practical business utility delivered without invasive hardware retrofits or months of complex onboarding cycles." },
];

const links = [["Products", "#products"], ["HLC", "/hlc"], ["Technology", "#technology"], ["Privacy", "#privacy"], ["About", "#about"]];

export default function Home() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent("Cipher CTS early access");
    const body = encodeURIComponent(`Please add me to the Cipher CTS early access list.\n\nEmail: ${email}`);
    window.location.href = `mailto:${CONTACT}?subject=${subject}&body=${body}`;
  };

  const title = "Cipher CTS | Private, Local-First AI";
  const desc = "Intelligent Systems. Zero Data Extraction. Cipher CTS builds private AI that runs on your devices, not our servers.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={SITE} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cipher CTS" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={SITE} />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={`${SITE}/og-image.png`} />
      </Head>

      <div className={`${s.page} ${font.className}`}>
        <div className={s.bg} aria-hidden="true"><span className={s.orbA} /><span className={s.orbB} /><span className={s.orbC} /><span className={s.orbD} /></div>

        <header className={s.navWrap}>
          <nav className={`${s.nav} ${s.glass}`} aria-label="Main">
            <a href="#top" className={s.brand} aria-label="Cipher CTS home"><Logo size={34} /></a>
            <div className={`${s.links} ${open ? s.linksOpen : ""}`}>
              {links.map(([l, h]) => <a key={l} href={h} onClick={() => setOpen(false)}>{l}</a>)}
              <a href="#early-access" className={`${s.btn} ${s.btnPrimary} ${s.navCta}`} onClick={() => setOpen(false)}>Get Early Access</a>
            </div>
            <button className={s.burger} aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
              <span /><span /><span />
            </button>
          </nav>
        </header>

        <main id="top">
          <section className={`${s.section} ${s.hero}`}>
            <div className={s.heroText}>
              <span className={`${s.pill} ${s.glass}`}><span className={s.dot} /> Private, local-first AI</span>
              <h1>Intelligent Systems.<br /><span className="grad-text">Zero Data Extraction.</span></h1>
              <p className={s.lead}>Private AI that runs on your devices, not our servers.</p>
              <div className={s.ctas}>
                <a href="#early-access" className={`${s.btn} ${s.btnPrimary}`}>Get Early Access</a>
                <a href="#privacy" className={`${s.btn} ${s.btnGlass}`}>Our Privacy Promise</a>
              </div>
            </div>
            <div className={s.phoneWrap} aria-hidden="true">
              <div className={s.phone}>
                <div className={s.notch} />
                <div className={s.chatHead}><Logo size={22} /><span className={s.offline}>● On-device</span></div>
                <div className={`${s.msg} ${s.me}`}>Summarize my notes from today.</div>
                <div className={`${s.msg} ${s.ai}`}>Done. Three key points from your notes, processed right here on your phone.</div>
                <div className={`${s.msg} ${s.me}`}>Did that go to the cloud?</div>
                <div className={`${s.msg} ${s.ai}`}>No. Nothing left this device.</div>
                <div className={s.inputBar}><span>Message Cipher…</span><b>↑</b></div>
              </div>
            </div>
          </section>

          <section id="products" className={s.section}>
            <div className={s.head}><span className={s.kicker}>Products</span><h2>Private AI, built for you</h2></div>
            <div className={s.grid4}>
              {products.map((p) => {
                const inner = (
                  <>
                    <div className={s.cardTop}><span className={s.icon}><ProductIcon slug={p.slug} size={64} /></span><span className={`${s.tag} ${p.live ? s.tagLive : ""}`}>{p.cardTag}</span></div>
                    <h3>{p.name}</h3>
                    <p>{p.cardDesc}</p>
                    <span className={s.more}>{p.cardCta || `Learn more about ${p.name} →`}</span>
                  </>
                );
                return <a key={p.slug} href={productHref(p)} data-testid={`card-${p.slug}`} className={`${s.card} ${s.glass} ${s.cardLink} ${p.wide ? s.cardWide : ""}`}>{inner}</a>;
              })}
            </div>
          </section>

          <section className={`${s.section} ${s.stats}`} aria-label="Highlights">
            {["Runs offline", "73 MB model", "Zero cloud retention"].map((t) => (
              <div key={t} className={`${s.stat} ${s.glass}`}><span className="grad-text">{t}</span></div>
            ))}
          </section>

          <section id="technology" className={`${s.section} ${s.tech}`}>
            <div>
              <span className={s.kicker}>Technology</span>
              <h2>Ternary weights. Tiny models.</h2>
              <p>Our models use ternary weights: every weight is −1, 0 or +1. Instead of storing large floating-point numbers, each weight carries just enough information to do its job.</p>
              <p>The result is models that are tiny, fast and efficient, small enough to run directly on a phone, with no server round-trip.</p>
            </div>
            <div className={`${s.ternary} ${s.glass}`} aria-label="Ternary values: minus one, zero, plus one">
              {["−1", "0", "+1"].map((v) => <div key={v} className={s.tval}><span>{v}</span><i /></div>)}
            </div>
          </section>

          <section id="privacy" className={s.section}>
            <div className={s.head}><span className={s.kicker}>Our Privacy Promise</span><h2>Why Cipher CTS</h2></div>
            <div className={s.grid3}>
              {pillars.map((p) => (
                <div key={p.title} className={`${s.card} ${s.glass}`}><span className={s.icon}>{p.icon}</span><h3>{p.title}</h3><p>{p.text}</p></div>
              ))}
            </div>
          </section>

          <section id="about" className={`${s.section} ${s.about}`}>
            <span className={s.kicker}>About</span>
            <h2>A private, local-first AI company</h2>
            <p>Cipher CTS builds AI that respects a simple boundary: your data stays yours. We design compact models and products that run on the devices you already own.</p>
          </section>

          <section id="early-access" className={s.section}>
            <div className={`${s.signup} ${s.glass}`}>
              <h2>Get early access</h2>
              <p>Be first to try Cipher, Cipher Bot and Cipher Studio.</p>
              <form className={s.form} onSubmit={submit}>
                <label htmlFor="ea-email" className={s.sr}>Email address</label>
                <input id="ea-email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>Request access</button>
              </form>
              <small>Opens your email app to send a request to {CONTACT}.</small>
            </div>
          </section>
        </main>

        <footer className={`${s.footer} ${s.glass}`}>
          <Logo size={28} />
          <span>© 2026 Cipher CTS</span>
        </footer>
      </div>
    </>
  );
}
