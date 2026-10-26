// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { Space_Grotesk } from "next/font/google";
import Logo from "../components/Logo";
import Console from "../components/hlc/Console";
import Metrics from "../components/hlc/Metrics";
import ReleaseCard from "../components/hlc/ReleaseCard";
import License from "../components/hlc/License";
import Advanced from "../components/hlc/Advanced";
import { EngineError, fetchHealth, predict } from "../lib/hlc/engine";
import { applyDropout, DEFAULT_DATASET, V1_DATASET, V2_DATASET, presetMatrix } from "../lib/hlc/telemetry";
import s from "../styles/Home.module.css";
import h from "../styles/Hlc.module.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const SITE = "https://ciphercts.com";
const POLL_MS = 10_000;

// Same links as the home page, but as absolute paths because we are not on "/".
const links = [["Products", "/#products"], ["Technology", "/#technology"], ["Privacy", "/#privacy"], ["About", "/#about"]];

export default function HlcPage() {
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState({ state: "checking", lastChecked: null });
  const [selected, setSelected] = useState(null); // "nominal" | "stress" | "dropout" | "custom" | null
  const baseRef = useRef(null); // last preset matrix, used by the dropout test
  const lastRef = useRef(null); // last matrix sent to the engine, used by "Try again"
  const dataset = useRef(DEFAULT_DATASET); // preset scaling that matches the connected engine (v2 unless a v1 engine answers)
  const [pred, setPred] = useState({ state: "idle" });
  const [latency, setLatency] = useState(null); // real measured round trip in ms, or null
  const reqId = useRef(0);

  // ---- health polling (browser only: runs in useEffect, never on the server) ----
  const checkHealth = useCallback(async () => {
    try {
      const data = await fetchHealth();
      dataset.current = data.weights === "nasa_v2" ? V2_DATASET : V1_DATASET;
      setHealth({ state: "online", data, lastChecked: new Date() });
    } catch (e) {
      const msg = e instanceof EngineError ? e.message : String(e);
      setHealth({ state: "offline", error: msg, lastChecked: new Date() });
      setLatency(null);
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer;
    const loop = async () => {
      await checkHealth();
      if (!stopped) timer = setTimeout(loop, POLL_MS);
    };
    loop();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [checkHealth]);

  // ---- prediction ----
  const runPredict = useCallback(async (m) => {
    const id = ++reqId.current;
    lastRef.current = m;
    setPred({ state: "loading" });
    try {
      const r = await predict(m);
      if (id !== reqId.current) return;
      setPred({ state: "done", data: r.data, latencyMs: r.latencyMs });
      setLatency(r.latencyMs);
    } catch (e) {
      if (id !== reqId.current) return;
      setLatency(null);
      setPred({ state: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const onRun = useCallback(
    (kind) => {
      const matrix = presetMatrix(dataset.current, kind);
      baseRef.current = matrix;
      setSelected(kind);
      void runPredict(matrix);
    },
    [runPredict],
  );
  const onDropout = useCallback(() => {
    const base = baseRef.current ?? presetMatrix(dataset.current, "nominal");
    setSelected("dropout");
    void runPredict(applyDropout(base));
  }, [runPredict]);
  const onCustom = useCallback(
    (m) => {
      setSelected("custom");
      void runPredict(m);
    },
    [runPredict],
  );

  const title = "HLC — Hierarchical Latent Controller | Cipher CTS";
  const desc =
    "HLC: local predictive maintenance. Run a live simulation and download the engine that runs on your own computer. Apache-2.0, Cipher CTS.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${SITE}/hlc`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cipher CTS" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={`${SITE}/hlc`} />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={`${SITE}/og-image.png`} />
      </Head>

      <div className={`${s.page} ${font.className} ${h.solidBrand}`}>
        <div className={`${s.bg} ${h.bgDim}`} aria-hidden="true"><span className={s.orbA} /><span className={s.orbB} /><span className={s.orbC} /><span className={s.orbD} /></div>

        <a className={h.skip} href="#demo">Skip to the live demo</a>

        <header className={`${s.navWrap} ${h.navBig}`}>
          <nav className={`${s.nav} ${s.glass}`} aria-label="Main">
            <a href="/" className={s.brand} aria-label="Cipher CTS home"><Logo size={40} /></a>
            <div className={`${s.links} ${open ? s.linksOpen : ""}`}>
              {links.map(([l, href]) => <a key={l} href={href} onClick={() => setOpen(false)}>{l}</a>)}
              <a href="/hlc" aria-current="page" className={h.navCurrent} onClick={() => setOpen(false)}>HLC</a>
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
            <h1 className="hx-title">HLC — Hierarchical Latent Controller: local predictive maintenance</h1>
            <p className="hx-lead">
              Know how many operating cycles of life a machine has left. HLC runs on <strong>your own hardware</strong>: no cloud, no account, nothing leaves your machine.
            </p>
            <div className="hx-cta">
              <a className="hx-btn hx-btn-primary" href="#demo">▶ Run the live demo</a>
              <a className="hx-btn hx-btn-ghost" href="#download">⬇ Get the engine</a>
            </div>
          </header>

          <Console health={health} pred={pred} latencyMs={latency} selected={selected} onRun={onRun} onRecheck={checkHealth} onRetry={() => lastRef.current && runPredict(lastRef.current)} />

          <Metrics />

          <div className="hx-pair">
            <ReleaseCard />
            <License />
          </div>

          <Advanced busy={pred.state === "loading"} onDropout={onDropout} onCustom={onCustom} />

          <footer className="hx-foot">
            <p data-testid="footer-license">
              © 2026 Cipher CTS. Licensed under the <strong>Apache License 2.0</strong> (engine code, trained weights and this page). The NASA C-MAPSS data is not included and has its own terms and citation.
            </p>
          </footer>
        </main>

        <footer className={`${s.footer} ${s.glass} ${h.siteFoot}`}>
          <Logo size={40} />
          <span>© 2026 Cipher CTS</span>
        </footer>
      </div>
    </>
  );
}
