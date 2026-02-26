import { useEffect, useState } from "react";
import { auth } from "../../lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function HeaderMenu({ onOpenDrawer, onNewChat }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  return (
    <header className="cipher-header">
      {/* LEFT → LOGO */}
      <div className="cipher-logo-wrap">
        <img
          src="/logo.png"
          alt="Cipher OS"
          className="cipher-logo"
        />
      </div>

      {/* RIGHT → BUTTONS */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onNewChat && (
          <button className="cipher-btn-secondary" onClick={onNewChat}>
            New
          </button>
        )}

        {/* Profile Circle (if logged in) */}
        {user ? (
          <div
            onClick={onOpenDrawer}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#5a46ff,#00ffc8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
            title={user.email}
          >
            {user.email?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <button
            className="cipher-btn-primary"
            onClick={onOpenDrawer}
          >
            Menu
          </button>
        )}
      </div>
    </header>
  );
}
