import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    hotelName: "",
    roomCount: "",
    email: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePilotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    // Connect to your email or lead capture endpoint
    setSubmitted(true);
  };

  return (
    <>
      <Head>
        <title>Cipher CTS | Zero-Hardware Private AI Concierge for Hotels</title>
        <meta
          name="description"
          content="Deliver private, 24/7 guest assistance directly to mobile browsers via in-room QR cards. Zero hardware, zero app downloads, 100% private."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="bg-overlay" />

      <main className="container">
        {/* Navigation / Header */}
        <header className="header">
          <div className="logo-box">
            <span className="logo-symbol">◈</span>
            <span className="brand-name">CIPHER CTS</span>
          </div>
          <a href="#pilot" className="nav-link">
            Request Pilot
          </a>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="badge">
            <span className="badge-pulse"></span>
            Private Hospitality Intelligence
          </div>

          <h1>
            The 24/7 Digital Concierge.
            <br />
            <span className="gradient-text">Zero Hardware. Total Privacy.</span>
          </h1>

          <p className="hero-subtext">
            Relieve front-desk staff during peak check-in and late-night shifts.
            Guests scan a clean in-room QR card to receive instant property
            answers on their phones—with zero data logging.
          </p>

          <div className="hero-actions">
            <a href="/demo" className="btn btn-primary">
              Launch Live Guest Demo
            </a>
            <a href="#pilot" className="btn btn-secondary">
              Book 30-Day Single-Floor Pilot
            </a>
          </div>

          <div className="trust-metrics">
            <div>⚡ Setup in 1 Afternoon</div>
            <div>🔒 100% Stateless RAM</div>
            <div>📱 Zero App Installs</div>
          </div>
        </section>

        {/* Interactive In-Room Preview Mockup */}
        <section className="preview-section">
          <div className="phone-mockup">
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
                Good evening. I am Cipher, your private assistant for Room 304.
                How can I assist your stay tonight?
              </div>
              <div className="msg guest">
                What time does breakfast end and can I get a 12 PM checkout?
              </div>
              <div className="msg assistant">
                Breakfast is served downstairs in The Hearth Room until 10:00 AM.
                <br />
                <br />
                Your 12:00 PM late checkout is confirmed for Room 304.
              </div>
            </div>

            <div className="phone-footer">
              <span>🔒 100% Private (Stateless)</span>
              <span className="btn-clear">End Session</span>
            </div>
          </div>
        </section>

        {/* The GM Pain Points */}
        <section className="section-block">
          <h2 className="section-title">Built for Real Hotel Operations</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>Eliminate Repetitive Night Calls</h3>
              <p>
                Wi-Fi passcodes, extra towels, ice machines, and dining options
                are resolved instantly without waking night staff or tying up
                the desk.
              </p>
            </div>
            <div className="feature-card">
              <h3>No In-Room Tablets or Hardware</h3>
              <p>
                Eliminate thousands in hardware replacements, stolen cords, and
                broken displays. A single elegant acrylic QR card in each room
                powers the entire service.
              </p>
            </div>
            <div className="feature-card">
              <h3>Zero Compliance Liability</h3>
              <p>
                Conversations run completely statelessly in RAM and dissolve
                instantly upon exit. No guest data harvesting or CCPA/GDPR
                exposure.
              </p>
            </div>
            <div className="feature-card">
              <h3>Custom-Tuned to Your Property</h3>
              <p>
                We inject your property’s exact policies, operating hours, and
                handpicked local dining recommendations directly into the
                assistant.
              </p>
            </div>
          </div>
        </section>

        {/* Transparent PRPM Pricing */}
        <section className="section-block">
          <h2 className="section-title">Simple Per-Room Pricing</h2>
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Full Property Deployment</h3>
              <div className="price-tag">
                $3.50 <span>/ room / month</span>
              </div>
            </div>
            <ul className="pricing-list">
              <li>✓ Custom property knowledge base & tone calibration</li>
              <li>✓ High-durability acrylic room cards included</li>
              <li>✓ Zero hardware to install, maintain, or update</li>
              <li>✓ Unlimited guest queries & multilingual support</li>
              <li>✓ Complete RAM-only guest privacy guarantee</li>
            </ul>
            <p className="pricing-subtext">
              Looking to test first? We offer a low-risk 30-day single-floor pilot.
            </p>
          </div>
        </section>

        {/* Pilot Lead Capture Form */}
        <section id="pilot" className="section-block pilot-section">
          <h2 className="section-title">Schedule a Property Walkthrough</h2>
          <p className="section-subtext">
            See how Cipher answers your specific hotel policies before deciding.
          </p>

          {submitted ? (
            <div className="form-success">
              Thank you. We will reach out shortly with your property prototype.
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
                placeholder="Total Room Keys (e.g. 85)"
                required
                onChange={handleInputChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Corporate / Work Email"
                required
                onChange={handleInputChange}
              />
              <button type="submit" className="btn btn-primary btn-submit">
                Request Property Pilot
              </button>
            </form>
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>
            Cipher CTS • Zero-Hardware Private AI Infrastructure • Designed for
            Independent & Boutique Hospitality.
          </p>
        </footer>
      </main>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", sans-serif;
          color: #e2e8f0;
          background-color: #07090e;
          line-height: 1.6;
          overflow-x: hidden;
        }

        h1,
        h2,
        h3,
        h4,
        .brand-name,
        .btn {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 700;
        }

        .bg-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
              circle at 50% 15%,
              rgba(14, 165, 233, 0.08) 0%,
              transparent 65%
            ),
            #07090e;
          z-index: -1;
        }

        .container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 30px 24px 80px 24px;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 40px;
        }

        .logo-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-symbol {
          color: #38bdf8;
          font-size: 20px;
        }

        .brand-name {
          font-size: 15px;
          letter-spacing: 2px;
          color: #ffffff;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #38bdf8;
        }

        /* Hero */
        .hero-section {
          text-align: center;
          padding: 40px 0 60px 0;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }

        .badge-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
        }

        h1 {
          font-size: 46px;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 20px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #38bdf8 0%, #a5f3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtext {
          font-size: 17px;
          color: #94a3b8;
          max-width: 640px;
          margin: 0 auto 35px auto;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 40px;
        }

        .btn {
          padding: 14px 26px;
          border-radius: 12px;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-block;
          cursor: pointer;
          border: none;
        }

        .btn-primary {
          background: #38bdf8;
          color: #040812;
          font-weight: 700;
          box-shadow: 0 10px 25px rgba(56, 189, 248, 0.25);
        }

        .btn-primary:hover {
          background: #7dd3fc;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .trust-metrics {
          display: flex;
          justify-content: center;
          gap: 30px;
          font-size: 13px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Preview Phone Mockup */
        .preview-section {
          display: flex;
          justify-content: center;
          margin-bottom: 80px;
        }

        .phone-mockup {
          width: 100%;
          max-width: 360px;
          background: #0f141e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 36px;
          padding: 24px 20px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(56, 189, 248, 0.08);
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
          color: #38bdf8;
        }

        .status-pill {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
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
          background: #38bdf8;
          color: #040812;
          font-weight: 500;
          align-self: flex-end;
        }

        .phone-footer {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .btn-clear {
          color: #f87171;
          cursor: pointer;
        }

        /* Feature Section */
        .section-block {
          margin-bottom: 80px;
        }

        .section-title {
          font-size: 28px;
          text-align: center;
          margin-bottom: 35px;
          color: #ffffff;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 26px;
          border-radius: 18px;
        }

        .feature-card h3 {
          font-size: 16px;
          color: #f8fafc;
          margin-bottom: 10px;
        }

        .feature-card p {
          font-size: 13.5px;
          color: #94a3b8;
          line-height: 1.6;
        }

        /* Pricing Card */
        .pricing-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 24px;
          padding: 40px;
          max-width: 560px;
          margin: 0 auto;
        }

        .pricing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 20px;
          margin-bottom: 25px;
        }

        .pricing-header h3 {
          font-size: 18px;
        }

        .price-tag {
          font-size: 32px;
          font-weight: 800;
          color: #38bdf8;
        }

        .price-tag span {
          font-size: 13px;
          font-weight: 400;
          color: #64748b;
        }

        .pricing-list {
          list-style: none;
          font-size: 14px;
          color: #cbd5e1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 25px;
        }

        .pricing-subtext {
          font-size: 12px;
          color: #64748b;
          text-align: center;
        }

        /* Lead Form */
        .pilot-section {
          max-width: 500px;
          margin: 0 auto 60px auto;
          text-align: center;
        }

        .section-subtext {
          font-size: 14px;
          color: #94a3b8;
          margin-top: -20px;
          margin-bottom: 25px;
        }

        .lead-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          border-color: #38bdf8;
        }

        .btn-submit {
          margin-top: 8px;
          font-size: 15px;
        }

        .form-success {
          padding: 20px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
          border-radius: 12px;
          font-size: 14px;
        }

        /* Footer */
        .footer {
          text-align: center;
          font-size: 12px;
          color: #475569;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 30px;
        }

        @media (max-width: 650px) {
          h1 {
            font-size: 32px;
          }
          .hero-actions {
            flex-direction: column;
          }
          .trust-metrics {
            flex-direction: column;
            gap: 8px;
          }
          .feature-grid {
            grid-template-columns: 1fr;
          }
          .pricing-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </>
  );
}
