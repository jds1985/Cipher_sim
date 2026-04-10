import { useRouter } from "next/router";
import { useEffect } from "react"; // ✅ added

export default function Success() {
  const router = useRouter();

  // 🔥 RECOVER + STORE SHOP
  useEffect(() => {
    const shop = localStorage.getItem("pendingShop");

    if (shop) {
      localStorage.setItem("liveShop", shop);
      localStorage.removeItem("pendingShop");
    }
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔥 You're Live!</h1>

      <p style={styles.text}>
        Your shop is now active on ShopStream.
      </p>

      <button
        style={styles.button}
        onClick={() => router.push("/shopstream")}
      >
        Go to Feed →
      </button>
    </div>
  );
}
