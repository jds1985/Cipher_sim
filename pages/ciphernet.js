import dynamic from "next/dynamic";

// 🚀 Prevent SSR crash completely
const CipherNetMap = dynamic(
  () => import("../components/CipherNetMap"),
  { ssr: false }
);

export default function CipherNetPage() {
  try {
    return <CipherNetMap />;
  } catch (err) {
    console.error("CipherNet crash:", err);

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "black",
          color: "white",
          fontFamily: "sans-serif"
        }}
      >
        CipherNet failed to load ⚠️
      </div>
    );
  }
}
