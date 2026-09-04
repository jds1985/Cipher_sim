// pages/index.js
import Head from "next/head";
import { useState } from "react";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: "cipher_node_preorder" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout initialization failed. Please try again.");
      }
    } catch (err) {
      console.error("Stripe error:", err);
      alert("Error reaching checkout service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Cipher CTS — Sovereign Ternary Intelligence</title>
        <meta
          name="description"
          content="Decentralized 1.58-bit BitNet ternary AI substrate and sovereign hardware nodes."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          background: "#0a0a12",
          color: "#f4f4f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 20px",
          boxSizing: "border-box",
        }}
      >
        {/* Navigation */}
        <header
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "0.05em" }}>
            CIPHER <span style={{ color: "#3b82f6" }}>CTS</span>
          </div>
          <nav style={{ display: "flex", gap: "20px" }}>
            <a
              href="#features"
              style={{ color: "#a1a1aa", textDecoration: "none", fontSize: "0.95rem" }}
            >
              Architecture
            </a>
            <a
              href="#specs"
              style={{ color: "#a1a1aa", textDecoration: "none", fontSize: "0.95rem" }}
            >
              Nodes
            </a>
          </nav>
        </header>

        {/* Hero Section */}
        <section
          style={{
            maxWidth: "800px",
            width: "100%",
            margin: "60px auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "9999px",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              color: "#60a5fa",
              fontSize: "0.85rem",
              marginBottom: "24px",
            }}
          >
            1.58-Bit Sovereign Substrate
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: "20px",
            }}
          >
            Intelligence Beyond Cloud Dependency.
          </h1>

          <p
            style={{
              fontSize: "1.15rem",
              color: "#a1a1aa",
              lineHeight: 1.6,
              maxWidth: "640px",
              margin: "0 auto 36px auto",
            }}
          >
            Zero cloud telemetry. Local edge inference via quantized ternary weights, backed by
            peer-to-peer mesh coordination.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{
                padding: "14px 28px",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
              }}
            >
              {loading ? "Connecting..." : "Pre-Order Cipher Node"}
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section
          id="features"
          style={{
            maxWidth: "1000px",
            width: "100%",
            margin: "0 auto 60px auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          <FeatureCard
            title="Ternary Substrate"
            desc="Runs natively on 1.58-bit quantized weights, slashing thermal envelope and power consumption."
          />
          <FeatureCard
            title="Local Sovereign Runtime"
            desc="Models execute directly on bare-metal hardware. No third-party LLM APIs, no surveillance."
          />
          <FeatureCard
            title="Mesh Networking"
            desc="Decentralized peer-to-peer distribution fabric ensuring total operational continuity off-grid."
          />
        </section>

        {/* Footer */}
        <footer
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
            textAlign: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "24px",
            fontSize: "0.85rem",
            color: "#71717a",
          }}
        >
          <p>© {new Date().getFullYear()} Cipher Ternary Systems. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem", color: "#f4f4f5" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "#a1a1aa", lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}
