// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { Space_Grotesk } from "next/font/google";
import Logo from "../components/Logo";
import ConnectionBar from "../components/hlc/ConnectionBar";
import ScenarioPanel from "../components/hlc/ScenarioPanel";
import TelemetryPreview from "../components/hlc/TelemetryPreview";
import ResultCards from "../components/hlc/ResultCards";
import LatencyRow from "../components/hlc/LatencyRow";
import DownloadCard from "../components/hlc/DownloadCard";
import DatasetPicker from "../components/hlc/DatasetPicker";
import AboutSection from "../components/hlc/AboutSection";
import { EngineError, ENGINE_URL, fetchHealth, predict } from "../lib/hlc/engine";
import {
  applyDropout,
  DEFAULT_DATASET,
  V1_DATASET,
  V2_DATASET,
  DROPOUT_PLAN,
  PRESET_SETS,
  presetMatrix,
} from "../lib/hlc/telemetry";
import s from "../styles/Home.module.css";
import h from "../styles/Hlc.module.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const SITE = "https://ciphercts.com";
const POLL_MS = 10_000;

// Same links as the home page, but as absolute paths because we are not on "/".
const links = [["Products", "/#products"], ["Technology", "/#technology"], ["Privacy", "/#privacy"], ["About", "/#about"]];

const KIND_LABEL = {
  nominal: "Nominal telemetry (unit 1, first 30 cycles)",
  stress: "Degrading telemetry (unit 1, last 30 cycles)",
  dropout: "Sensor dropout simulation",
  custom: "Your own custom JSON",
};

function labelFor(kind, ds) {
  if (kind === "custom" || !ds) return KIND_LABEL[kind];
  return `${KIND_LABEL[kind]} — ${PRESET_SETS[ds].synthetic ? "SYNTHETIC" : "NASA FD001"}${PRESET_SETS[ds].forEngine === "v2" ? " (v2 scaling)" : ""}`;
}

export default function HlcPage() {
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState({ state: "checking", lastChecked: null });
  const [loaded, setLoaded] = useState(null);
  // The last non-dropout scenario, used as the base for "Simulate Sensor Dropout".
  const baseRef = useRef(null);
  const [dataset, setDataset] = useState(DEFAULT_DATASET);
  const userPickedDataset = useRef(false); // once the visitor picks a data set by hand we stop auto-selecting
  const [pred, setPred] = useState({ state: "idle" });
  const [latency, setLatency] = useState(null);
  const reqId = useRef(0);

  // ---- health polling (browser only: runs in useEffect, never on the server) ----
  const checkHealth = useCallback(async () => {
    try {
      const data = await fetchHealth();
      // match the connected engine's scaling unless the visitor picked a data set by hand
      if (!userPickedDataset.current) setDataset(data.weights === "nasa_v2" ? V2_DATASET : V1_DATASET);
      setHealth({ state: "online", data, lastChecked: new Date() });
    } catch (e) {
      const msg = e instanceof EngineError ? e.message : String(e);
      setHealth({ state: "offline", error: msg, lastChecked: new Date() });
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
    setPred({ state: "loading" });
    try {
      const r = await predict(m);
      if (id !== reqId.current) return;
      setPred({ state: "done", data: r.data, latencyMs: r.latencyMs });
      setLatency(r.latencyMs);
    } catch (e) {
      if (id !== reqId.current) return;
      setPred({ state: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const onLoad = useCallback(
    (kind, custom) => {
      let next;
      if (kind === "nominal" || kind === "stress") {
        const matrix = presetMatrix(dataset, kind);
        baseRef.current = { kind, dataset, matrix };
        next = { kind, dataset, matrix, dropped: [] };
      } else if (kind === "custom" && custom) {
        baseRef.current = { kind, dataset: null, matrix: custom };
        next = { kind, dataset: null, matrix: custom, dropped: [] };
      } else {
        const base = baseRef.current ?? { kind: "nominal", dataset, matrix: presetMatrix(dataset, "nominal") };
        next = {
          kind: "dropout",
          dataset: base.dataset,
          matrix: applyDropout(base.matrix),
          dropped: DROPOUT_PLAN.map((d) => ({ channel: d.channel, kind: d.kind })),
          note: `Applied to: ${labelFor(base.kind, base.dataset)}`,
        };
      }
      setLoaded(next);
      void runPredict(next.matrix);
    },
    [runPredict, dataset],
  );

  const title = "HLC — Hierarchical Latent Controller | Cipher CTS";
  const desc =
    "HLC: local predictive maintenance. Try the live dashboard and download the engine that runs on your own computer. Apache-2.0, Cipher CTS.";

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

        <a className={h.skip} href="#dashboard">Skip to the dashboard</a>

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

        <main className={`${h.hlc} ${h.dash}`}>
          <header className={h.heroHead}>
            <span className={`${s.kicker} ${h.kickerBig}`}>HLC · Cipher CTS</span>
            <h1 className={h.title}>HLC — Hierarchical Latent Controller: local predictive maintenance</h1>
            <p className={h.lead}>
              A 7-Tier Hierarchical Latent Controller that estimates how many operating cycles of life a machine has left
              from 30 time steps of 21 sensor channels. It runs on <strong>your own computer</strong>: no cloud, no
              account, and nothing you test here leaves your machine.
            </p>
            <div className="btn-row">
              <a className="btn" href="#dashboard">▶ Try the live dashboard</a>
              <a className="btn secondary" href="#download">⬇ Download the engine</a>
              <a className="btn secondary" href="#about">ℹ How accurate is it?</a>
            </div>
          </header>

          <ConnectionBar health={health} onRecheck={checkHealth} />

          <section className="card" id="dashboard" aria-labelledby="scen-h" tabIndex={-1}>
            <h2 id="scen-h">Try a scenario</h2>
            <DatasetPicker
              value={dataset}
              onChange={(v) => {
                userPickedDataset.current = true;
                setDataset(v);
              }}
              engineWeights={health.state === "online" ? (health.data.weights ?? "v1") : null}
            />
            <ScenarioPanel selected={loaded?.kind ?? null} onLoad={onLoad} busy={pred.state === "loading"} />
          </section>

          {loaded && (
            <section className="card" aria-labelledby="prev-h">
              <h2 id="prev-h">Telemetry preview — {labelFor(loaded.kind, loaded.dataset)}</h2>
              {loaded.note && <p className="muted">{loaded.note}</p>}
              <TelemetryPreview matrix={loaded.matrix} dropped={loaded.dropped} />
            </section>
          )}

          <ResultCards p={pred} onRetry={() => loaded && runPredict(loaded.matrix)} />

          <LatencyRow latencyMs={latency} />

          <DownloadCard />

          <div id="about"><AboutSection /></div>

          <footer className={h.pageFoot}>
            <p className="small-print">
              This dashboard talks only to <code>{ENGINE_URL}</code> on your own computer (plus this website for the
              download). The predictions are only as good as the engine behind them.
            </p>
            <p className="small-print" data-testid="footer-license">
              © 2026 Cipher CTS. Licensed under the <strong>Apache License 2.0</strong> (engine code, trained weights and
              this dashboard). The NASA C-MAPSS data is not included and has its own terms and citation.
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
