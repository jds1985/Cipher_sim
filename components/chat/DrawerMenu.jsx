import { useEffect, useState } from "react";
import { auth } from "../../lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function DrawerMenu({
  open,
  onClose,
  onOpenLogin,
  onOpenSignup,
  roleMode,
  setRoleMode,
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

  function updateRole(key, value) {
    setRoles((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  const modelOptions = [
    { label: "OpenAI", value: "openai" },
    { label: "Gemini", value: "gemini" },
    { label: "Anthropic", value: "anthropic" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 20000,
        }}
        onClick={onClose}
      />

      {/* Drawer */}
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
        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ margin: 0 }}>Cipher OS</h3>
        </div>

        {/* Profile Section */}
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

        {/* Role Mode Section */}
        <div
          style={{
            marginBottom: 30,
            padding: 16,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 10 }}>
            Cognitive Mode
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={roleMode}
              onChange={() => setRoleMode((v) => !v)}
            />
            Enable Role Stack
          </label>

          {roleMode && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Architect</div>
                <select
                  value={roles.architect}
                  onChange={(e) => updateRole("architect", e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  {modelOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Refiner</div>
                <select
                  value={roles.refiner}
                  onChange={(e) => updateRole("refiner", e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  {modelOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Polisher</div>
                <select
                  value={roles.polisher}
                  onChange={(e) => updateRole("polisher", e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  {modelOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
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
