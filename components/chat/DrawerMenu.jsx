import { useEffect, useState } from "react";
import { auth } from "../../lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function DrawerMenu({
  open,
  onClose,
  onOpenLogin,
  onOpenSignup,
  roles,
  setRoles,
  tier = "free",
  remainingTokens = 0,
  tokenLimit = 1
}) {
  const [user, setUser] = useState(null);
  const [liveTier, setLiveTier] = useState(tier);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokenLimitState, setTokenLimitState] = useState(1);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setLiveTier("free");
        setTokensUsed(0);
        setTokenLimitState(1000000);
        if (typeof window !== "undefined") {
          localStorage.removeItem("tier");
        }
        return;
      }

      setRoles((prev) => ({ ...prev }));

      if (u?.email) {
        try {
          const res = await fetch(`/api/get-tier?email=${u.email}&t=${Date.now()}`);
          const data = await res.json();

          setLiveTier(data.tier || "free");
          setTokensUsed(data.tokensUsed || 0);
          setTokenLimitState(data.tokenLimit || 1000000);
        } catch (err) {
          console.error("Tier fetch error:", err);
          setLiveTier("free");
          setTokensUsed(0);
          setTokenLimitState(1000000);
        }
      }
    });

    return () => unsub();
  }, [setRoles]);

  useEffect(() => {
    async function refreshTierData() {
      if (!open || !auth.currentUser?.email) return;

      try {
        const res = await fetch(
          `/api/get-tier?email=${auth.currentUser.email}&t=${Date.now()}`
        );
        const data = await res.json();

        setLiveTier(data.tier || "free");
        setTokensUsed(data.tokensUsed || 0);
        setTokenLimitState(data.tokenLimit || 1000000);
      } catch (err) {
        console.error("Drawer refresh tier error:", err);
      }
    }

    refreshTierData();
  }, [open]);

  if (!open) return null;

  async function handleLogout() {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  }

  async function startCheckout(plan) {
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        if (typeof window !== "undefined") {
          window.location.href = data.url;
        }
      } else {
        alert("Checkout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting checkout");
    }
  }

  const isPro = liveTier === "pro" || liveTier === "builder";
  const modelCycle = ["openai", "gemini", "anthropic"];

  function cycleRole(roleKey) {
    if (!isPro && roleKey !== "architect") {
      alert("Upgrade required for multi-model stack.");
      return;
    }

    const currentIndex = modelCycle.indexOf(roles[roleKey]);
    const nextIndex = (currentIndex + 1) % modelCycle.length;

    setRoles((prev) => ({
      ...prev,
      [roleKey]: modelCycle[nextIndex],
    }));
  }

  function getModelColor(model) {
    if (model === "openai") return "#5a46ff";
    if (model === "gemini") return "#00c2ff";
    if (model === "anthropic") return "#ff8a00";
    return "#666";
  }

  function getModelLogo(model) {
    return `/images/${model}.png`;
  }

  function RoleCircle({ label, roleKey }) {
    const model = roles[roleKey];
    const locked = !isPro && roleKey !== "architect";

    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          key={model}
          onClick={() => cycleRole(roleKey)}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${getModelColor(model)}, #111)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: locked ? "not-allowed" : "pointer",
            boxShadow: locked
              ? "none"
              : `0 0 35px ${getModelColor(model)}55, 0 0 60px ${getModelColor(model)}22`,
            transition: "all 0.3s ease",
            marginBottom: 8,
            opacity: locked ? 0.35 : 1,
          }}
        >
          <img
            src={getModelLogo(model)}
            alt={model}
            style={{
              position: "absolute",
              width: "140%",
              height: "140%",
              objectFit: "contain",
              transform: "scale(1.1)",
              filter: "drop-shadow(0 0 4px rgba(255,255,255,0.18))",
              pointerEvents: "none"
            }}
          />
        </div>

        {locked && (
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 0,
              right: 0,
              fontSize: 11,
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            🔒
          </div>
        )}

        <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      </div>
    );
  }

  const stackActive = new Set([
    roles.architect,
    roles.refiner,
    roles.polisher,
  ]).size > 1;

  const tokenPercent = Math.min(
    100,
    Math.round((tokensUsed / Math.max(tokenLimitState, 1)) * 100)
  );

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 20000,
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 300,
          height: "100%",
          background:
            "linear-gradient(to bottom, rgba(10,14,30,0.96), rgba(6,10,22,0.98))",
          backdropFilter: "blur(26px)",
          WebkitBackdropFilter: "blur(26px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          color: "white",
          padding: 24,
          zIndex: 20001,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-12px 0 60px rgba(0,255,200,0.12)",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: 30, textAlign: "center" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              minHeight: 36,
            }}
          >
            {user && (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#5a46ff,#00ffd5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}

            <h3
              style={{
                margin: 0,
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                width: "100%",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              Cipher OS
            </h3>
          </div>

          <div
            style={{
              marginBottom: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => startCheckout("pro")}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: "#222",
                color: "white",
                fontSize: 11
              }}
            >
              Pro
            </button>

            <button
              onClick={() => startCheckout("builder")}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: "#222",
                color: "white",
                fontSize: 11
              }}
            >
              Builder
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
            {liveTier.toUpperCase()} TIER
          </div>
        </div>

        {/* TOKEN METER */}
        <div
          style={{
            marginBottom: 30,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            backdropFilter: "blur(18px)",
            boxShadow: "0 0 30px rgba(0,255,200,0.08)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Token Usage
          </div>

          <div
            style={{
              height: 10,
              borderRadius: 10,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: `${tokenPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg,#5a46ff,#00ffd5)",
              }}
            />
          </div>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {(tokenLimitState - tokensUsed).toLocaleString()} remaining
          </div>
        </div>

        {/* ACCOUNT */}
        <div
          style={{
            marginBottom: 30,
            padding: 16,
            position: "relative",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            backdropFilter: "blur(18px)",
            boxShadow: "0 0 30px rgba(0,255,200,0.08)",
          }}
        >
          {user ? (
            <>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Signed in as
              </div>
              <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                {user.email}
              </div>

              <button
                onClick={handleLogout}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: 10,
                  background: "linear-gradient(135deg,#5a46ff,#00ffd5)",
                  border: "none",
                  borderRadius: 16,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <div style={{ opacity: 0.7, marginBottom: 16 }}>
                Not signed in
              </div>

              <button
                onClick={onOpenLogin}
                style={{
                  width: "100%",
                  padding: 10,
                  marginBottom: 10,
                  background: "linear-gradient(135deg,#5a46ff,#00ffd5)",
                  border: "none",
                  borderRadius: 16,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Log In
              </button>

              <button
                onClick={onOpenSignup}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 16,
                  cursor: "pointer",
                  backdropFilter: "blur(14px)",
                  color: "white",
                }}
              >
                Create Account
              </button>
            </>
          )}
        </div>

        {/* COGNITIVE STACK */}
        <div
          style={{
            marginBottom: 30,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            backdropFilter: "blur(18px)",
            boxShadow: "0 0 30px rgba(0,255,200,0.08)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 16 }}>
            Cognitive Stack
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <RoleCircle label="Architect" roleKey="architect" />
            <RoleCircle label="Refiner" roleKey="refiner" />
            <RoleCircle label="Polisher" roleKey="polisher" />
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 12,
              opacity: 0.7,
              textAlign: "center",
            }}
          >
            {stackActive ? "Role Stack Active" : "Single Model Mode"}
          </div>
        </div>

        {/* FUTURE SYSTEMS */}
        <div
          style={{
            marginBottom: 30,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            backdropFilter: "blur(18px)",
            boxShadow: "0 0 30px rgba(0,255,200,0.08)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 14, opacity: 0.85 }}>
            Future Systems
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(90,70,255,0.15)",
                border: "1px solid rgba(90,70,255,0.35)",
                fontSize: 13,
                letterSpacing: ".4px"
              }}
            >
              CipherNet <span style={{ opacity: 0.6 }}>• Coming Soon</span>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(0,255,200,0.12)",
                border: "1px solid rgba(0,255,200,0.35)",
                fontSize: 13,
                letterSpacing: ".4px"
              }}
            >
              ShopStream <span style={{ opacity: 0.6 }}>• Coming Soon</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/import";
            }
          }}
          style={{
            width: "100%",
            padding: 12,
            background: "linear-gradient(135deg,#5a46ff,#00ffd5)",
            border: "none",
            borderRadius: 16,
            cursor: "pointer",
            fontWeight: 600,
            marginBottom: 12,
            boxShadow:
              "0 0 25px rgba(90,70,255,0.4), 0 0 45px rgba(0,255,213,0.25)",
          }}
        >
          Import History
        </button>

        <button
          onClick={onClose}
          style={{
            marginTop: "auto",
            padding: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 16,
            cursor: "pointer",
            backdropFilter: "blur(14px)",
            color: "white",
          }}
        >
          Close
        </button>
      </div>
    </>
  );
}
