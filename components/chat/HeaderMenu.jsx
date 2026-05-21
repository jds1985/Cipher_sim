import { useEffect, useState } from "react";

export default function HeaderMenu({ onOpenDrawer, onNewChat }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check local storage ground truth for access authorization instead of remote Firebase auth
    if (typeof window !== "undefined") {
      const hasAccess = localStorage.getItem("cipher_dev_access") === "granted";
      if (hasAccess) {
        setUser({ email: "Architect" }); // Simulated local profile to cleanly preserve UI layout bounds
      }
    }
  }, []);

  return (
    <>
      {/* FLOATING LEFT — LOGO */}
      <div className="cipher-float-left">
        <div className="cipher-logo-wrap floating">
          <img
            src="/logo.png"
            alt="Cipher OS"
            className="cipher-logo"
          />
        </div>
      </div>

      {/* FLOATING RIGHT — CONTROLS */}
      <div className="cipher-float-right">
        {onNewChat && (
          <button className="cipher-float-btn" onClick={onNewChat}>
            New
          </button>
        )}

        {user ? (
          <div
            onClick={onOpenDrawer}
            className="cipher-profile-float"
            title={user.email}
          >
            {user.email?.charAt(0).toUpperCase()}
          </div>
        ) : (
          <button
            className="cipher-float-btn primary"
            onClick={onOpenDrawer}
          >
            Menu
          </button>
        )}
      </div>
    </>
  );
}
