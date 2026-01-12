// components/chat/DrawerMenu.jsx
import { useState } from "react";

export default function DrawerMenu({
  open,
  onClose,
  cipherCoin = 0,
  email = null,

  onOpenStore,
  onInvite,

  // NEW hooks
  onResetDecipher,
  onUnlockStarterPack,
  onSaveEmail,
}) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [emailDraft, setEmailDraft] = useState(email || "");

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={styles.header}>
          <span style={styles.title}>{showExplainer ? "Cipher Coin" : "Profile"}</span>
          <button
            style={styles.close}
            onClick={() => {
              if (showExplainer) setShowExplainer(false);
              else onClose?.();
            }}
          >
            ✕
          </button>
        </div>

        {!showExplainer && (
          <>
            {/* ACCOUNT */}
            <div style={styles.section}>
              <div style={styles.label}>Account</div>
              <div style={styles.value}>{email || "Guest"}</div>
            </div>

            {/* COIN */}
            <div style={styles.section}>
              <div style={styles.label}>Cipher Coin</div>
              <div style={styles.coinRow}>
                <span style={styles.coin}>🪙</span>
                <span style={styles.value}>{cipherCoin}</span>
              </div>
            </div>

            {/* EMAIL BONUS */}
            <div style={styles.section}>
              <div style={styles.label}>Email bonus (+5 once)</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder="you@email.com"
                  style={styles.input}
                />
                <button
                  style={styles.smallBtn}
                  onClick={() => onSaveEmail?.(emailDraft)}
                >
                  Save
                </button>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={styles.section}>
              <button style={styles.primary} onClick={() => onInvite?.()}>
                Invite friends (earn coins)
              </button>

              <button style={styles.secondary} onClick={() => setShowExplainer(true)}>
                How Cipher Coin works
              </button>

              <button style={styles.secondary} onClick={() => onOpenStore?.()}>
                Open Store
              </button>
            </div>

            {/* SPEND */}
            <div style={styles.section}>
              <div style={styles.label}>Spend Cipher Coin</div>

              <button style={styles.secondary} onClick={() => onResetDecipher?.()}>
                Reset Decipher cooldown (10)
              </button>

              <button style={styles.secondary} onClick={() => onUnlockStarterPack?.()}>
                Unlock Starter Pack (25)
              </button>
            </div>
          </>
        )}

        {showExplainer && (
          <div style={styles.explainer}>
            <p>
              <strong>Cipher Coin</strong> is earned by sharing Cipher and inviting others.
            </p>
            <p>Coins unlock themes, features, and perks inside Cipher.</p>
            <p style={{ opacity: 0.7 }}>
              This system is designed to reward early supporters — not ads.
            </p>

            <button style={styles.secondary} onClick={() => setShowExplainer(false)}>
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9998,
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 320,
    height: "100%",
    background: "linear-gradient(180deg,#0a0f2a,#05050b)",
    color: "white",
    padding: 18,
    boxShadow: "-10px 0 30px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 1,
  },
  close: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 15,
    fontWeight: 700,
  },
  coinRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  coin: {
    fontSize: 18,
  },
  primary: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondary: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "white",
    fontWeight: 650,
    cursor: "pointer",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    outline: "none",
  },
  smallBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },
  explainer: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontSize: 14,
    lineHeight: 1.5,
  },
};
