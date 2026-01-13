// pages/store/index.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getCipherCoin,
  getLedger,
  rewardDaily,
  rewardEmailBonus,
  getUserEmail,
  hasEntitlement,
  purchaseStarterPack,
} from "../../components/chat/CipherCoin";

export default function Store() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  const [starterOwned, setStarterOwned] = useState(false);
  const [ledger, setLedger] = useState([]);

  function refreshAll() {
    setCoinBalance(getCipherCoin());
    setStarterOwned(hasEntitlement("starter_pack"));
    setLedger(getLedger(12));
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    // hydrate email field
    const existing = getUserEmail();
    if (existing) {
      setEmail(existing);
      setEmailSaved(true);
    }

    refreshAll();
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function handleClaimDaily() {
    const r = rewardDaily();
    if (r.ok) {
      refreshAll();
      setToast(`🪙 +${r.earned} Daily claimed`);
    } else {
      setToast("Daily already claimed. Come back tomorrow.");
    }
  }

  function handleSaveEmail() {
    const v = String(email || "").trim();
    if (!v) return setToast("Enter an email first.");

    const r = rewardEmailBonus(v);
    if (r.ok) {
      setEmailSaved(true);
      refreshAll();
      setToast(`🪙 +${r.earned} Email bonus`);
    } else if (r.reason === "already_claimed") {
      setEmailSaved(true);
      refreshAll();
      setToast("Email saved");
    } else {
      setToast("Couldn’t save email.");
    }
  }

  function handleBuyStarterPack() {
    const res = purchaseStarterPack();
    if (res.ok) {
      refreshAll();
      setToast(`✅ Starter Pack unlocked (-${res.cost})`);
    } else if (res.reason === "already_owned") {
      setToast("Already owned.");
    } else if (res.reason === "insufficient_funds") {
      setToast("Not enough Cipher Coin.");
    } else {
      setToast("Purchase failed.");
    }
  }

  const starterCost = 25;
  const canAffordStarter = coinBalance >= starterCost;

  const recentActivityText = useMemo(() => {
    if (!ledger || ledger.length === 0) return "No activity yet.";
    return null;
  }, [ledger]);

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
            Today: earn by sharing Cipher. <br />
            Tomorrow: earn by contributing knowledge through CipherNet.
          </p>
        </div>
      </section>

      {/* EARN */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>⚡ Earn</h2>

        <div style={styles.card}>
          <button style={styles.primaryBtn} onClick={handleClaimDaily}>
            Claim Daily (+1)
          </button>

          <div style={{ height: 10 }} />

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <div style={styles.textMuted}>Email Bonus (+5 once)</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={styles.input}
              />
            </div>
            <button style={styles.secondaryBtn} onClick={handleSaveEmail}>
              {emailSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* FIRST STORE ITEM */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🛒 Featured</h2>

        <div style={styles.card}>
          <div style={styles.itemHeader}>
            <div>
              <div style={styles.itemTitle}>Starter Pack</div>
              <div style={styles.itemDesc}>
                Reduce Decipher cooldown by 50% (Free/Plus). Includes Starter badge + early access flag.
              </div>
            </div>

            <div style={styles.pricePill}>
              <span style={{ fontSize: 14 }}>🪙</span>
              <span style={{ fontWeight: 800 }}>{starterCost}</span>
            </div>
          </div>

          <div style={{ height: 10 }} />

          {starterOwned ? (
            <button style={{ ...styles.ownedBtn }} disabled>
              ✅ Owned
            </button>
          ) : (
            <button
              style={{
                ...styles.primaryBtn,
                opacity: canAffordStarter ? 1 : 0.45,
                cursor: canAffordStarter ? "pointer" : "not-allowed",
              }}
              onClick={handleBuyStarterPack}
              disabled={!canAffordStarter}
            >
              Unlock Starter Pack
            </button>
          )}
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>📜 Recent Activity</h2>

        <div style={styles.card}>
          {recentActivityText ? (
            <p style={styles.textMuted}>{recentActivityText}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ledger.map((e, idx) => (
                <div key={idx} style={styles.ledgerRow}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.ledgerReason}>
                      {String(e.reason || e.type || "activity")}
                    </div>
                    <div style={styles.ledgerMeta}>
                      {new Date(e.ts).toLocaleString()}
                    </div>
                  </div>
                  <div style={styles.ledgerAmt}>
                    {e.amount > 0 ? `+${e.amount}` : `${e.amount}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CIPHERNET */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🌐 CipherNet</h2>

        <div style={styles.card}>
          <p style={styles.text}>CipherNet turns knowledge into value.</p>

          <p style={styles.textMuted}>Dot Nodes. OmniSearch. Shared intelligence.</p>

          <p style={styles.textMuted}>
            When others access your nodes, you earn Cipher Coin.
          </p>

          <div style={styles.lockedBadge}>Not Live Yet</div>
        </div>
      </section>

      {/* TOAST */}
      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}
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
    padding: "24px 18px 60px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
  },
  header: { marginBottom: 28 },
  title: { fontSize: 32, fontWeight: 900, marginBottom: 6 },
  subtitle: { opacity: 0.7, fontSize: 14 },

  section: { marginBottom: 26 },
  sectionTitle: { fontSize: 20, fontWeight: 800, marginBottom: 12 },

  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },

  coinRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 24,
    fontWeight: 900,
    marginBottom: 10,
  },
  coinIcon: { fontSize: 28 },
  coinAmount: { fontSize: 28 },

  text: { fontSize: 14, marginBottom: 6 },
  textMuted: { fontSize: 13, opacity: 0.7, marginBottom: 6, lineHeight: 1.35 },

  row: { display: "flex", gap: 10, alignItems: "center" },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    color: "white",
    outline: "none",
    marginTop: 8,
  },

  primaryBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(90deg,#6f7dff,#a06bff)",
    color: "white",
    fontWeight: 900,
    fontSize: 14,
  },

  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: 800,
    fontSize: 14,
    minWidth: 90,
  },

  ownedBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontWeight: 900,
    fontSize: 14,
    opacity: 0.9,
  },

  lockedBadge: {
    fontSize: 11,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    opacity: 0.8,
    alignSelf: "flex-start",
    display: "inline-block",
    marginTop: 6,
  },

  itemHeader: { display: "flex", gap: 12, justifyContent: "space-between" },
  itemTitle: { fontWeight: 900, fontSize: 18, marginBottom: 6 },
  itemDesc: { fontSize: 13, opacity: 0.72, lineHeight: 1.35, maxWidth: 520 },

  pricePill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    whiteSpace: "nowrap",
  },

  ledgerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },
  ledgerReason: { fontWeight: 800, fontSize: 13 },
  ledgerMeta: { fontSize: 11, opacity: 0.65, marginTop: 2 },
  ledgerAmt: { fontWeight: 900, fontSize: 13, opacity: 0.9 },

  toast: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 18,
    background: "rgba(10,10,20,0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "12px 14px",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    fontWeight: 800,
    fontSize: 13,
    zIndex: 9999,
    maxWidth: "92vw",
  },
};
