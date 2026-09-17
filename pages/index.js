import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  const products = [
    {
      id: "concierge",
      title: "Cipher Concierge",
      category: "Hospitality & Enterprise",
      status: "Available Now",
      desc: "Zero-hardware, ephemeral AI guest intelligence. Delivers instant 24/7 service via in-room QR access with 100% RAM isolation.",
      href: "/concierge",
      cta: "Explore Concierge",
    },
    {
      id: "enterprise",
      title: "Cipher Private Core",
      category: "Custom Intelligence",
      status: "In Development",
      desc: "Ultra-compact sub-watt proprietary language models deployed locally on-premise. Total sovereignty with zero third-party cloud leaks.",
      href: "#",
      cta: "Architecture Overview",
    },
    {
      id: "edge",
      title: "Cipher Edge Node",
      category: "Embedded Silicon",
      status: "Roadmap",
      desc: "Stateless micro-appliances engineered for extreme efficiency and local inferencing without costly server racks.",
      href: "#",
      cta: "Learn More",
    },
  ];

  return (
    <>
      <Head>
        <title>Cipher CTS | Private AI Systems</title>
        <meta
          name="description"
          content="Cipher CTS designs sovereign, ultra-efficient, local-first artificial intelligence systems built for total privacy and zero data extraction."
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
          src="/images/cipher-cts-bg.png"
          alt="Cipher CTS Watermark"
          className="watermark-img"
        />
      </div>

      <div className="layout">
        {/* Navigation - Clean 3 links, no top-right button */}
        <header className="navbar glass-panel">
          <div className="brand">
            <Link href="/" className="brand-link">
              <img
                src="/images/cipher-cts-logo.png"
                alt="Cipher CTS Logo"
                className="brand-logo"
              />
              <span className="brand-text">CIPHER CTS</span>
            </Link>
          </div>

          <nav className="nav-links">
            <Link href="/" className="nav-item active">
              Home
            </Link>
            <Link href="/mission" className="nav-item">
              Mission
            </Link>
            <Link href="/concierge" className="nav-item">
              Solutions
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="pill-badge glass-pill">
            <span className="pulse-dot" />
            Next-Gen Private Intelligence
          </div>

          <h1 className="hero-title">
            Intelligent Systems. <br />
            <span className="gradient-text">Zero Data Extraction.</span>
          </h1>

          <p className="hero-description">
            Cipher CTS engineers sovereign AI architectures built from the
            ground up for privacy, extreme hardware efficiency, and complete
            operational autonomy.
          </p>

          <div className="hero-buttons">
            <Link href="/concierge" className="btn btn-primary">
              View Solutions
            </Link>
            <Link href="/mission" className="btn btn-glass">
              Our Mission
            </Link>
          </div>
        </section>

        {/* Product Carousel / Showcase */}
        <section id="products" className="section-container">
          <div className="section-header">
            <span className="sub-tag">PORTFOLIO</span>
            <h2>Current & Developing Solutions</h2>
            <p>Purpose-built intelligence applications that respect your data boundary.</p>
          </div>

          <div className="carousel glass-panel">
            <div className="carousel-meta">
              <span className="category">{products[activeSlide].category}</span>
              <span className="status-badge">{products[activeSlide].status}</span>
            </div>

            <div className="carousel-body">
              <h3>{products[activeSlide].title}</h3>
              <p>{products[activeSlide].desc}</p>
            </div>

            <div className="carousel-footer">
              <Link href={products[activeSlide].href} className="btn-action">
                {products[activeSlide].cta} →
              </Link>

              <div className="dots">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`dot ${activeSlide === index ? "active" : ""}`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Company Principles */}
        <section id="about" className="section-container">
          <div className="section-header">
            <span className="sub-tag">PHILOSOPHY</span>
            <h2>Why Cipher CTS</h2>
          </div>

          <div className="grid-pillars">
            <div className="pillar-card glass-panel">
              <div className="pillar-icon">🔒</div>
              <h4>Complete Data Sovereignty</h4>
              <p>
                We reject the surveillance data-pipeline. Our systems run
                statelessly with zero cloud retention, logging, or dataset
                harvesting.
              </p>
            </div>

            <div className="pillar-card glass-panel">
              <div className="pillar-icon">⚡</div>
              <h4>Extreme Computational Efficiency</h4>
              <p>
                Instead of requiring bloated server clusters, our models operate
                within lean footprints, reducing cost and energy consumption.
              </p>
            </div>

            <div className="pillar-card glass-panel">
              <div className="pillar-icon">📦</div>
              <h4>Zero-Friction Deployment</h4>
              <p>
                Practical business utility delivered without invasive hardware
                retrofits or months of complex onboarding cycles.
              </p>
            </div>
          </div>
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

        h1, h2, h3, h4, .brand-text, .btn, .btn-action, .sub-tag {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 700;
        }

        /* Ambient Glow Backdrop */
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
          padding: 14px 28px;
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
          gap: 28px;
        }

        .nav-item {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-item:hover,
        .nav-item.active {
          color: #ffffff;
        }

        .nav-item.active {
          border-bottom: 2px solid #00ffd5;
          padding-bottom: 2px;
        }

        /* Hero */
        .hero-section {
          text-align: center;
          padding: 30px 10px 75px 10px;
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
          font-size: 46px;
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
          font-size: 16.5px;
          color: #94a3b8;
          max-width: 600px;
          margin: 0 auto 34px auto;
          line-height: 1.65;
        }

        .hero-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
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

        .btn-glass {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
        }

        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* Sections */
        .section-container {
          margin-bottom: 75px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .sub-tag {
          font-size: 10px;
          letter-spacing: 2px;
          color: #00ffd5;
          text-transform: uppercase;
        }

        .section-header h2 {
          font-size: 26px;
          color: #ffffff;
          margin: 6px 0;
        }

        .section-header p {
          font-size: 14px;
          color: #64748b;
        }

        /* Carousel Glass Panel */
        .carousel {
          padding: 36px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .carousel-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
        }

        .status-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 8px;
          background: rgba(0, 255, 213, 0.08);
          color: #00ffd5;
          border: 1px solid rgba(0, 255, 213, 0.2);
        }

        .carousel-body h3 {
          font-size: 24px;
          color: #ffffff;
          margin-bottom: 10px;
        }

        .carousel-body p {
          font-size: 14.5px;
          color: #94a3b8;
          max-width: 650px;
          line-height: 1.6;
        }

        .carousel-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .btn-action {
          color: #00ffd5;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .btn-action:hover {
          transform: translateX(4px);
        }

        .dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.2s;
        }

        .dot.active {
          width: 22px;
          border-radius: 10px;
          background: #00ffd5;
        }

        /* Pillars Grid */
        .grid-pillars {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .pillar-card {
          padding: 26px;
        }

        .pillar-icon {
          font-size: 20px;
          margin-bottom: 12px;
        }

        .pillar-card h4 {
          font-size: 15px;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .pillar-card p {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.6;
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
            gap: 16px;
          }
          .nav-item {
            font-size: 13px;
          }
          .hero-title {
            font-size: 32px;
          }
          .hero-buttons {
            flex-direction: column;
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
