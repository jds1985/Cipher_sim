// pages/store/index.jsx
import { useEffect, useState } from "react";
import { getCipherCoin } from "../../components/chat/CipherCoin";

export default function Store() {
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCoinBalance(getCipherCoin());
  }, []);

  return (
    <div style={styles.wrap}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.title}>Store</h1>
        <p style={styles.subtitle}>
          The Cipher economy lives here.
        </p>
      </header>

      {/* CIPHER COIN */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🪙 Cipher Coin</h2>

        <div style={styles.card}>
          <div style={styles.coinRow}>
            <span style={styles.coinIcon}>🪙</span>
            <span style={styles.coinAmount}>{coinBalance}</span>
          </div>

          <p style={styles.text}>
            Cipher Coin is earned — not bought.
          </p>

          <p style={styles.textMuted}>
            Today: earn by sharing Cipher.  
            Tomorrow: earn by contributing knowledge through CipherNet.
          </p>

          <p style={styles.textMuted}>
            Spending unlocks soon.
          </p>
        </div>
      </section>

      {/* CUSTOMIZATION */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🎨 Customization</h2>

        <div style={styles.grid}>
          {["Themes", "UI Skins", "Input Styles"].map((item) => (
            <div key={item} style={styles.lockedCard}>
              <div style={styles.lockedTitle}>{item}</div>
              <div style={styles.lockedBadge}>Unlocks Soon</div>
            </div>
          ))}
        </div>
      </section>

      {/* CIPHERNET */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🌐 CipherNet</h2>

        <div style={styles.card}>
          <p style={styles.text}>
            CipherNet turns knowledge into value.
          </p>

          <p style={styles.textMuted}>
            Dot Nodes. OmniSearch. Shared intelligence.
          </p>

          <p style={styles.textMuted}>
            When others access your nodes, you earn Cipher Coin.
          </p>

          <div style={styles.lockedBadge}>Not Live Yet</div>
        </div>
      </section>
    </div>
  );
}

/* ===============================
   STYLES
================================ */

const styles = {
  wrap: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#05050b,#0a0f2a)",
    color: "white",
    padding: "24px 18px 40px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 6,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 12,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  coinRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 10,
  },
  coinIcon: {
    fontSize: 26,
  },
  coinAmount: {
    fontSize: 24,
  },
  text: {
    fontSize: 14,
    marginBottom: 6,
  },
  textMuted: {
    fontSize: 13,
    opacity: 0.65,
    marginBottom: 6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))",
    gap: 12,
  },
  lockedCard: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 14,
    border: "1px dashed rgba(255,255,255,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
  },
  lockedTitle: {
    fontWeight: 700,
    fontSize: 14,
  },
  lockedBadge: {
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    opacity: 0.75,
    alignSelf: "flex-start",
  },
};
