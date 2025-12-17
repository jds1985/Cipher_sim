import ChatPanel from "../components/chat/ChatPanel";

export default function Home() {
  return (
    <div
      style={{
        background: "black",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <ChatPanel />
    </div>
  );
}
