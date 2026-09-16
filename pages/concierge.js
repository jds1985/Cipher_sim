import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function Concierge() {
  const [formData, setFormData] = useState({
    name: "",
    hotelName: "",
    roomCount: "",
    email: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePilotRequest = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Head>
        <title>Cipher Concierge | Private AI for Hotels</title>
        <meta
          name="description"
          content="Zero-hardware, ephemeral digital concierge for boutique hotels. Instant QR-code access, zero data harvesting, and 24/7 guest support."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Layer 1: Ambient Lighting Canvas */}
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
              Home
            </Link>
            <Link href="/mission" className="nav-item">
              Mission
            </Link>
            <Link href="/concierge" className="nav-item active">
              Concierge AI
            </Link>
          </nav>

          <div className="nav-action">
            <a href="#pilot" className="btn-nav-highlight">
              Book Pilot
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="pill-badge glass-pill">
            <span className="pulse-dot" />
            Zero-Hardware Guest Assistant
          </div>

          <h1 className="hero-title">
            The 24/7 Digital Concierge. <br />
            <span className="gradient-text">Zero Hardware. Pure Privacy.</span>
          </h1>

          <p className="hero-description">
            Relieve front-desk staff during late-night shifts and peak check-in.
            Guests scan an in-room QR card to receive instant, tailored answers
            in their browser—with zero tracking or account downloads.
          </p>

          <div className="hero-buttons">
            <a href="#pilot" className="btn btn-primary">
              Request 30-Day Pilot
            </a>
            <a href="#demo" className="btn btn-glass">
              See Live Experience
            </a>
          </div>
        </section>

        {/* Live Interactive In-Room Preview */}
        <section id="demo" className="preview-container">
          <div className="phone-mockup glass-panel">
            <div className="speaker-bar" />
            <div className="phone-header">
              <div>
                <h4>The Oliver Hotel</h4>
                <p>Digital Concierge • Room 304</p>
              </div>
              <span className="status-pill">Active</span>
            </div>

            <div className="chat-thread">
              <div className="msg assistant">
                Good evening. I am your private assistant for Room 304. How may I help you tonight?
              </div>
              <div className="msg guest">
                What time is breakfast and where is the nearest ice machine?
              </div>
              <div className="msg assistant">
                Breakfast is served downstairs in The Hearth Room from 6:30 AM to 10:00 AM. 
                <br /><br />
                The nearest ice machine to Room 304 is located down the left hallway, right beside the elevators.
              </div>
            </div>

            <div className="phone-footer">
              <span>🔒 RAM-Only Stateless Session</span>
              <span className="clear-btn">Clear History</span>
            </div>
          </div>
        </section>

        {/* Operational Advantages */}
        <section className="section-container">
          <div className="section-header">
            <span className="sub-tag">HOSPITALITY ADVANTAGES</span>
            <h2>Engineered for Boutique Properties</h2>
          </div>

          <div className="grid-features">
            <div className="feature-card glass-panel">
              <div className="feature-icon">🛎️</div>
              <h4>Night Audit Relief</h4>
              <p>
                Handles repetitive questions about Wi-Fi passwords, checkout times,
                amenities, and late-night food so night staff focus on safety and check-ins.
              </p>
            </div>

            <div className="feature-card glass-panel">
              <div className="feature-icon">💳</div>
              <h4>No Upfront Hardware</h4>
              <p>
                No expensive in-room tablets to purchase, clean, or maintain.
                A single elegant acrylic QR card on the nightstand powers the entire experience.
              </p>
            </div>

            <div className="feature-card glass-panel">
              <div className="feature-icon">🛡️</div>
              <h4>Zero Liability Privacy</h4>
              <p>
                Sessions execute purely in temporary memory and dissolve when the tab closes.
                No guest phone numbers, names, or chat logs are ever stored.
              </p>
            </div>

            <div className="feature-card glass-panel">
              <div className="feature-icon">🌐</div>
              <h4>Instant Multilingual</h4>
              <p>
                Flawlessly assists international travelers in Spanish, French, German, Japanese,
                and more without requiring multilingual staff on the floor.
              </p>
            </div>
          </div>
        </section>

        {/* Transparent Pricing */}
        <section className="section-container">
          <div className="pricing-card glass-panel">
            <div className="pricing-top">
              <div>
                <span className="sub-tag">PREDICTABLE PRICING</span>
                <h3>Full Property Deployment</h3>
              </div>
              <div className="price-tag">
                $3.50 <span>/ room / mo</span>
              </div>
            </div>

            <ul className="pricing-perks">
              <li>✓ Custom property training & policy calibration</li>
              <li>✓ Durable acrylic QR tent cards included</li>
              <li>✓ Unlimited guest sessions & multi-language support</li>
              <li>✓ Zero hardware to install, power, or replace</li>
              <li>✓ 100% ephemeral guest privacy guarantee</li>
            </ul>

            <p className="pricing-note">
              Low-risk 30-day single-floor pilots available for qualifying properties.
            </p>
          </div>
        </section>

        {/* Pilot Inquiry Form */}
        <section id="pilot" className="section-container form-section">
          <div className="form-card glass-panel">
            <div className="section-header">
              <span className="sub-tag">GET STARTED</span>
              <h2>Request a Property Walkthrough</h2>
              <p>See a custom prototype with your hotel rules before rolling it out.</p>
            </div>

            {submitted ? (
              <div className="form-success">
                Thank you. We will prepare your property demo and follow up shortly.
              </div>
            ) : (
              <form onSubmit={handlePilotRequest} className="lead-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Full Name"
                  required
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="hotelName"
                  placeholder="Hotel / Property Name"
                  required
                  onChange={handleInputChange}
                />
                <input
                  type="number"
                  name="roomCount"
                  placeholder="Total Room Keys (e.g. 75)"
                  required
                  onChange={handleInputChange}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Work / Corporate Email"
                  required
                  onChange={handleInputChange}
                />
                <button type="submit" className="btn btn-primary btn-block">
                  Request Property Pilot
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer glass-panel">
          <div className="footer-left">
            <span className="brand-symbol">◈</span> CIPHER CTS HOSPITALITY
          </div>
          <div className="footer-right">
            <span>Knoxville, TN</span>
            <span>•</span>
            <span>Zero-Hardware Intelligence</span>
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

        h1, h2, h3, h4, .brand-text, .btn, .sub-tag, .btn-nav-highlight {
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
            radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.12) 0%, transparent 55%),
            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 45%),
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
          gap: 24px;
        }

        .nav-item {
          color: #94a3b8;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-item:hover, .nav-item.active {
          color: #ffffff;
        }

        .nav-item.active {
          border-bottom: 1px solid #22d3ee;
          padding-bottom: 2px;
        }

        .btn-nav-highlight {
          color: #22d3ee;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          background: rgba(34, 211, 238, 0.08);
          border: 1px solid rgba(34, 211, 238, 0.25);
          padding: 8px 16px;
          border-radius: 12px;
          transition: all 0.2s;
          display: inline-block;
        }

        .btn-nav-highlight:hover {
          background: rgba(34, 211, 238, 0.16);
          border-color: #22d3ee;
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
          font-size: 44px;
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
          cursor: pointer;
        }

        .btn-primary {
          background: #22d3ee;
          color: #040812;
          font-weight: 700;
          border: none;
          box-shadow: 0 10px 25px -5px rgba(34, 211, 238, 0.4);
        }

        .btn-primary:hover {
          background: #67e8f9;
          transform: translateY(-1px);
        }

        .btn-glass {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
        }

        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        /* Phone Preview */
        .preview-container {
          display: flex;
          justify-content: center;
          margin-bottom: 70px;
        }

        .phone-mockup {
          width: 100%;
          max-width: 360px;
          padding: 24px 20px;
          border-radius: 36px;
        }

        .speaker-bar {
          width: 50px;
          height: 4px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 99px;
          margin: 0 auto 20px auto;
        }

        .phone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 18px;
        }

        .phone-header h4 {
          font-size: 14px;
          color: #ffffff;
        }

        .phone-header p {
          font-size: 11px;
          color: #22d3ee;
        }

        .status-pill {
          background: rgba(34, 211, 238, 0.12);
          color: #22d3ee;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .chat-thread {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 12.5px;
          margin-bottom: 25px;
        }

        .msg {
          padding: 12px 14px;
          border-radius: 14px;
          line-height: 1.5;
        }

        .msg.assistant {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
          align-self: flex-start;
        }

        .msg.guest {
          background: #22d3ee;
          color: #040812;
          font-weight: 500;
          align-self: flex-end;
        }

        .phone-footer {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: #64748b;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .clear-btn {
          color: #f87171;
        }

        /* Features */
        .section-container {
          margin-bottom: 70px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .sub-tag {
          font-size: 10px;
          letter-spacing: 2px;
          color: #22d3ee;
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

        .grid-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .feature-card {
          padding: 26px;
        }

        .feature-icon {
          font-size: 22px;
          margin-bottom: 12px;
        }

        .feature-card h4 {
          font-size: 15px;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .feature-card p {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.6;
        }

        /* Pricing */
        .pricing-card {
          padding: 40px;
          max-width: 600px;
          margin: 0 auto;
        }

        .pricing-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }

        .pricing-top h3 {
          font-size: 20px;
          color: #ffffff;
        }

        .price-tag {
          font-size: 32px;
          font-weight: 800;
          color: #22d3ee;
        }

        .price-tag span {
          font-size: 13px;
          font-weight: 400;
          color: #64748b;
        }

        .pricing-perks {
          list-style: none;
          font-size: 14px;
          color: #cbd5e1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .pricing-note {
          font-size: 12px;
          color: #64748b;
          text-align: center;
        }

        /* Form */
        .form-card {
          padding: 40px 30px;
          max-width: 540px;
          margin: 0 auto;
        }

        .lead-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        .lead-form input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .lead-form input:focus {
          border-color: #22d3ee;
        }

        .btn-block {
          width: 100%;
          margin-top: 8px;
        }

        .form-success {
          padding: 20px;
          background: rgba(34, 211, 238, 0.08);
          border: 1px solid rgba(34, 211, 238, 0.3);
          color: #22d3ee;
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
          color: #22d3ee;
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
          .hero-title {
            font-size: 32px;
          }
          .hero-buttons {
            flex-direction: column;
          }
          .pricing-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
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
