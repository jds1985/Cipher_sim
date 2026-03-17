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

      <button
  onClick={async () => {
    try {
      if (!auth.currentUser) {
        alert("You must be logged in");
        return;
      }

      const token = await auth.currentUser.getIdToken();

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "pro" }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.log(data);
        alert("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      alert("Something broke — check console");
    }
  }}
>
  🔥 TEST CHECKOUT
</button>

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



