export default function Success() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(3,3,10,0.88), rgba(3,3,10,0.96)), url('/images/cipher-cts-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Orbitron, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "rgba(10,10,20,0.78)",
          border: "1px solid rgba(139,102,255,0.25)",
          borderRadius: "28px",
          padding: "50px 30px",
          backdropFilter: "blur(18px)",
          boxShadow: "0 0 40px rgba(116,70,255,0.18)",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Glow Orb */}
        <div
          style={{
            width: "140px",
            height: "140px",
            margin: "0 auto 30px auto",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,204,0.9) 0%, rgba(116,70,255,0.6) 45%, rgba(0,0,0,0) 75%)",
            filter: "blur(2px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 0 45px rgba(0,255,204,0.35)",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "#02030a",
              border: "2px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "38px",
            }}
          >
            ✓
          </div>
        </div>

        <div
          style={{
            color: "#00ffcc",
            fontSize: "12px",
            letterSpacing: "4px",
            marginBottom: "18px",
          }}
        >
          NODE RESERVATION COMPLETE
        </div>

        <h1
          style={{
            fontSize: "46px",
            lineHeight: "1.1",
            marginBottom: "18px",
            color: "#ffffff",
            textShadow: "0 0 18px rgba(116,70,255,0.45)",
          }}
        >
          FOUNDING NODE
          <br />
          RESERVED
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: "16px",
            lineHeight: "1.8",
            maxWidth: "500px",
            margin: "0 auto 35px auto",
          }}
        >
          Welcome to the Cipher Mesh.
          <br />
          Your node has been registered inside the founding network layer.
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              color: "#8b66ff",
              fontSize: "13px",
              letterSpacing: "2px",
              marginBottom: "10px",
            }}
          >
            STATUS
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              color: "#00ffcc",
              fontSize: "15px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#00ffcc",
                boxShadow: "0 0 12px #00ffcc",
              }}
            />

            CONNECTED TO FOUNDING LAYER
          </div>
        </div>

        <a
          href="/launch.html"
          style={{
            display: "inline-block",
            padding: "16px 28px",
            borderRadius: "16px",
            textDecoration: "none",
            background: "linear-gradient(135deg, #7446ff, #4a1dff)",
            color: "white",
            fontWeight: "700",
            fontSize: "14px",
            letterSpacing: "2px",
            boxShadow: "0 10px 30px rgba(74,29,255,0.35)",
          }}
        >
          RETURN TO LAUNCH PAGE
        </a>
      </div>
    </div>
  );
}
