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
  getResetTokenCount,
  grantResetToken,
  devGrantCipherCoin,
} from "../../components/chat/CipherCoin";

export default function Store() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [toast, setToast] = useState(null);

  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  const [starterOwned, setStarterOwned] = useState(false);
  const [resetTokens, setResetTokens] = useState(0);

  function refreshAll() {
    setCoinBalance(getCipherCoin());
    setStarterOwned(hasEntitlement("starter_pack"));
    setResetTokens(getResetTokenCount());
    setLedger(getLedger(12));
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = getUserEmail();
    if (existing) {
      setEmail(existing);
      setEmailSaved(true);
    }

    refreshAll();
  }, []);

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
      setToast("Email saved");
    }
  }

  function handleBuyStarterPack() {
    const res = purchaseStarterPack();
    if (res.ok) {
      refreshAll();
      setToast("✅ Starter Pack unlocked");
    } else if (res.reason === "already_owned") {
      setToast("Already owned.");
    } else {
      setToast("Not enough Cipher Coin.");
    }
  }

  function handleBuyResetToken() {
    const COST = 10;
    if (coinBalance < COST) return setToast("Not enough Cipher Coin.");
    grantResetToken(1);
    refreshAll();
    setToast("🧠 +1 Decipher Reset Token");
  }

  const starterCost = 25;
  const resetCost = 10;

  const recentActivityText = useMemo(
    () => (!ledger.length ? "No activity yet." : null),
    [ledger]
  );

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <h1 style={styles.title}>Store</h1>
        <p style={styles.subtitle}>The Cipher economy lives here.</p>
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🪙 Cipher Coin</h2>
        <div style={styles.card}>
          <div style={styles.coinRow}>
            <span style={styles.coinIcon}>🪙</span>
            <span style={styles.coinAmount}>{coinBalance}</span>
          </div>
          <p style={styles.text}>Cipher Coin is earned — not bought.</p>
        </div>
      </section>

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

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🛒 Featured</h2>

        <div style={styles.card}>
          <div style={styles.itemHeader}>
            <div>
              <div style={styles.itemTitle}>Starter Pack</div>
              <div style={styles.itemDesc}>
                Reduce Decipher cooldown by 50%. Includes badge + early access.
              </div>
            </div>
            <div style={styles.pricePill}>🪙 {starterCost}</div>
          </div>

          <div style={{ height: 10 }} />

          {starterOwned ? (
            <button style={styles.ownedBtn} disabled>✅ Owned</button>
          ) : (
            <button
              style={styles.primaryBtn}
              onClick={handleBuyStarterPack}
              disabled={coinBalance < starterCost}
            >
              Unlock Starter Pack
            </button>
          )}
        </div>

        <div style={{ height: 14 }} />

        <div style={styles.card}>
          <div style={styles.itemHeader}>
            <div>
              <div style={styles.itemTitle}>Decipher Reset Token</div>
              <div style={styles.itemDesc}>Instantly reset Decipher cooldown.</div>
              <div style={styles.textMuted}>Owned: {resetTokens}</div>
            </div>
            <div style={styles.pricePill}>🪙 {resetCost}</div>
          </div>

          <div style={{ height: 10 }} />

          <button
            style={styles.primaryBtn}
            onClick={handleBuyResetToken}
            disabled={coinBalance < resetCost}
          >
            Buy Reset Token
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>📜 Recent Activity</h2>
        <div style={styles.card}>
          {recentActivityText ? (
            <p style={styles.textMuted}>{recentActivityText}</p>
          ) : (
            ledger.map((e, idx) => (
              <div key={idx} style={styles.ledgerRow}>
                <div>
                  <div style={styles.ledgerReason}>{e.reason}</div>
                  <div style={styles.ledgerMeta}>
                    {new Date(e.ts).toLocaleString()}
                  </div>
                </div>
                <div style={styles.ledgerAmt}>
                  {e.amount > 0 ? `+${e.amount}` : e.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {process.env.NODE_ENV !== "production" && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🧪 Dev Tools</h2>
          <div style={styles.card}>
            <button
              style={styles.primaryBtn}
              onClick={() => {
                devGrantCipherCoin(1000);
                refreshAll();
                setToast("🧪 +1000 Cipher Coin");
              }}
            >
              Grant 1000 Cipher Coin
            </button>
          </div>
        </section>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
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
    fontFamily: "system-ui",
  },
  header: { marginBottom: 28 },
  title: { fontSize: 32, fontWeight: 900 },
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
  coinRow: { display: "flex", gap: 10, fontSize: 24, fontWeight: 900 },
  coinIcon: { fontSize: 28 },
  coinAmount: { fontSize: 28 },
  text: { fontSize: 14 },
  textMuted: { fontSize: 13, opacity: 0.7 },
  row: { display: "flex", gap: 10, alignItems: "center" },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    background: "rgba(0,0,0,0.25)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  primaryBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    background: "linear-gradient(90deg,#6f7dff,#a06bff)",
    border: "none",
    color: "white",
    fontWeight: 900,
  },
  secondaryBtn: {
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    fontWeight: 800,
  },
  ownedBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.18)",
    fontWeight: 900,
  },
  itemHeader: { display: "flex", justifyContent: "space-between", gap: 12 },
  itemTitle: { fontSize: 18, fontWeight: 900 },
  itemDesc: { fontSize: 13, opacity: 0.75 },
  pricePill: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    fontWeight: 800,
  },
  ledgerRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    marginBottom: 8,
  },
  ledgerReason: { fontWeight: 800 },
  ledgerMeta: { fontSize: 11, opacity: 0.6 },
  ledgerAmt: { fontWeight: 900 },
  toast: {
    position: "fixed",
    bottom: 18,
    left: "50%",
    transform: "translateX(-50%)",
    padding: 12,
    borderRadius: 14,
    background: "rgba(10,10,20,0.95)",
    fontWeight: 800,
    zIndex: 9999,
  },
};
