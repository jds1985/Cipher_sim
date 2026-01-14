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

  // NEW: consumables
  getResetTokenCount,
  grantResetToken,
} from "../../components/chat/CipherCoin";

export default function Store() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  const [starterOwned, setStarterOwned] = useState(false);
  const [ledger, setLedger] = useState([]);

  // NEW
  const [resetTokens, setResetTokens] = useState(0);

  function refreshAll() {
    setCoinBalance(getCipherCoin());
    setStarterOwned(hasEntitlement("starter_pack"));
    setLedger(getLedger(12));
    setResetTokens(getResetTokenCount());
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
      setToast("✅ Starter Pack unlocked");
    } else if (res.reason === "already_owned") {
      setToast("Already owned.");
    } else {
      setToast("Not enough Cipher Coin.");
    }
  }

  // NEW: Buy reset token
  function handleBuyResetToken() {
    const COST = 10;
    if (coinBalance < COST) {
      setToast("Not enough Cipher Coin.");
      return;
    }

    grantResetToken(1);
    refreshAll();
    setToast("🧠 +1 Decipher Reset Token");
  }

  const starterCost = 25;
  const resetCost = 10;

  const canAffordStarter = coinBalance >= starterCost;
  const canAffordReset = coinBalance >= resetCost;

  const recentActivityText = useMemo(() => {
    if (!ledger || ledger.length === 0) return "No activity yet.";
    return null;
  }, [ledger]);

  return (
    <div style={styles.wrap}>
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

      {/* FEATURED */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🛒 Featured</h2>

        {/* Starter Pack */}
        <div style={styles.card}>
          <div style={styles.itemHeader}>
            <div>
              <div style={styles.itemTitle}>Starter Pack</div>
              <div style={styles.itemDesc}>
                Reduce Decipher cooldown by 50% (Free/Plus). Includes badge + early access.
              </div>
            </div>
            <div style={styles.pricePill}>🪙 {starterCost}</div>
          </div>

          <div style={{ height: 10 }} />

          {starterOwned ? (
            <button style={styles.ownedBtn} disabled>✅ Owned</button>
          ) : (
            <button
              style={{
                ...styles.primaryBtn,
                opacity: canAffordStarter ? 1 : 0.45,
              }}
              onClick={handleBuyStarterPack}
              disabled={!canAffordStarter}
            >
              Unlock Starter Pack
            </button>
          )}
        </div>

        <div style={{ height: 14 }} />

        {/* NEW: Reset Token */}
        <div style={styles.card}>
          <div style={styles.itemHeader}>
            <div>
              <div style={styles.itemTitle}>Decipher Reset Token</div>
              <div style={styles.itemDesc}>
                Instantly reset Decipher cooldown. Consumable. Stackable.
              </div>
              <div style={styles.textMuted}>
                Owned: {resetTokens}
              </div>
            </div>
            <div style={styles.pricePill}>🪙 {resetCost}</div>
          </div>

          <div style={{ height: 10 }} />

          <button
            style={{
              ...styles.primaryBtn,
              opacity: canAffordReset ? 1 : 0.45,
            }}
            onClick={handleBuyResetToken}
            disabled={!canAffordReset}
          >
            Buy Reset Token
          </button>
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>📜 Recent Activity</h2>
        <div style={styles.card}>
          {recentActivityText ? (
            <p style={styles.textMuted}>{recentActivityText}</p>
          ) : (
            ledger.map((e, idx) => (
              <div key={idx} style={styles.ledgerRow}>
                <div style={{ flex: 1 }}>
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

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

/* styles unchanged */
