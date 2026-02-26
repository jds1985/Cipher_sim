import { useEffect, useState } from "react";
import { auth } from "../../lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function DrawerMenu({ open, onClose }) {
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
          width: 280,
          height: "100%",
          background: "#0e0e14",
          color: "white",
          padding: 24,
          zIndex: 20001,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 20px rgba(0,0,0,0.5)",
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
            <div style={{ opacity: 0.7 }}>
              Not signed in
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
