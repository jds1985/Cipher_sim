import Head from "next/head";
import Script from "next/script";

export default function TestAutonomy() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <Head>
        <title>Cipher Autonomy Test</title>
      </Head>

      <h1>🧪 Cipher Autonomy Test</h1>
      <p>Run the v8 autonomy engine below.</p>

      <div style={{ marginBottom: "20px" }}>
        <button id="run-autonomy"
          style={{
            background: "#7a00ff",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            fontSize: "18px",
          }}
        >
          🚀 Run Cipher Autonomy
        </button>
      </div>

      <div>
        <p><strong>Run ID:</strong> <span id="run-id"></span></p>
        <p><strong>Version:</strong> <span id="version"></span></p>
      </div>

      <div id="autonomy-output" style={{
        background: "black",
        color: "#00ff00",
        padding: "15px",
        borderRadius: "8px",
        minHeight: "200px",
        whiteSpace: "pre-wrap"
      }}></div>

      <Script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" />
      <Script src="/test.js" />
    </div>
  );
}
