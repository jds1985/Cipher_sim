import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ShopStream() {
  const [items, setItems] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // 🔥 TEMP DATA (replace with Firestore later)
    const shops = [
      {
        id: "1",
        type: "shop",
        name: "Nashville Street Tacos 🌮",
        product: "3 Taco Combo (Fresh Off Grill)",
        price: "$9.99",
        location: "Nashville, TN",
        isLive: true,
        bg: "linear-gradient(180deg,#1a1a2e,#16213e)"
      },
      {
        id: "2",
        type: "shop",
        name: "Sneaker Plug 👟",
        product: "Limited Jordan Drop",
        price: "$120",
        location: "Local Pickup",
        isLive: false,
        bg: "linear-gradient(180deg,#0f2027,#203a43)"
      },
      {
        id: "3",
        type: "promo",
        name: "🔥 Featured Shop",
        product: "Boost your shop to thousands",
        price: "$99/mo",
        location: "Cipher Promotion",
        isLive: false,
        bg: "linear-gradient(180deg,#2a0845,#6441a5)"
      },
      {
        id: "4",
        type: "shop",
        name: "Custom Jewelry 💎",
        product: "Handmade Chains",
        price: "$45",
        location: "Nashville",
        isLive: true,
        bg: "linear-gradient(180deg,#232526,#414345)"
      },
      {
        id: "5",
        type: "shop",
        name: "Vintage Tees 🧢",
        product: "Rare 90s Finds",
        price: "$35",
        location: "Local Market",
        isLive: false,
        bg: "linear-gradient(180deg,#141e30,#243b55)"
      }
    ];

    // 🔥 Inject promoted shop every 3 items
    const feed = [];
    shops.forEach((item, index) => {
      feed.push(item);

      if ((index + 1) % 3 === 0) {
        feed.push({
          id: "promo-" + index,
          type: "promo",
          name: "🚀 Promote Your Shop",
          product: "Get featured in ShopStream",
          price: "$99/mo",
          location: "Cipher OS",
          bg: "linear-gradient(180deg,#3a1c71,#d76d77)"
        });
      }
    });

    setItems(feed);
  }, []);

  return (
    <div style={styles.container}>
      {items.map((item) => (
        <div key={item.id} style={{ ...styles.slide, background: item.bg }}>

          {/* RIGHT SIDE ACTIONS */}
          <div style={styles.actions}>
            <div style={styles.icon}>❤️</div>
            <div style={styles.icon}>💬</div>
            <div style={styles.icon}>🔗</div>
          </div>

          {/* MAIN CONTENT */}
          <div style={styles.overlay}>
            <div style={styles.headerRow}>
              <h1 style={styles.name}>{item.name}</h1>
              {item.isLive && <span style={styles.live}>🔴 LIVE</span>}
            </div>

            <p style={styles.product}>{item.product}</p>

            <div style={styles.meta}>
              <span>{item.location}</span>
            </div>

            <div style={styles.price}>{item.price}</div>

            {/* BUTTON BEHAVIOR */}
            {item.type === "promo" ? (
              <button
                style={styles.buttonAlt}
                onClick={() => router.push("/shopstream/apply")}
              >
                Promote Your Shop 🚀
              </button>
            ) : (
              <button
                style={styles.button}
                onClick={() => alert("Purchase flow coming next 💰")}
              >
                Buy Now 🛒
              </button>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    overflowY: "scroll",
    scrollSnapType: "y mandatory",
    scrollBehavior: "smooth",
  },

  slide: {
    height: "100vh",
    scrollSnapAlign: "start",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    position: "relative",
  },

  overlay: {
    width: "100%",
    padding: "20px",
    color: "white",
    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  name: {
    fontSize: "24px",
    fontWeight: "bold",
  },

  live: {
    color: "red",
    fontWeight: "bold",
  },

  product: {
    marginTop: 5,
    fontSize: "16px",
    opacity: 0.9,
  },

  meta: {
    marginTop: 5,
    fontSize: "14px",
    opacity: 0.7,
  },

  price: {
    marginTop: 10,
    fontSize: "20px",
    fontWeight: "bold",
    color: "#00ffae",
  },

  button: {
    marginTop: 12,
    padding: "12px",
    width: "100%",
    borderRadius: 10,
    border: "none",
    background: "#9d7bff",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
  },

  buttonAlt: {
    marginTop: 12,
    padding: "12px",
    width: "100%",
    borderRadius: 10,
    border: "none",
    background: "#ff7b7b",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
  },

  actions: {
    position: "absolute",
    right: 10,
    bottom: 120,
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },

  icon: {
    fontSize: "22px",
    color: "white",
    opacity: 0.9,
  },
};
