import Head from "next/head";
import Link from "next/link";

export default function Mission() {
  return (
    <>
      <Head>
        <title>Mission & Architecture | Cipher CTS</title>
        <meta
          name="description"
          content="The architectural thesis of Cipher CTS: Sovereign, energy-efficient, local-first intelligence free from surveillance data extraction."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Layer 1: Ambient Backdrop */}
      <div className="bg-canvas" />

      {/* Layer 2: Faded Logo Watermark */}
      <div className="bg-watermark">
        <img
          src="/images/hero-network.png"
          alt="Cipher CTS Watermark"
          className="watermark-img"
        />
      </div>

      <div className="layout">
        {/* Navigation */}
        <header className="navbar glass-panel">
          <div className="brand">
            <Link href="/" className="brand-link">
              <img
                src="/images/hero-network.png"
                alt="Cipher CTS Logo"
                className="brand-logo"
              />
              <span className="brand-text">CIPHER CTS</span>
            </Link>
          </div>
          <nav className="nav-links">
            <Link href="/" className="nav-item">
              Overview
            </Link>
            <Link href="/mission" className="nav-item active">
              Mission
            </Link>
            <Link href="/concierge" className="nav-item highlight">
              Concierge AI
            </Link>
          </nav>
        </header>

        {/* Page Hero */}
        <section className="hero-section">
          <div className="pill-badge glass-pill">
            <span className="pulse-dot" />
            The Architectural Thesis
          </div>

          <h1 className="hero-title">
            Reclaiming Intelligence <br />
            <span className="gradient-text">From the Cloud Monopolies.</span>
          </h1>

          <p className="hero-description">
            Modern AI was built on a compromise: surrender your operational privacy and run on massive centralized data centers, or get left behind. We reject that trade-off.
          </p>
        </section>

        {/* Core Pillars */}
        <section className="content-section">
          <div className="manifesto-card glass-panel">
            <span className="sub-tag">01 / SOVEREIGNTY FIRST</span>
            <h2>Inference Without Surveillance</h2>
            <p>
              When every prompt, guest interaction, and corporate query is routed through hyperscaler APIs, your business data is mined to enrich someone else&apos;s models. 
            </p>
            <p>
              Cipher CTS develops architectures where inference executes entirely within isolated boundaries. No persistent telemetry, no training on user interactions, and complete RAM isolation. When a session ends, the data dissolves completely.
            </p>
          </div>

          <div className="manifesto-card glass-panel">
            <span className="sub-tag">02 / EFFICIENCY BY DESIGN</span>
            <h2>Rethinking the Silicon Footprint</h2>
            <p>
              Brute-forcing intelligence through trillion-parameter models running on massive server farms is environmentally unsustainable and economically impractical for everyday business.
            </p>
            <p>
              By focusing on ultra-lean, compressed architectures and high-density logic, we drastically lower memory overhead and power consumption. The goal is simple: deliver high-utility reasoning on accessible silicon without the massive infrastructure bills.
            </p>
          </div>

          <div className="manifesto-card glass-panel">
            <span className="sub-tag">03 / PRACTICAL UTILITY</span>
            <h2>Software That Solves Real Problems Today</h2>
            <p>
              AI should not exist as a speculative lab demo or an expensive parlor trick. It must deliver immediate, measurable operational value.
            </p>
            <p>
              From eliminating late-night front-desk strain for independent boutique hotels to on-premise workflow assistants, we focus on turnkey deployments that require zero client hardware investment and start working on day one.
            </p>
          </div>
        </section>

        {/* Bottom CTA Block */}
        <section className="cta-box glass-panel">
          <h3>Explore Our Practical Deployments</h3>
          <p>See our private, zero-hardware digital concierge in action.</p>
          <Link href="/concierge" className="btn btn-primary">
            View Cipher Concierge →
          </Link>
        </section>

        {/* Footer */}
        <footer className="footer glass-panel">
          <div className="footer-left">
            <span className="brand-symbol">◈</span> CIPHER TERNARY SYSTEMS
          </div>
          <div className="footer-right">
            <span>Knoxville, TN</span>
            <span>•</span>
            <span>Private AI Engineering</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", sans-serif;
          color: #e2e8f0;
          background-color: #030408;
          line-height: 1.6;
          overflow-x: hidden;
        }

        h1, h2, h3, h4, .brand-text, .btn, .sub-tag {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 700;
        }

        .bg-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.1) 0%, transparent 55%),
            radial-gradient(circle at 85% 40%, rgba(139, 92, 246, 0.07) 0%, transparent 45%),
            #030408;
          z-index: -2;
        }

        .bg-watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          max-width: 900px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: -1;
          opacity: 0.06;
          filter: blur(1px) grayscale(30%);
        }

        .watermark-img {
          width: 85%;
          max-width: 600px;
          object-fit: contain;
        }

        .layout {
          max-width: 860px;
          margin: 0 auto;
          padding: 24px 20px 60px 20px;
          position: relative;
          z-index: 1;
        }

        /* Glass Panel Styling */
        .glass-panel {
          background: rgba(10, 15, 29, 0.55);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 22px;
          box-shadow: 
            0 20px 40px -15px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        /* Navbar */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          margin-bottom: 55px;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brand-logo {
          width: 28px;
          height: 28px;
          object-fit: contain;
          border-radius: 6px;
        }

        .brand-text {
          font-size: 14px;
          letter-spacing: 2px;
          color: #ffffff;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-item {
          color: #94a3b8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-item:hover, .nav-item.active {
          color: #ffffff;
        }

        .nav-item.highlight {
          color: #22d3ee;
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.3);
          padding: 6px 14px;
          border-radius: 12px;
        }

        /* Hero */
        .hero-section {
          text-align: center;
          padding: 30px 10px 60px 10px;
        }

        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 22px;
        }

        .glass-pill {
          background: rgba(34, 211, 238, 0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.25);
          color: #22d3ee;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 10px #22d3ee;
        }

        .hero-title {
          font-size: 42px;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 20px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #22d3ee 0%, #a5f3fc 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          font-size: 16px;
          color: #94a3b8;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* Content Manifesto Cards */
        .content-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 60px;
        }

        .manifesto-card {
          padding: 36px;
        }

        .sub-tag {
          font-size: 11px;
          letter-spacing: 2px;
          color: #22d3ee;
          display: block;
          margin-bottom: 8px;
        }

        .manifesto-card h2 {
          font-size: 22px;
          color: #ffffff;
          margin-bottom: 14px;
        }

        .manifesto-card p {
          font-size: 14.5px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 12px;
        }

        .manifesto-card p:last-child {
          margin-bottom: 0;
        }

        /* CTA Box */
        .cta-box {
          text-align: center;
          padding: 40px 24px;
          margin-bottom: 60px;
        }

        .cta-box h3 {
          font-size: 20px;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .cta-box p {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 22px;
        }

        .btn {
          padding: 13px 26px;
          border-radius: 12px;
          font-size: 13.5px;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .btn-primary {
          background: #22d3ee;
          color: #040812;
          font-weight: 700;
          box-shadow: 0 10px 25px -5px rgba(34, 211, 238, 0.4);
        }

        .btn-primary:hover {
          background: #67e8f9;
          transform: translateY(-1px);
        }

        /* Footer */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 26px;
          font-size: 12px;
          color: #64748b;
        }

        .brand-symbol {
          color: #22d3ee;
        }

        .footer-right {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 30px;
          }
          .manifesto-card {
            padding: 24px;
          }
          .footer {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
