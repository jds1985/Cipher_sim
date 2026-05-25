import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import { bootCipherEngine, generateCipherResponse } from "../../lib/cipherEngine";

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
  const [isStreaming, setIsStreaming] = useState(false);

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
      // 🧼 FORCED SUBSTRATE CACHE FLUSH: Wipes old configs clean out of the client container
      if (typeof window !== "undefined" && window.caches) {
        await caches.delete('transformers-cache');
        console.log("Stale client substrate cache cleanly expunged.");
      }

      // Initialize visual progress layout state
      setIsStreaming(false);
      setDownloadProgress(5);

      // Explicitly passing the progress callback inside a configuration object to the IndexedDB engine
      await bootCipherEngine({
        onProgress: (progressValue) => {
          if (progressValue === "STREAMING_ACTIVE") {
            setIsStreaming(true);
            setDownloadProgress(15);
          } else {
            setDownloadProgress(progressValue);
          }
        }
      });
      
      setIsStreaming(false);
      setEngineLoaded(true);
    } catch (err) {
      setIsStreaming(false);
      console.error("Device graphics WebGPU initialization failed:", err);
      alert("Boot Error: " + (err.message || err.toString() || "Unknown Initialization Exception"));
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

    if (!isQuickAction) {
      setInput("");
      setMessages((m) => [
        ...m,
        userMessage,
        { role: "assistant", content: "", modelUsed: "Cipher Substrate (Local)", memoryInfluence: [] },
      ]);
    }

    try {
      const streamedReply = await generateCipherResponse(text);

      setMessages((m) => {
        const next = [...m];
        next[next.length - 1].content = streamedReply;
        
        if (typeof window !== "undefined") {
          localStorage.setItem(MEMORY_KEY, JSON.stringify(next.slice(-MEMORY_LIMIT)));
        }
        return next;
      });

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
      <div className="cipher-floating-header">
        <HeaderMenu
          onOpenDrawer={() => setDrawerOpen(true)}
          onNewChat={clearChat}
        />
      </div>

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

      <div className="cipher-main">
        <div className="cipher-chat">
          
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
                    className={`h-full transition-all duration-300 ${isStreaming ? 'bg-cyan-400 animate-pulse' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} 
                    style={{ width: isStreaming ? '15%' : `${downloadProgress}%` }} 
                  />
                </div>
              )}
              
              <button 
                onClick={bootLocalEngine} 
                disabled={downloadProgress > 0}
                className="w-full py-4 bg-slate-800/90 border border-slate-700/50 rounded-lg text-sm font-semibold transition text-white flex flex-col items-center justify-center gap-3 min-h-[120px]"
              >
                {isStreaming ? (
                  <>
                    <div style={{ width: '32px', height: '32px', border: '3px solid rgba(34, 211, 238, 0.15)', borderTop: '3px solid #22d3ee', borderRadius: '50%', animation: 'cipher-spin 1s linear infinite' }} />
                    <style>{`@keyframes cipher-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <div className="flex flex-col gap-1 text-center">
                      <span className="text-cyan-400 font-mono tracking-widest text-xs font-bold animate-pulse">📡 NETWORK STREAM ACTIVE</span>
                      <span className="text-[10px] text-slate-500 font-mono">Syncing 4.83 GB parameter matrix securely to local database...</span>
                    </div>
                  </>
                ) : downloadProgress > 0 ? (
                  <span className="text-cyan-400 font-mono animate-pulse">⚙️ COMPILING NODE... {downloadProgress}%</span>
                ) : (
                  "Cold Boot Cipher Engine"
                )}
              </button>
            </div>
          ) : (
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

      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing || !engineLoaded}
      />
    </div>
  );
}
