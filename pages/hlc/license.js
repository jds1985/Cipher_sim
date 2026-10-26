// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
import fs from "fs";
import path from "path";
import Head from "next/head";
import { useState } from "react";
import { Space_Grotesk } from "next/font/google";
import Logo from "../../components/Logo";
import s from "../../styles/Home.module.css";
import h from "../../styles/Hlc.module.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const SITE = "https://ciphercts.com";
const EMAIL = "team@ciphercts.com";
const links = [["Products", "/#products"], ["Technology", "/#technology"], ["Privacy", "/#privacy"], ["About", "/#about"]];

// The license text lives in one plain-text file (the same file ships in the zip as LICENSE).
// One line = one paragraph. "N. Title" starts a section, "(a) ..." lines are list items.
export async function getStaticProps() {
  const raw = fs.readFileSync(path.join(process.cwd(), "content", "hlc", "HLC_EVALUATION_LICENSE.txt"), "utf8");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const [title, version, ...rest] = lines;
  const blocks = [];
  for (const l of rest) {
    if (/^\d+\.\s/.test(l)) blocks.push({ t: "h", text: l });
    else if (/^\([a-z]\)\s/.test(l)) {
      const last = blocks[blocks.length - 1];
      if (last && last.t === "ul") last.items.push(l);
      else blocks.push({ t: "ul", items: [l] });
    } else blocks.push({ t: "p", text: l });
  }
  return { props: { title, version, blocks } };
}

function Linkify({ text }) {
  const parts = text.split(EMAIL);
  return parts.flatMap((p, i) => (i < parts.length - 1 ? [p, <a key={i} href={`mailto:${EMAIL}`}>{EMAIL}</a>] : [p]));
}

export default function HlcLicense({ title, version, blocks }) {
  const [open, setOpen] = useState(false);
  const pageTitle = "HLC Edge Engine Evaluation License | Cipher CTS";
  const desc = "The Cipher CTS Proprietary Evaluation License for the HLC Edge Engine Evaluation & Benchmarking Build. Personal, non-commercial use only; commercial use needs a paid license.";
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={desc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${SITE}/hlc/license`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cipher CTS" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={`${SITE}/hlc/license`} />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
      </Head>
      <div className={`${s.page} ${font.className} ${h.solidBrand}`}>
        <div className={`${s.bg} ${h.bgDim}`} aria-hidden="true"><span className={s.orbA} /><span className={s.orbB} /><span className={s.orbC} /><span className={s.orbD} /></div>
        <a className={h.skip} href="#license-text">Skip to the license text</a>
        <header className={`${s.navWrap} ${h.navBig}`}>
          <nav className={`${s.nav} ${s.glass}`} aria-label="Main">
            <a href="/" className={s.brand} aria-label="Cipher CTS home"><Logo size={40} /></a>
            <div className={`${s.links} ${open ? s.linksOpen : ""}`}>
              {links.map(([l, href]) => <a key={l} href={href} onClick={() => setOpen(false)}>{l}</a>)}
              <a href="/hlc" className={h.navCurrent} onClick={() => setOpen(false)}>HLC</a>
              <a href="/#early-access" className={`${s.btn} ${s.btnPrimary} ${s.navCta} ${h.navCtaSolid}`} onClick={() => setOpen(false)}>Get Early Access</a>
            </div>
            <button className={s.burger} aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
              <span /><span /><span />
            </button>
          </nav>
        </header>

        <main className={`${h.hlc} hx`} id="top">
          <header className="hx-hero">
            <span className="hx-kicker">HLC · Cipher CTS</span>
            <h1 className="hx-title" data-testid="license-title">{title}</h1>
            <p className="hx-lic-ver" data-testid="license-version">{version}</p>
            <p className="hx-lead">
              This is the license for the free <strong>Evaluation &amp; Benchmarking Build (Personal &amp; Non-Commercial Use Only)</strong> of the HLC Edge Engine.
              Production, industrial fleet, or revenue-generating use requires a paid commercial license.
            </p>
            <div className="hx-cta">
              <a className="hx-btn hx-btn-ghost" href="/hlc#download">← Back to the HLC page</a>
              <a className="hx-btn hx-btn-primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent("HLC Edge Engine: production / fleet licensing inquiry")}`} data-testid="license-contact">✉ Email {EMAIL}</a>
            </div>
          </header>

          <article className="hx-lic" id="license-text" tabIndex={-1} aria-label="License text" data-testid="license-text">
            {blocks.map((b, i) =>
              b.t === "h" ? <h2 key={i}>{b.text}</h2>
              : b.t === "ul" ? <ul key={i}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
              : <p key={i}><Linkify text={b.text} /></p>
            )}
          </article>

          <footer className="hx-foot">
            <p data-testid="footer-license">© 2026 Cipher CTS. All Rights Reserved.</p>
          </footer>
        </main>

        <footer className={`${s.footer} ${s.glass} ${h.siteFoot}`}>
          <Logo size={40} />
          <span>© 2026 Cipher CTS. All Rights Reserved.</span>
        </footer>
      </div>
    </>
  );
}
