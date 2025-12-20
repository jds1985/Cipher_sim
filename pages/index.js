import dynamic from 'next/dynamic';

// We use dynamic import with ssr: false to ensure the ChatPanel 
// only loads on your phone's browser, preventing Vercel build crashes.
const ChatPanel = dynamic(() => import("../components/chat/ChatPanel"), { 
  ssr: false 
});

export default function Home() {
  return (
    <main style={{ background: "black", minHeight: "100vh", color: "white" }}>
      <ChatPanel />
    </main>
  );
}
