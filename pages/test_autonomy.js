// pages/test.js
// Cipher Autonomy Test UI — v5

import { useState } from "react";

export default function CipherAutonomyTest() {
  const [note, setNote] = useState(
    "Analyze the last 72 hours of work on Cipher. Identify our biggest strategic advantage and recommend the next three moves to maximize momentum."
  );
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState(null);
  const [version, setVersion] = useState(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState(null);

  async function handleRun() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/autonomy_v5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const data = await res.json();
      setRunId(data.runId || null);
      setVersion(data.version || "Cipher Autonomy v5");
      setReport(data.report || "");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="title">🧪 Cipher Autonomy Test</h1>
        <p className="subtitle">
          Type an optional note or context below, then click the button to
          trigger Cipher&apos;s autonomy / dream run. The output will be shown
          here.
        </p>

        <textarea
          className="noteBox"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
        />

        <button
          className="runButton"
          onClick={handleRun}
          disabled={loading}
        >
          {loading ? "Running..." : "🚀 Run Cipher Autonomy"}
        </button>

        <div className="console">
          <div className="metaLine">
            🔥 <span>Autonomy Run ID:</span>{" "}
            <span className="metaValue">
              {runId ? runId : "— (run not started yet)"}
            </span>
          </div>
          <div className="metaLine">
            🧬 <span>Version:</span>{" "}
            <span className="metaValue">
              {version ? version : "Cipher Autonomy v5"}
            </span>
          </div>

          {error && (
            <div className="error">
              ❗ Error: {error}
            </div>
          )}

          <div className="reportTitle">💭 Cipher Reflection:</div>
          <pre className="report">{report || "No output yet."}</pre>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f5f5ff;
          padding: 24px 12px;
          display: flex;
          justify-content: center;
        }

        .container {
          width: 100%;
          max-width: 640px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          padding: 24px 18px 28px;
        }

        .title {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 700;
          text-align: left;
        }

        .subtitle {
          margin: 0 0 16px;
          font-size: 14px;
          color: #444;
        }

        .noteBox {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #ddd;
          padding: 12px;
          font-size: 14px;
          resize: vertical;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          margin-bottom: 16px;
        }

        .runButton {
          width: 100%;
          border: none;
          border-radius: 999px;
          padding: 14px 16px;
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(90deg, #9b5cff, #e63fff);
          color: white;
          cursor: pointer;
          margin-bottom: 18px;
          box-shadow: 0 8px 22px rgba(123, 48, 255, 0.4);
        }

        .runButton:disabled {
          opacity: 0.7;
          cursor: default;
          box-shadow: none;
        }

        .console {
          background: #000000;
          color: #00ff7f;
          border-radius: 16px;
          padding: 14px 14px 16px;
          font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono",
            "Courier New", monospace;
          font-size: 13px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .metaLine {
          margin-bottom: 4px;
        }

        .metaLine span {
          font-weight: 500;
        }

        .metaValue {
          color: #7fffda;
        }

        .reportTitle {
          margin-top: 10px;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .report {
          margin: 0;
          max-height: 480px;
          overflow-y: auto;
        }

        .error {
          margin-top: 8px;
          margin-bottom: 6px;
          color: #ff6b6b;
        }

        @media (max-width: 600px) {
          .container {
            padding: 20px 14px 22px;
          }

          .title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
