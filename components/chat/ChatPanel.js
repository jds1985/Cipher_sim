import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import QuickActions from "./QuickActions";
import { getCipherCoin } from "./CipherCoin";

import { auth } from "../../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

/* ===============================
   CONFIG
================================ */
const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;

/* ===============================
   SSE PARSER
================================ */
async function readSSEStream(res, onEvent) {
  const reader = res?.body?.getReader?.();
  if (!reader) throw new Error("Stream: no readable body");

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const idx = buffer.indexOf("\n\n");
      if (idx === -1) break;

      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      if (chunk.startsWith(":")) continue;

      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.replace(/^data:\s*/, "");
        try {
          onEvent?.(JSON.parse(payload));
        } catch {}
      }
    }
  }
}

/* ===============================
   COMPONENT
================================ */
export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed.slice(-MEMORY_LIMIT) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showMemory, setShowMemory] = useState(false);

  /* 🔥 Retention + Auth */
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false); // NEW

  /* 🔥 Logged-in user */
  const [currentUser, setCurrentUser] = useState(null);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

  /* ===============================
     AUTH LISTENER
  ================================= */
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsub();
  }, []);

  /* ===============================
     AUTO SCROLL
  ================================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(MEMORY_KEY, JSON.stringify(messages.slice(-MEMORY_LIMIT)));
  }, [messages]);

  useEffect(() => {
    if (drawerOpen) setCoinBalance(getCipherCoin());
  }, [drawerOpen]);

  useEffect(() => {
    if (authDismissed) return;
    const userCount = messages.filter((m) => m.role === "user").length;
    if (userCount >= 3) setShowAuthPrompt(true);
  }, [messages, authDismissed]);

  function clearChat() {
    try { localStorage.removeItem(MEMORY_KEY); } catch {}
    setMessages([]);
    setSelectedIndex(null);
    setShowMemory(false);
    setShowAuthPrompt(false);
    setAuthDismissed(false);
    setShowAuthModal(false);
    setAuthEmail("");
    setAuthPassword("");
    setAuthLoading(false);
  }

  function handleSelectMessage(i, options = {}) {
    setSelectedIndex(i);
    setShowMemory(!!options.openMemory);
  }

  function handleDismissAuth() {
    setShowAuthPrompt(false);
    setAuthDismissed(true);
  }

  function handleCreateAccount() {
    setIsLoginMode(false);
    setShowAuthModal(true);
  }

  async function handleAuthSubmit() {
    const email = authEmail.trim();
    const pass = authPassword;

    if (!email || !pass) {
      alert("Enter email + password.");
      return;
    }

    if (!auth) {
      alert("Firebase auth not initialized.");
      return;
    }

    try {
      setAuthLoading(true);

      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
      }

      setShowAuthModal(false);
      setShowAuthPrompt(false);
      setAuthDismissed(true);
      setAuthEmail("");
      setAuthPassword("");

    } catch (err) {
      alert(err?.message || err?.code || "Auth error");
    } finally {
      setAuthLoading(false);
    }
  }

  /* ===============================
     INLINE TRANSFORM
  ================================= */
  async function runInlineTransform(instruction) {
    if (selectedIndex === null) return;
    const original = messages[selectedIndex];
    if (!original?.content) return;

    const backup = original.content;

    setMessages((m) => {
      const copy = [...m];
      copy[selectedIndex] = { ...copy[selectedIndex], transforming: true };
      return copy;
    });

    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${instruction}\n\n${backup}`,
          history: [],
          stream: false,
        }),
      });

      const data = await res.json();
      const newText =
        data?.reply || data?.text || data?.content || data?.message;

      setMessages((m) => {
        const copy = [...m];
        copy[selectedIndex] = {
          ...copy[selectedIndex],
          content: newText,
          transforming: false,
          modelUsed: data?.model || null,
          memoryInfluence: data?.memoryInfluence || [],
        };
        return copy;
      });

    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[selectedIndex] = {
          ...copy[selectedIndex],
          content: backup,
          transforming: false,
        };
        return copy;
      });
    } finally {
      setTyping(false);
    }
  }

  /* ===============================
     USER SEND
  ================================= */
  async function sendMessage() {
    if (sendingRef.current) return;
    const text = input.trim();
    if (!text) return;

    sendingRef.current = true;
    setTyping(true);

    const userMessage = { role: "user", content: text };
    const historySnapshot = [...messages, userMessage];

    setInput("");
    setSelectedIndex(null);
    setShowMemory(false);

    setMessages((m) => [
      ...m,
      userMessage,
      { role: "assistant", content: "", modelUsed: null, memoryInfluence: [] },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historySnapshot.slice(-HISTORY_WINDOW),
          stream: true,
        }),
      });

      let streamed = "";
      await readSSEStream(res, (evt) => {
        if (evt?.type === "delta") {
          streamed += evt.text || "";
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1].content = streamed;
            return next;
          });
        }
      });

    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          content: "Transport error",
        };
        return next;
      });
    } finally {
      setTyping(false);
      sendingRef.current = false;
    }
  }

  /* ===============================
     RENDER
  ================================= */
  return (
    <div className="cipher-wrap">
      <HeaderMenu onOpenDrawer={() => setDrawerOpen(true)} onNewChat={clearChat} />

      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cipherCoin={coinBalance}
        user={currentUser}
        onLogout={async () => auth && signOut(auth)}
      />

      <div className="cipher-main">
        <div className="cipher-chat">
          <MessageList
            messages={messages}
            bottomRef={bottomRef}
            onSelectMessage={handleSelectMessage}
            selectedIndex={selectedIndex}
          />

          {showAuthPrompt && (
            <div className="cipher-auth-card">
              <h3>Save Your Cipher</h3>
              <button onClick={handleCreateAccount}>Create Account</button>
              <button onClick={() => {
                setIsLoginMode(true);
                setShowAuthModal(true);
              }}>
                Log In
              </button>
              <button className="secondary" onClick={handleDismissAuth}>
                Continue as Guest
              </button>
            </div>
          )}
        </div>
      </div>

      {showAuthModal && (
        <div className="cipher-auth-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="cipher-auth-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{isLoginMode ? "Log In" : "Create Account"}</h3>

            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />

            <button onClick={handleAuthSubmit} disabled={authLoading}>
              {authLoading
                ? "Processing..."
                : isLoginMode
                ? "Log In"
                : "Create Account"}
            </button>
              <button
  className="cipher-auth-secondary"
  onClick={() => setIsLoginMode((v) => !v)}
>
  {isLoginMode
    ? "Need an account? Sign up"
    : "Already have an account? Log in"}
</button>

            <button
              className="secondary"
              onClick={() => setIsLoginMode((v) => !v)}
            >
              {isLoginMode
                ? "Need an account? Create one"
                : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      )}

      {selectedIndex !== null && <QuickActions onAction={runInlineTransform} />}

      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing}
      />
    </div>
  );
}
