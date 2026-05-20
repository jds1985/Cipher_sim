import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import { initializeCipher, generateResponse } from "../../lib/cipherEngine";

/* ===============================
   CONFIG
================================ */
const MEMORY_KEY = "cipher_local_history";
const MEMORY_LIMIT = 50;

export default function ChatPanel() {
  // Sovereign setup default states
  const [tier] = useState("builder");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Engine control tracking hooks
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Layout UI states
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showMemory, setShowMemory] = useState(false);

  // Token metric allocations (simulated client-side for structural UI backwards compatibility)
  const [remainingTokens, setRemainingTokens] = useState(2000000);
  const [tokenLimit] = useState(2000000);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

  /* ===============================
     1. LOCAL HISTORY INITIALIZATION
  ================================ */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) {
        setMessages(parsed.slice(-MEMORY_LIMIT));
      }
    } catch (err) {
      console.error("Failed to load local chat ground truth history:", err);
    }
  }, []);

  /* ===============================
     2. AUTOMATED SCROLL TRACING
  ================================ */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  /* ===============================
     3. COLD BOOT HARDWARE ENGINE
  ================================ */
  const bootLocalEngine = async () => {
    try {
      await initializeCipher((progress) => {
        setDownloadProgress(progress); // Feeds streaming weight download percentage to UI
      });
      setEngineLoaded(true);
    } catch (err) {
      console.error("Device graphics WebGPU initialization failed:", err);
    }
  };

  /* ===============================
     4. DATA PURGE / GROUND TRUTH CLEAN
  ================================ */
  function clearChat() {
    try {
      localStorage.removeItem(MEMORY_KEY);
    } catch {}
    setMessages([]);
    setSelectedIndex(null);
    setShowMemory(false);
  }

  function handleSelectMessage(i, options = {}) {
    setSelectedIndex((prev) => (prev === i ? prev : i));
    setShowMemory(!!options.openMemory);
  }

  /* ===============================
     5. LOCAL INFERENCE EXECUTION LOOP
  ================================ */
  async function sendMessage(options = {}) {
    if (sendingRef.current || !engineLoaded) return;

    const isQuickAction = Boolean(options.quickAction);
    const text = isQuickAction ? options.quickAction : input.trim();
    if (!text) return;

    sendingRef.current = true;
    setTyping(true);

    // Minor structural debounce to allow UI animation threads to register
    await new Promise((resolve) => setTimeout(resolve, 150));

    const userMessage = { role: "user", content: text };
    let currentHistory = [...messages, userMessage];

    if (!isQuickAction) {
      setInput("");
      setMessages((m) => [
        ...m,
        userMessage,
        { role: "assistant", content: "", modelUsed: "Cipher Substrate (Local)", memoryInfluence: [] },
      ]);
    }

    try {
      let streamedReply = "";

      // Trigger direct hardware tracing on device graphics via script pipeline
      await generateResponse(text, (incomingToken) => {
        streamedReply += incomingToken;

        setMessages((m) => {
          const next = [...m];
          next[next.length - 1].content = streamedReply;
          
          // Commit stream updates instantly to localized non-volatile browser storage
          if (typeof window !== "undefined") {
            localStorage.setItem(MEMORY_KEY, JSON.stringify(next.slice(-MEMORY_LIMIT)));
          }
          return next;
        });
      });

      // Deduct simulated token limits based on processed content lengths for metric display
      const wordCount = streamedReply.split(/\s+/).length;
      const estimatedTokensUsed = Math.ceil(wordCount * 1.3);
      setRemainingTokens((prev) => Math.max(0, prev - estimatedTokensUsed));

    } catch (e) {
      console.error("Client-side execution loop exception:", e);
    } finally {
      setTyping(false);
      sendingRef.current = false;
    }
  }

  return (
    <div className="cipher-wrap">
      {/* Top Navigation Wrapper */}
      <div className="cipher-floating-header">
        <HeaderMenu
          onOpenDrawer={() => setDrawerOpen(true)}
          onNewChat={clearChat}
        />
      </div>

      {/* Control Configuration Drawer */}
      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenLogin={() => setDrawerOpen(false)}
        onOpenSignup={() => setDrawerOpen(false)}
        roles={{ architect: "local", refiner: "local", polisher: "local" }}
        setRoles={() => {}}
        tier={tier}
        remainingTokens={remainingTokens}
        tokenLimit={tokenLimit}
      />

      {/* Main UI Chat Stage viewport */}
      <div className="cipher-main">
        <div className="cipher-chat">
          
          {/* Hardware Boot-Prompt: Renders only when model isn't active in WebGPU memory layout */}
          {!engineLoaded ? (
            <div className="backdrop-blur-md bg-slate-900/80 border border-slate-700/50 p-6 rounded-xl text-center max-w-sm mx-auto my-16 shadow-2xl">
              <h3 className="text-xl font-bold text-cyan-400 mb-2">Initialize Sovereign Engine</h3>
              <p className="text-xs text-slate-400 mb-6">
                Boot Cipher's custom ternary weights directly onto your local graphics hardware. 
                Once streamed, your processing engine functions completely offline.
              </p>
              
              {downloadProgress > 0 && (
                <div className="w-full bg-slate-800 h-2 rounded-full mb-4 overflow-hidden border border-slate-700/30">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300" 
                    style={{ width: `${downloadProgress}%` }} 
                  />
                </div>
              )}
              
              <button 
                onClick={bootLocalEngine} 
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-lg text-sm font-semibold transition shadow-lg shadow-cyan-950/50 text-white"
              >
                {downloadProgress > 0 ? `Caching Substrate... ${downloadProgress}%` : "Cold Boot Cipher"}
              </button>
            </div>
          ) : (
            /* Active Message Loop Stream */
            <MessageList
              messages={messages}
              bottomRef={bottomRef}
              onSelectMessage={handleSelectMessage}
              selectedIndex={selectedIndex}
              showMemory={showMemory}
              tier={tier}
              typing={typing}
              onQuickAction={(prompt, content) => {
                sendMessage({
                  quickAction: prompt,
                  target: content
                });
              }}
            />
          )}

        </div>
      </div>

      {/* Interactive Input Dashboard Strip */}
      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing || !engineLoaded}
      />
    </div>
  );
}
