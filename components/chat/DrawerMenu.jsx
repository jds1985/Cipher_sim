import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function DrawerMenu({
  open,
  onClose,
  onOpenLogin,
  onOpenSignup,
  roles,
  setRoles,
  tier = "builder", // Default to sovereign builder settings
  remainingTokens = 2000000,
  tokenLimit = 2000000
}) {
  const [user] = useState({ email: "Sovereign.User@local" });
  const [liveTier] = useState("builder");
  const router = useRouter();

  if (!open) return null;

  // Static assignments for local rendering compatibility
  const tokenPercent = Math.min(
    100,
    Math.round(((tokenLimit - remainingTokens) / Math.max(tokenLimit, 1)) * 100)
  );

  function getModelColor() {
    return "#00c2ff"; // Cipher Cyan
  }

  function RoleCircle({ label }) {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${getModelColor()}, #111)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 35px ${getModelColor()}55, 0 0 60px ${getModelColor()}22`,
            transition: "all 0.3s ease",
            marginBottom: 8,
            position: "relative"
          }}
        >
          <div
            style={{
              color: "#fff",
              fontSize: "10px",
              fontWeight: "bold",
              letterSpacing: "0.5px",
              opacity: 0.9,
              textShadow: "0 0 8px rgba(0, 194, 255, 0.8)"
            }}
          >
            CIPHER
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Background Mask */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 20000,
        }}
        onClick={onClose}
      />

      {/* Control Surface Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 300,
          height: "100%",
          background: "linear-gradient(to bottom, rgba(10,14,30,0.96), rgba(6,10,22,0.98))",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 36px",
              alignItems: "center",
              columnGap: 12,
              marginBottom: 12,
            }}
          >
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
              }}
            >
              C
            </div>

            <h3 style={{ margin: 0, textAlign: "center" }}>Cipher OS</h3>
            <div style={{ width: 36, height: 36 }} />
          </div>

          <div style={{ fontSize: 12, opacity: 0.6, textAlign: "center", marginTop: 14 }}>
            SOVEREIGN NODE ACTIVE
          </div>
        </div>

        {/* RESOURCE DISPLAY */}
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
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Available Local Cache</div>

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
            {remainingTokens.toLocaleString()} processing metrics loaded
          </div>
        </div>

        {/* NODE PROFILE */}
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
          <div style={{ fontSize: 14, opacity: 0.8 }}>Identity Node</div>
          <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{user.email}</div>
        </div>

        {/* SYSTEM PROCESSING COGNITIVE STACK */}
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
          <div style={{ fontWeight: 600, marginBottom: 16 }}>On-Device Processing Nodes</div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <RoleCircle label="Architect" />
            <RoleCircle label="Refiner" />
            <RoleCircle label="Polisher" />
          </div>

          <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7, textAlign: "center" }}>
            Substrate Layer Integration Active
          </div>
        </div>

        {/* INTEGRATED APPLICATION MODULES */}
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
          <div style={{ fontWeight: 600, marginBottom: 14, opacity: 0.85 }}>Sovereign Ecosystem</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => {
                router.push("/ciphernet");
                onClose();
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(90,70,255,0.25)",
                border: "1px solid rgba(90,70,255,0.55)",
                fontSize: 13,
                letterSpacing: ".4px",
                cursor: "pointer",
                color: "white",
                textAlign: "left"
              }}
            >
              🌌 CipherNet
            </button>

            <button
              onClick={() => {
                router.push("/shopstream");
                onClose();
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(0,255,200,0.18)",
                border: "1px solid rgba(0,255,200,0.55)",
                fontSize: 13,
                letterSpacing: ".4px",
                cursor: "pointer",
                color: "white",
                textAlign: "left"
              }}
            >
              🛍️ ShopStream
            </button>
          </div>
        </div>

        {/* ACTIONS */}
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
            boxShadow: "0 0 25px rgba(90,70,255,0.4), 0 0 45px rgba(0,255,213,0.25)",
          }}
        >
          Import Local Cache
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
          Close Drawer
        </button>
      </div>
    </div>
  );
}
