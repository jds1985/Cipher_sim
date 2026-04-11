import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// 🔥 helper to convert links → embeddable
function formatLiveUrl(url) {
  if (!url) return "";

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId =
      url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return null; // fallback for unsupported embeds
}

export default function ShopStream() {
  const [tab, setTab] = useState("shop");
  const [shops, setShops] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shop = localStorage.getItem("liveShop");
    if (shop) {
      setShops([JSON.parse(shop)]);
    }
  }, []);

  return (
    <div style={styles.container}>

      {/* TAB SWITCH */}
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

      {/* SHOP TAB */}
      {tab === "shop" && (
        <div style={styles.feedWrapper}>

          {shops.map((shop, i) => {
            const embedUrl = formatLiveUrl(shop.liveUrl);

            return (
              <div key={i} style={styles.card}>

                {/* 🎥 VIDEO AREA */}
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    style={styles.video}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : shop.liveUrl ? (
                  <div style={styles.videoPlaceholder}>
                    <a href={shop.liveUrl} target="_blank">
                      <button style={styles.watchBtn}>
                        Watch Live 🔴
                      </button>
                    </a>
                  </div>
                ) : (
                  <div style={styles.videoPlaceholder}></div>
                )}

                <div style={styles.overlay}>
                  <h2>{shop.shopName} 🔴 LIVE</h2>
                  <p>{shop.product}</p>
                  <p>{shop.location}</p>
                  <h3>${shop.price}</h3>
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* SELL TAB */}
      {tab === "sell" && (
        <div style={styles.sellWrapper}>
          <h1>Go Live. Sell Instantly.</h1>

          <p style={styles.subtext}>
            Turn your shop into a live storefront.
          </p>

          <div style={styles.bullets}>
            <p>🎥 Use YouTube, TikTok, IG</p>
            <p>📍 Reach local buyers</p>
            <p>💰 Keep 100%</p>
            <p>🚀 Go live instantly</p>
          </div>

          <div style={styles.pricing}>
            <h2>$99/month</h2>
            <p>No commissions</p>
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
  },

  activeTab: {
    padding: "10px 20px",
    borderRadius: "20px",
    background: "#6c5ce7",
    border: "none",
    color: "white",
  },

  feedWrapper: {
    height: "calc(100vh - 60px)",
    overflowY: "scroll",
  },

  card: {
    height: "100vh",
    position: "relative",
  },

  video: {
    width: "100%",
    height: "100%",
    border: "none",
  },

  videoPlaceholder: {
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#111",
  },

  watchBtn: {
    padding: "15px 25px",
    borderRadius: "25px",
    border: "none",
    background: "red",
    color: "white",
    fontWeight: "bold",
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
    opacity: 0.8,
  },

  bullets: {
    marginTop: "20px",
  },

  pricing: {
    marginTop: "20px",
  },

  cta: {
    marginTop: "20px",
    padding: "15px 25px",
    borderRadius: "30px",
    background: "#00ffcc",
    color: "black",
    border: "none",
  },
};
