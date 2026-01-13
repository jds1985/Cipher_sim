// pages/store/index.jsx
import { useEffect, useState } from "react";
import {
  getCipherCoin,
  rewardDaily,
  rewardEmailBonus,
  getLedger,
} from "../../components/chat/CipherCoin";

export default function Store() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCoinBalance(getCipherCoin());
    setLedger(getLedger(5));
  }, []);

  function refresh() {
    setCoinBalance(getCipherCoin());
    setLedger(getLedger(5));
  }

  function handleDaily() {
    const res = rewardDaily();
    if (res.ok) {
      alert(`+${res.earned} Cipher Coin earned`);
      refresh();
    } else {
      alert("Daily already claimed. Come back tomorrow.");
    }
  }

  function handleEmailBonus() {
    const res = rewardEmailBonus(email);
    if (res.ok) {
      alert(`+${res.earned} Cipher Coin earned`);
      refresh();
    } else {
      alert("Email bonus already claimed.");
    }
  }

  return (
    <div style={styles.wrap}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.title}>Store</h1>
        <p style={styles.subtitle}>The Cipher economy lives here.</p>
      </header>

      {/* CIPHER COIN */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🪙 Cipher Coin</h2>

        <div style={styles.card}>
          <div style={styles.coinRow}>
            <span style={styles.coinIcon}>🪙</span>
            <span style={styles.coinAmount}>{coinBalance}</span>
          </div>

          <p style={styles.text}>Cipher Coin is earned — not bought.</p>

          <p style={styles.textMuted}>
            Today: earn by sharing Cipher.<br />
            Tomorrow: earn by contributing knowledge through CipherNet.
          </p>
        </div>
      </section>

      {/* EARN */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>⚡ Earn</h2>

        <div style={styles.card}>
          <button style={styles.action} onClick={handleDaily}>
            Claim Daily (+1)
          </button>

          <div style={{ marginTop: 14 }}>
            <div style={styles.label}>Email Bonus (+5 once)</div>
            <div style={styles.emailRow}>
              <input
                style={styles.input}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button style={styles.secondary} onClick={handleEmailBonus}>
                Save
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LEDGER */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>📜 Recent Activity</h2>

        <div style={styles.card}>
          {ledger.length === 0 && (
            <p style={styles.textMuted}>No activity yet.</p>
          )}

          {ledger.map((e, i) => (
            <div key={i} style={styles.ledgerRow}>
              <span style={styles.ledgerReason}>{e.reason}</span>
              <span
                style={{
                  color: e.amount > 0 ? "#8cffc1" : "#ff8c8c",
                  fontWeight: 700,
                }}
              >
                {e.amount > 0 ? `+${e.amount}` : e.amount}
              </span>
            </div>
          ))}
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
          <p style={styles.text}>CipherNet turns knowledge into value.</p>

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
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 6 },
  subtitle: { opacity: 0.7, fontSize: 14 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
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
  coinIcon: { fontSize: 26 },
  coinAmount: { fontSize: 24 },
  text: { fontSize: 14, marginBottom: 6 },
  textMuted: { fontSize: 13, opacity: 0.65, marginBottom: 6 },

  action: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  emailRow: {
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.4)",
    color: "white",
  },
  ledgerRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  ledgerReason: { opacity: 0.75 },

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
  },
  lockedTitle: { fontWeight: 700, fontSize: 14 },
  lockedBadge: {
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    opacity: 0.75,
    display: "inline-block",
    marginTop: 6,
  },
};
