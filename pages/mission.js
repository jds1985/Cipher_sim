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

      {/* Layer 1: Master Dual-Radial Ambient Canvas */}
      <div className="bg-canvas" />

      {/* Layer 2: Faded Real-Logo Watermark */}
      <div className="bg-watermark">
        <img
          src="/logo.png"
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
                src="/logo.png"
                alt="Cipher CTS Logo"
                className="brand-logo"
              />
              <span className="brand-text">CIPHER CTS</span>
            </Link>
          </div>

          <nav className="nav-links">
            <Link href="/" className="nav-item">
              Home
            </Link>
            <Link href="/mission" className="nav-item active">
              Mission
            </Link>
            <Link href="/#products" className="nav-item">
              Solutions
            </Link>
          </nav>

          <div className="nav-action">
            <Link href="/concierge" className="btn-nav-highlight">
              Concierge AI
            </Link>
          </div>
        </header>

        {/* Page Hero */}
        <section className="hero-section">
          <div className="pill-badge glass-pill">
            <span className="pulse-dot" />
            The Architectural Thesis
          </div>

          <h1 className="hero-title">
            Reclaiming Intelligence <br />
            <span className="gradient-text">From the Centralized Cloud.</span>
          </h1>

          <p className="hero-description">
            Modern AI was built on a compromise: surrender your operational privacy and run on massive remote data centers, or get left behind. We reject that trade-off.
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
          color: rgba(255, 255, 255, 0.94);
          background-color: #05060a;
          line-height: 1.6;
          overflow-x: hidden;
        }

        h1, h2, h3, h4, .brand-text, .btn, .sub-tag, .btn-nav-highlight {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 700;
        }

        /* Master Ambient Glow Backdrop */
        .bg-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 15% 10%, rgba(90, 70, 255, 0.35), transparent 40%),
            radial-gradient(circle at 85% 90%, rgba(0, 255, 200, 0.25), transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03), transparent 60%),
            #05060a;
          z-index: -2;
        }

        /* Faded Real-Logo Watermark */
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
          opacity: 0.08;
          filter: drop-shadow(0 0 50px rgba(0, 255, 200, 0.3));
        }

        .watermark-img {
          width: 75%;
          max-width: 520px;
          object-fit: contain;
        }

        .layout {
          max-width: 860px;
          margin: 0 auto;
          padding: 24px 20px 60px 20px;
          position: relative;
          z-index: 1;
        }

        /* High-Saturation Glass Panels */
        .glass-panel {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(28px) saturate(140%);
          -webkit-backdrop-filter: blur(28px) saturate(140%);
          border-radius: 22px;
          box-shadow: 
            0 0 100px rgba(0, 255, 200, 0.08),
            0 0 50px rgba(90, 70, 255, 0.15),
            inset 0 0 40px rgba(255, 255, 255, 0.04);
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
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 8px;
        }

        .brand-text {
          font-size: 14px;
          letter-spacing: 2px;
          color: #ffffff;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-item {
          color: #94a3b8;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-item:hover,
        .nav-item.active {
          color: #ffffff;
        }

        .nav-item.active {
          border-bottom: 1px solid #00ffd5;
          padding-bottom: 2px;
        }

        .btn-nav-highlight {
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          background: linear-gradient(135deg, #5a46ff, #00ffd5);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 8px 16px;
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(90, 70, 255, 0.4), 0 0 35px rgba(0, 255, 213, 0.2);
          transition: all 0.2s;
          display: inline-block;
        }

        .btn-nav-highlight:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(90, 70, 255, 0.6), 0 0 50px rgba(0, 255, 213, 0.35);
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
          background: rgba(0, 255, 213, 0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 255, 213, 0.25);
          color: #00ffd5;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00ffd5;
          box-shadow: 0 0 10px #00ffd5;
        }

        .hero-title {
          font-size: 42px;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 20px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #00ffd5 0%, #a5f3fc 80%);
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

        /* Manifesto Cards */
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
          color: #00ffd5;
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
          background: linear-gradient(135deg, #5a46ff, #00ffd5);
          color: #ffffff;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 0 30px rgba(90, 70, 255, 0.5), 0 0 50px rgba(0, 255, 213, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 45px rgba(90, 70, 255, 0.7), 0 0 70px rgba(0, 255, 213, 0.35);
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
          color: #00ffd5;
        }

        .footer-right {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .nav-links {
            gap: 14px;
          }
          .nav-item {
            font-size: 12px;
          }
          .btn-nav-highlight {
            padding: 6px 12px;
            font-size: 12px;
          }
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
