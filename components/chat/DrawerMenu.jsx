import { useEffect, useState } from "react";
import { auth } from "../../lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function DrawerMenu({
  open,
  onClose,
  onOpenLogin,
  onOpenSignup,
  roles,
  setRoles
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setRoles((prev) => ({ ...prev }));
    });
    return () => unsub();
  }, [setRoles]);

  if (!open) return null;

  async function handleLogout() {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  }

  const isPro = !!user;
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
              width: 38,
              height: 38,
              objectFit: "contain",
              filter: "drop-shadow(0 0 6px rgba(255,255,255,0.35))",
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
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ margin: 0 }}>Cipher OS</h3>
        </div>

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
          {user ? (
            <>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#5a46ff,#00ffc8)",
                  marginBottom: 12,
                }}
              />
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

        <button
          onClick={() => {
            window.location.href = "/import";
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
