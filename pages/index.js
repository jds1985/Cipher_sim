import Head from "next/head";
import { useEffect, useState } from "react";

export default function Home() {
  const [meshStatus, setMeshStatus] = useState("MESH INITIALIZING...");
  const [meshColor, setMeshColor] = useState("#ffaa00");
  const [peerCount, setPeerCount] = useState(0);

  // Initialize Helia Mesh dynamically on client mount
  useEffect(() => {
    let intervalId = null;

    async function initMesh() {
      try {
        const { createHelia } = await import("https://esm.sh/helia");
        const { unixfs } = await import("https://esm.sh/@helia/unixfs");
        const { createLibp2p } = await import("https://esm.sh/libp2p");
        const { webSockets } = await import("https://esm.sh/@libp2p/websockets");
        const { noise } = await import("https://esm.sh/@chainsafe/libp2p-noise");
        const { mplex } = await import("https://esm.sh/@libp2p/mplex");
        const { bootstrap } = await import("https://esm.sh/@libp2p/bootstrap");

        const libp2p = await createLibp2p({
          transports: [webSockets()],
          connectionEncryption: [noise()],
          streamMuxers: [mplex()],
          peerDiscovery: [
            bootstrap({
              list: [
                "/dnsaddr/bootstrap.libp2p.io/p2p/12D3KooWJ6gL6z7uRkJrVN6a8GN28AL5soMgqd7qV3CyMfCVxYv3",
              ],
            }),
          ],
        });

        const helia = await createHelia({ libp2p });
        unixfs(helia);

        setMeshStatus("MESH ACTIVE");
        setMeshColor("#00ffcc");

        intervalId = setInterval(() => {
          if (helia?.libp2p) {
            const peers = helia.libp2p.getPeers();
            setPeerCount(peers.length);
          }
        }, 2000);
      } catch (err) {
        console.error("Mesh initialization error:", err);
        setMeshStatus("MESH OFFLINE");
        setMeshColor("#ff4d4d");
      }
    }

    initMesh();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handlePreOrder = async () => {
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error(data);
        alert("Stripe session failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed.");
    }
  };

  const handleDevBypass = () => {
    localStorage.setItem("cipher_dev_access", "granted");
    localStorage.setItem("cipher_entered", "true");
    window.location.href = "/";
  };

  return (
    <>
      <Head>
        <title>Cipher CTS | Your Sovereign AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://js.stripe.com/v3/" async />
      </Head>

      <div className="bg-overlay" />

      <div className="container">
        <img
          src="/images/hero-network.png"
          alt="Cipher CTS Network"
          className="hero-image"
        />

        <div className="tagline">THE COGNITIVE OPERATING SYSTEM</div>

        <div
          id="mesh-indicator"
          style={{
            fontSize: "10px",
            color: meshColor,
            letterSpacing: "2px",
            marginBottom: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div
            id="mesh-dot"
            style={{
              width: "6px",
              height: "6px",
              background: meshColor,
              borderRadius: "50%",
              boxShadow: `0 0 8px ${meshColor}`,
              transition: "all 0.3s ease",
            }}
          />
          <span id="mesh-status">{meshStatus}</span>
          <span id="peer-count" style={{ marginLeft: "10px" }}>
            PEERS: {peerCount}
          </span>
        </div>

        <h1>COMING SUMMER 2026</h1>

        <button
          onClick={handleDevBypass}
          style={{
            marginTop: "15px",
            marginBottom: "25px",
            display: "block",
            width: "100%",
            padding: "20px",
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            color: "white",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: "bold",
            border: "none",
            borderRadius: "15px",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(239, 68, 68, 0.35)",
            letterSpacing: "2px",
            fontSize: "15px",
          }}
        >
          INITIALIZE LOCAL SUBSTRATE (ARCHITECT DEV)
        </button>

        <div className="mission-box">
          <h2>AI Without the Extraction</h2>
          <p>
            Giant AI companies use billions of gallons of water and enough electricity
            to power small countries just to answer your questions.{" "}
            <strong>Cipher CTS changes the physics.</strong>
          </p>
          <p>
            By moving to <strong>Ternary BitNet logic</strong>, we’ve built an AI that runs locally on your device.
            No server farms. No data harvesting. No subscriptions.
          </p>
          <img
            src="/images/ai-without-extraction.png"
            alt="AI Without Extraction"
            className="section-image"
          />
        </div>

        <div className="feature-grid">
          <div className="feature">
            <strong>100% Private</strong>
            Your data never leaves your hardware. Local-only inference.
          </div>

          <div className="feature">
            <strong>Eco-Engineered</strong>
            80% less energy consumption than standard binary AI models.
          </div>

          <img
            src="/images/eco-engineered.png"
            alt="Eco Engineered"
            className="section-image"
          />

          <div className="feature">
            <strong>Unblockable</strong>
            A decentralized P2P mesh network. No &quot;off&quot; switch.
          </div>

          <img
            src="/images/unblockable-network.png"
            alt="Unblockable Mesh Network"
            className="section-image"
          />

          <div className="feature">
            <strong>Stateless Federation</strong>
            Download the Substrate in Summer. Process locally, access on the go via cloud proxy.
          </div>

          <img
            src="/images/substrate-app.png"
            alt="Cipher CTS Substrate App"
            className="section-image"
          />
        </div>

        <div className="offer-split">
          <div className="offer-card">
            <h3>THE SUBSTRATE CLIENT</h3>
            <p style={{ fontSize: "13px" }}>
              Download to your PC or Mac in Summer. 100% local, offline-first execution.
            </p>
            <button
              className="btn btn-free"
              onClick={() => alert("Download link will be active in Summer!")}
            >
              GET FREE ACCESS
            </button>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                marginTop: "10px",
                display: "block",
              }}
            >
              Open-Source Core Engine
            </span>
          </div>

          <div className="offer-card premium">
            <h3>THE CIPHER NET-NODE</h3>
            <p style={{ fontSize: "13px", marginBottom: "10px" }}>
              Stateless Cloud Proxy Relay for Firewall Tunneling & Global Federation.
            </p>
            <div
              style={{
                textAlign: "left",
                fontSize: "11px",
                color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.02)",
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid rgba(255,77,77,0.15)",
              }}
            >
              <span style={{ color: "#ff4d4d", display: "block", marginBottom: "5px" }}>
                ⚡ INSTANT WEBSOCKET TUNNEL
              </span>
              Bypass home router firewalls without exposing your private local IP address.
              <br />
              <br />
              <span style={{ color: "#ff4d4d", display: "block", marginBottom: "5px" }}>
                🌐 SOVEREIGN DIGITAL IDENTITY
              </span>
              Get a permanent, global handle recognized across the decentralized Fediverse.
            </div>
            <button
              className="btn btn-box"
              onClick={handlePreOrder}
              style={{
                position: "relative",
                zIndex: 9999,
                background: "linear-gradient(135deg, #ff4d4d, #b91c1c)",
                boxShadow: "0 10px 30px rgba(255, 77, 77, 0.35)",
              }}
            >
              DEPLOY NET-NODE
            </button>
            <span
              style={{
                fontSize: "13px",
                color: "#ff4d4d",
                fontWeight: "bold",
                marginTop: "15px",
                display: "block",
                letterSpacing: "1px",
              }}
            >
              $15 / MONTH
            </span>
          </div>
        </div>

        <div className="offer-card recruit-card">
          <h3>JOIN THE DEPLOYMENT NETWORK</h3>
          <p style={{ fontSize: "13px" }}>
            We&apos;re recruiting students, tech enthusiasts, and early operators to
            help expand the Cipher CTS substrate into businesses, hotels, campuses,
            and real-world infrastructure.
          </p>
          <button
            className="btn btn-recruit"
            onClick={() => (window.location.href = "/recruit.html")}
          >
            JOIN THE NETWORK
          </button>
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.45)",
              marginTop: "12px",
              display: "block",
            }}
          >
            Commission-based opportunities available for early deployment partners and regional operators.
          </span>
        </div>

        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
          Cipher CTS is a local-first cognitive system. No cloud data dependencies.
          <br />
          Stateless cloud proxy network routes via open standards including ActivityPub and Webfinger.
        </p>
      </div>

      <a
        rel="me"
        href="https://techhub.social/@Cipher_dev_1985"
        style={{ display: "none" }}
      >
        Mastodon Verification
      </a>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Orbitron", sans-serif;
          color: white;
          background-color: #02030a;
          text-align: center;
          overflow-x: hidden;
          line-height: 1.6;
        }

        .bg-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(3, 3, 10, 0.85), rgba(3, 3, 10, 0.95)),
            url("/images/cipher-cts-bg.png");
          background-size: cover;
          background-position: center;
          z-index: -1;
        }

        .container {
          width: 100%;
          max-width: 650px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .hero-image {
          width: 100%;
          border-radius: 28px;
          margin-bottom: 30px;
          border: 1px solid rgba(139, 102, 255, 0.2);
          box-shadow: 0 0 40px rgba(139, 102, 255, 0.15),
            0 0 80px rgba(0, 255, 200, 0.08);
          display: block;
        }

        h1 {
          font-size: 38px;
          letter-spacing: 4px;
          color: #ffffff;
          margin-bottom: 10px;
        }

        .tagline {
          color: #8b66ff;
          font-size: 14px;
          letter-spacing: 3px;
          margin-bottom: 40px;
        }

        .mission-box {
          background: rgba(140, 120, 255, 0.05);
          border: 1px solid rgba(140, 120, 255, 0.2);
          padding: 30px;
          border-radius: 24px;
          margin-bottom: 40px;
          text-align: left;
          backdrop-filter: blur(10px);
        }

        .mission-box h2 {
          font-size: 20px;
          margin-bottom: 15px;
          color: #d8c7ff;
        }

        .mission-box p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 15px;
        }

        .section-image {
          width: 100%;
          margin-top: 25px;
          border-radius: 22px;
          border: 1px solid rgba(139, 102, 255, 0.15);
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.08),
            0 0 60px rgba(139, 102, 255, 0.08);
          overflow: hidden;
          display: block;
          grid-column: span 2;
        }

        .offer-card .section-image {
          margin-top: 20px;
          margin-bottom: 20px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 40px;
        }

        .feature {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px;
          border-radius: 15px;
          font-size: 12px;
          text-align: center;
        }

        .feature strong {
          display: block;
          color: #8b66ff;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .offer-split {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 50px;
        }

        .offer-card {
          background: rgba(10, 10, 20, 0.8);
          border: 1px solid rgba(139, 102, 255, 0.3);
          padding: 25px;
          border-radius: 20px;
          text-align: center;
        }

        .recruit-card {
          border: 1px solid rgba(0, 255, 200, 0.25);
          box-shadow: 0 0 25px rgba(0, 255, 200, 0.08);
        }

        .btn-recruit {
          background: linear-gradient(135deg, #00c2ff, #00ffcc);
          color: #02030a;
          border: none;
          box-shadow: 0 10px 30px rgba(0, 255, 200, 0.2);
        }

        .offer-card.premium {
          border-color: #ff4d4d;
          box-shadow: 0 0 20px rgba(255, 77, 77, 0.15);
        }

        .offer-card h3 {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .btn {
          display: block;
          width: 100%;
          padding: 20px;
          border-radius: 15px;
          font-family: "Orbitron", sans-serif;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          margin-top: 15px;
          cursor: pointer;
          transition: 0.3s;
        }

        .btn-free {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-box {
          background: linear-gradient(135deg, #7446ff, #4a1dff);
          color: white;
          border: none;
          box-shadow: 0 10px 30px rgba(74, 29, 255, 0.4);
        }

        @media (max-width: 600px) {
          .feature-grid {
            grid-template-columns: 1fr;
          }
          .feature-grid .section-image {
            grid-column: span 1;
          }
          h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  );
}
