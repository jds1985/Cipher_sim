// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { BUNDLE } from "../../lib/hlc/bundle";

export default function DownloadCard() {
  return (
    <section className="card hero" id="download" aria-labelledby="dl-h">
      <div className="hero-grid">
        <div>
          <h2 id="dl-h">Download the engine</h2>
          <p style={{ fontSize: "1.3rem", fontWeight: 800, overflowWrap: "anywhere" }}>📦 {BUNDLE.fileName}</p>
          <p>
            Size: <strong data-testid="bundle-size">{BUNDLE.sizeHuman}</strong>
          </p>
          <p className="muted hash">
            SHA-256: <code data-testid="bundle-sha">{BUNDLE.sha256}</code>
          </p>
          <p className="muted">{BUNDLE.title}</p>
          <p className="muted" data-testid="license-note">
            © 2026 Cipher CTS. The engine code and trained weights are licensed <strong>Apache-2.0</strong> (
            <code>LICENSE</code> and <code>NOTICE</code> are in the zip). The NASA C-MAPSS data is <strong>not</strong>{" "}
            included and has its own terms and citation.
          </p>
          <a className="btn" href={BUNDLE.url} download data-testid="download-link">
            ⬇ Download {BUNDLE.fileName}
          </a>
        </div>
        <div>
          <h3>Quick start (about 5 minutes the first time)</h3>
          <ol>
            <li>
              <strong>Prerequisites:</strong> Linux, macOS or WSL with <code>python3</code> 3.9 or newer (with{" "}
              <code>venv</code>), about 1 GB of free disk space, and an internet connection for the first run only (it
              downloads CPU-only PyTorch, several hundred MB).
            </li>
            <li>
              Unzip it, open a terminal in the <code>hlc_edge_engine</code> folder, and run: <code>bash run_engine.sh</code>{" "}
              (it prints <strong>ENGINE IS READY</strong>).
            </li>
            <li>
              Open <a href="http://localhost:8000">http://localhost:8000</a> (the engine’s own page; its health check is at{" "}
              <a href="http://localhost:8000/health">/health</a>). Keep this page open: the box at the top turns{" "}
              <strong>ONLINE</strong> by itself.
            </li>
          </ol>
          <p className="muted" data-testid="permission-note">
            <strong>Heads-up:</strong> your browser may ask for permission to let this website reach a program on your own
            computer (“look for and connect to other apps and devices on your local network”). Choose{" "}
            <strong>Allow</strong>. The engine runs only on your computer; nothing you test here is sent to our servers.
          </p>
        </div>
      </div>
    </section>
  );
}
