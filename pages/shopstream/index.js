import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ShopStream() {
  const [tab, setTab] = useState("shop");
  const [shops, setShops] = useState([]); // ✅ added
  const router = useRouter();

  // ✅ load shop after success
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shop = localStorage.getItem("liveShop");
    if (shop) {
      setShops([JSON.parse(shop)]);
    }
  }, []);

  return (
    <div style={styles.container}>

      {/* 🔁 TAB SWITCH */}
      <div style={styles.tabBar}>
        <button
          style={tab === "shop" ? styles.activeTab : styles.tab}
          onClick={() => setTab("shop")}
        >
          🛍 Shop
        </button>

        <button
          style={tab === "sell" ? styles.activeTab : styles.tab}
          onClick={() => setTab("sell")}
        >
          🏪 Sell
        </button>
      </div>

      {/* 🛍 SHOP TAB */}
      {tab === "shop" && (
        <div style={styles.feedWrapper}>

          {/* ✅ DYNAMIC SHOP */}
          {shops.map((shop, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.videoPlaceholder}></div>

              <div style={styles.overlay}>
                <h2>{shop.shopName} 🔴 LIVE</h2>
                <p>{shop.product}</p>
                <p>{shop.location}</p>
                <h3>${shop.price}</h3>
              </div>
            </div>
          ))}

          {/* EXISTING DEMO CARDS */}
          <div style={styles.card}>
            <div style={styles.videoPlaceholder}></div>

            <div style={styles.overlay}>
              <h2>Nashville Street Tacos 🌮 🔴 LIVE</h2>
              <p>3 Taco Combo (Fresh Off Grill)</p>
              <p>Nashville, TN</p>
              <h3>$9.99</h3>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.videoPlaceholder}></div>

            <div style={styles.overlay}>
              <h2>Vintage Thrift Finds 🧥 🔴 LIVE</h2>
              <p>Handpicked Jackets</p>
              <p>Local Shop</p>
              <h3>$25</h3>
            </div>
          </div>
        </div>
      )}

      {/* 🏪 SELL TAB */}
      {tab === "sell" && (
        <div style={styles.sellWrapper}>
          <h1>Go Live. Sell Instantly.</h1>

          <p style={styles.subtext}>
            Turn your shop into a live storefront. Reach local buyers instantly.
          </p>

          <div style={styles.bullets}>
            <p>🎥 Go live from your phone</p>
            <p>📍 Reach local customers</p>
            <p>💰 Keep 100% of your sales</p>
            <p>🚀 No ads needed</p>
          </div>

          <div style={styles.pricing}>
            <h2>$99/month</h2>
            <p>No commissions. No hidden fees.</p>
          </div>

          <button
            style={styles.cta}
            onClick={() => router.push("/shopstream/signup")}
          >
            Start Selling
          </button>

        </div>
      )}

    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  container: {
    height: "100vh",
    background: "#0a0a12",
    color: "white",
    overflow: "hidden",
  },

  tabBar: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    padding: "10px",
    background: "#111",
  },

  tab: {
    padding: "10px 20px",
    borderRadius: "20px",
    background: "#222",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  activeTab: {
    padding: "10px 20px",
    borderRadius: "20px",
    background: "#6c5ce7",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  feedWrapper: {
    height: "calc(100vh - 60px)",
    overflowY: "scroll",
    scrollSnapType: "y mandatory",
  },

  card: {
    height: "100vh",
    scrollSnapAlign: "start",
    position: "relative",
  },

  videoPlaceholder: {
    height: "100%",
    background: "linear-gradient(180deg, #111, #222)",
  },

  overlay: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
  },

  sellWrapper: {
    padding: "30px",
    textAlign: "center",
  },

  subtext: {
    marginTop: "10px",
    opacity: 0.8,
  },

  bullets: {
    marginTop: "20px",
    textAlign: "left",
    maxWidth: "300px",
    marginInline: "auto",
  },

  pricing: {
    marginTop: "30px",
  },

  cta: {
    marginTop: "20px",
    padding: "15px 25px",
    borderRadius: "30px",
    border: "none",
    background: "#00ffcc",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
