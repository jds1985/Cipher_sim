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
    });
    return () => unsub();
  }, []);

  if (!open) return null;

  async function handleLogout() {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  }

  const modelCycle = ["openai", "gemini", "anthropic"];

  function cycleRole(roleKey) {
    const currentIndex = modelCycle.indexOf(roles[roleKey]);
    const nextIndex = (currentIndex + 1) % modelCycle.length;
    setRoles((prev) => ({
      ...prev,
      [roleKey]: modelCycle[nextIndex],
    }));
  }

  function getModelLabel(model) {
    if (model === "openai") return "OpenAI";
    if (model === "gemini") return "Gemini";
    if (model === "anthropic") return "Anthropic";
    return model;
  }

  function getModelColor(model) {
    if (model === "openai") return "#5a46ff";
    if (model === "gemini") return "#00c2ff";
    if (model === "anthropic") return "#ff8a00";
    return "#666";
  }

  function RoleCircle({ label, roleKey }) {
    const model = roles[roleKey];

    return (
      <div style={{ textAlign: "center" }}>
        <div
          onClick={() => cycleRole(roleKey)}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${getModelColor(model)}, #111)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: `0 0 20px ${getModelColor(model)}88`,
            transition: "all 0.3s ease",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {getModelLabel(model)}
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      </div>
    );
  }

  const stackActive =
    roles.architect !== roles.refiner ||
    roles.refiner !== roles.polisher;

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
          background: "#0e0e14",
          color: "white",
          padding: 24,
          zIndex: 20001,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 20px rgba(0,0,0,0.5)",
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
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
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
                  padding: 8,
                  background: "#222",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
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
                  padding: 8,
                  marginBottom: 10,
                  background: "#222",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Log In
              </button>

              <button
                onClick={onOpenSignup}
                style={{
                  width: "100%",
                  padding: 8,
                  background: "#222",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
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
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 16 }}>
            Cognitive Mode
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
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
          onClick={onClose}
          style={{
            marginTop: "auto",
            padding: 10,
            background: "#1a1a22",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </>
  );
}
