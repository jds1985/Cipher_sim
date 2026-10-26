// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
import Link from "next/link";
import { BUNDLE } from "../../lib/hlc/bundle";

export default function ReleaseCard() {
  return (
    <section className="hx-release" id="download" aria-labelledby="hx-dl-h" tabIndex={-1}>
      <div className="hx-release-in">
        <div className="hx-release-main">
          <p className="hx-edition" data-testid="release-edition">Evaluation &amp; Benchmarking Build (Personal &amp; Non-Commercial Use Only)</p>
          <h2 className="hx-h2" id="hx-dl-h">
            Deploy the Sovereign Edge Engine
          </h2>
          <p className="hx-sub">Your own predictive-maintenance engine, running entirely on your hardware.</p>
          <a className="hx-btn hx-btn-primary" href={BUNDLE.url} download data-testid="download-btn">
            <span aria-hidden="true">⬇</span> Download HLC Edge Engine v2 (.ZIP)
          </a>
          <p className="hx-meta" data-testid="release-meta">
            Proprietary Evaluation License • Offline Python/FastAPI Runner • Mac, Linux, &amp; Edge ARM/x86 compatible.
          </p>
          <p className="hx-file">
            {BUNDLE.fileName} · {BUNDLE.sizeHuman}
          </p>
          <details className="hx-verify">
            <summary>Verify your download (SHA-256)</summary>
            <code className="hx-sha" data-testid="bundle-sha">
              {BUNDLE.sha256}
            </code>
          </details>
          <p className="hx-license" data-testid="release-license">
            © 2026 Cipher CTS. All Rights Reserved. This free download is licensed for personal, non-commercial evaluation and benchmarking only.{" "}
            <strong>Production, industrial fleet, or revenue-generating use requires a paid commercial license from Cipher CTS.</strong> The LICENSE, NOTICE and THIRD_PARTY_NOTICES files are in the zip.
            NASA C-MAPSS data is not included and has its own terms.{" "}
            <Link href="/hlc/license" data-testid="license-link-card">Read the full license</Link>.
          </p>
        </div>
        <div>
          <h3 className="hx-h3">Quick start</h3>
          <ol className="hx-steps">
            <li>
              <strong>Check Python.</strong> You need <code>python3</code> 3.9 or newer. The first run needs internet once, to fetch the CPU build of PyTorch.
            </li>
            <li>
              <strong>Unzip and run.</strong> In a terminal inside the <code>hlc_edge_engine</code> folder: <code>bash run_engine.sh</code>
            </li>
            <li>
              <strong>Keep this page open.</strong> The status above turns <strong>ENGINE ONLINE</strong> and the simulations use your engine.
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
