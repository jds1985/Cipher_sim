import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function Solutions() {
  const [formData, setFormData] = useState({
    name: "",
    orgName: "",
    productInterest: "Cipher Concierge (Hospitality)",
    email: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Head>
        <title>Solutions & Deployments | Cipher CTS</title>
        <meta
          name="description"
          content="Sovereign AI products built by Cipher CTS: Private Digital Concierge for hotels, custom local-first models, and stateless edge compute."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Layer 1: Master Ambient Canvas */}
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
            <Link href="/mission" className="nav-item">
              Mission
            </Link>
            <Link href="/solutions" className="nav-item active">
              Solutions
            </Link>
          </nav>
        </header>

        {/* Page Hero */}
        <section className="hero-section">
          <div className="pill-badge glass-pill">
            <span className="pulse-dot" />
            Product Portfolio
          </div>

          <h1 className="hero-title">
            Purpose-Built Deployments. <br />
            <span className="gradient-text">Zero Data Leakage.</span>
          </h1>

          <p className="hero-description">
            Explore our specialized systems engineered for client-side privacy, operational simplicity, and high-efficiency compute.
          </p>
        </section>

        {/* PRODUCT 1: CIPHER CONCIERGE (HOSPITALITY) */}
        <section className="product-block">
          <div className="product-card glass-panel">
            <div className="card-top">
              <div>
                <span className="sub-tag">FLAGSHIP DEPLOYMENT • HOSPITALITY</span>
                <h2>Cipher Concierge</h2>
              </div>
              <span className="badge-available">Available Now</span>
            </div>

            <p className="product-lead">
              A zero-hardware, ephemeral digital concierge built for boutique hotels and luxury resorts. Guests receive instant 24/7 property guidance directly on their mobile browsers via an in-room QR card.
            </p>

            <div className="features-subgrid">
              <div className="mini-feature">
                <strong>🛎️ Night Audit Relief</strong>
                Eliminates repetitive calls about Wi-Fi, checkout hours, amenities, and dining.
              </div>
              <div className="mini-feature">
                <strong>💳 Zero Upfront Hardware</strong>
                No expensive tablets to clean, update, or replace. Powered by nightstand QR cards.
              </div>
              <div className="mini-feature">
                <strong>🔒 RAM-Only Isolation</strong>
                Stateless inference. No phone numbers, names, or guest queries are ever stored.
              </div>
              <div className="mini-feature">
                <strong>🌐 Native Multilingual</strong>
                Automatically answers international guests in over 20 languages.
              </div>
            </div>

            <div className="pricing-box">
              <div className="pricing-details">
                <span className="price">$3.50</span>
                <span className="price-unit">/ room / month</span>
              </div>
              <a href="#inquire" className="btn btn-primary">
                Book 30-Day Hotel Pilot
              </a>
            </div>
          </div>
        </section>

        {/* PRODUCT 2: PRIVATE CORE */}
        <section className="product-block">
          <div className="product-card glass-panel">
            <div className="card-top">
              <div>
                <span className="sub-tag">ENTERPRISE INTELLIGENCE</span>
                <h2>Cipher Private Core</h2>
              </div>
              <span className="badge-roadmap">In Development</span>
            </div>

            <p className="product-lead">
              Proprietary, sub-watt compact language models fine-tuned for on-premise execution. Run high-utility reasoning directly on company hardware with complete isolation from external third-party APIs.
            </p>

            <div className="features-subgrid">
              <div className="mini-feature">
                <strong>🛡️ Complete Data Isolation</strong>
                Proprietary enterprise documents and internal communications never leave your network.
              </div>
              <div className="mini-feature">
                <strong>⚡ Compressed Non-Binary Logic</strong>
                Designed for minimal memory overhead, drastically lowering operating and electrical costs.
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT 3: EDGE NODE */}
        <section className="product-block">
          <div className="product-card glass-panel">
            <div className="card-top">
              <div>
                <span className="sub-tag">EMBEDDED SILICON</span>
                <h2>Cipher Edge Node</h2>
              </div>
              <span className="badge-roadmap">Architecture Roadmap</span>
            </div>

            <p className="product-lead">
              Turnkey micro-appliances engineered to serve local-first intelligence at the network edge. Stateless, plug-and-play nodes built to eliminate expensive server racks.
            </p>
          </div>
        </section>

        {/* Inquire / Pilot Form */}
        <section id="inquire" className="form-section">
          <div className="form-card glass-panel">
            <div className="section-header">
              <span className="sub-tag">DEPLOYMENT INQUIRIES</span>
              <h2>Schedule a Prototype Walkthrough</h2>
              <p>Tell us about your property or project to test a live demo calibrated to your needs.</p>
            </div>

            {submitted ? (
              <div className="form-success">
                Thank you. We have received your inquiry and will reach out with demo details shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="lead-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Full Name"
                  required
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="orgName"
                  placeholder="Hotel, Property, or Organization Name"
                  required
                  onChange={handleInputChange}
                />
                <select
                  name="productInterest"
                  value={formData.productInterest}
                  onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                  className="lead-select"
                >
                  <option value="Cipher Concierge (Hospitality)">Cipher Concierge (Hospitality Pilot)</option>
                  <option value="Cipher Private Core">Cipher Private Core (Enterprise)</option>
                  <option value="Cipher Edge Node">Cipher Edge Node (Hardware)</option>
                </select>
                <input
                  type="email"
                  name="email"
                  placeholder="Business / Work Email"
                  required
                  onChange={handleInputChange}
                />
                <button type="submit" className="btn btn-primary btn-block">
                  Submit Deployment Request
                </button>
              </form>
            )}
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

        h1, h2, h3, h4, .brand-text, .btn, .sub-tag {
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
          font-size: 44px;
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

        /* Products Section */
        .product-block {
          margin-bottom: 30px;
        }

        .product-card {
          padding: 36px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .sub-tag {
          font-size: 10px;
          letter-spacing: 2px;
          color: #00ffd5;
          display: block;
          margin-bottom: 4px;
        }

        .product-card h2 {
          font-size: 24px;
          color: #ffffff;
        }

        .badge-available {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 8px;
          background: rgba(0, 255, 213, 0.1);
          color: #00ffd5;
          border: 1px solid rgba(0, 255, 213, 0.3);
        }

        .badge-roadmap {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .product-lead {
          font-size: 14.5px;
          color: #cbd5e1;
          line-height: 1.65;
          margin-bottom: 24px;
        }

        .features-subgrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .mini-feature {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px;
          border-radius: 14px;
          font-size: 12.5px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .mini-feature strong {
          display: block;
          color: #ffffff;
          font-size: 13.5px;
          margin-bottom: 4px;
        }

        .pricing-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pricing-details {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .price {
          font-size: 28px;
          font-weight: 800;
          color: #00ffd5;
        }

        .price-unit {
          font-size: 13px;
          color: #64748b;
        }

        /* Lead Form */
        .form-section {
          margin-top: 60px;
          margin-bottom: 60px;
        }

        .form-card {
          padding: 40px 30px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .section-header h2 {
          font-size: 24px;
          color: #ffffff;
          margin-top: 6px;
          margin-bottom: 8px;
        }

        .section-header p {
          font-size: 14px;
          color: #64748b;
        }

        .lead-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 480px;
          margin: 0 auto;
        }

        .lead-form input,
        .lead-select {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .lead-select {
          cursor: pointer;
        }

        .lead-select option {
          background: #05060a;
          color: white;
        }

        .lead-form input:focus,
        .lead-select:focus {
          border-color: #00ffd5;
        }

        .btn {
          padding: 13px 26px;
          border-radius: 12px;
          font-size: 13.5px;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-block;
          cursor: pointer;
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

        .btn-block {
          width: 100%;
          margin-top: 6px;
        }

        .form-success {
          padding: 20px;
          background: rgba(0, 255, 213, 0.08);
          border: 1px solid rgba(0, 255, 213, 0.3);
          color: #00ffd5;
          border-radius: 12px;
          font-size: 14px;
          text-align: center;
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
          .pricing-box {
            flex-direction: column;
            gap: 14px;
            align-items: flex-start;
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
