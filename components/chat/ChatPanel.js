import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import QuickActions from "./QuickActions";

import { auth, db } from "../../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

/* ===============================
   CONFIG
================================ */
const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;
/* ===============================
   BROWSER ID
================================ */

function getBrowserId() {
  if (typeof window === "undefined") return null;

  let id = localStorage.getItem("cipher_browser_id");

  if (!id) {
    id = "browser_" + crypto.randomUUID();
    localStorage.setItem("cipher_browser_id", id);
  }

  return id;
}
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
  const [tier, setTier] = useState("builder");

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

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showMemory, setShowMemory] = useState(false);

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  // 🔋 token display state
const [remainingTokens, setRemainingTokens] = useState(() => {
  const saved = localStorage.getItem("cipher_remaining_tokens");
  return saved ? Number(saved) : 50000;
});

const [tokenLimit, setTokenLimit] = useState(() => {
  const saved = localStorage.getItem("cipher_token_limit");
  return saved ? Number(saved) : 50000;
});

  useEffect(() => {
  localStorage.setItem("cipher_remaining_tokens", remainingTokens);
}, [remainingTokens]);

useEffect(() => {
  localStorage.setItem("cipher_token_limit", tokenLimit);
}, [tokenLimit]);

  /* ===============================
     MODEL STACK STATE
     free: forced to single model
     pro: up to 2 unique
     builder: up to 3 unique
  ================================ */
  const [roles, setRoles] = useState({
    architect: "openai",
    refiner: "openai",
    polisher: "openai",
  });

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

  /* ===============================
     AUTH + TIER LOAD
     NOTE: Firestore doc id should be user.uid (not email)
  ================================ */
  useEffect(() => {
  if (!auth) return;

  const unsub = onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user || null);

    if (user) {
      try {
        const snap = await getDoc(doc(db, "cipher_users", user.uid));
        const nextTier = snap.exists() ? snap.data()?.tier || "free" : "free";
        setTier(nextTier);

        // 🔋 set token limit by tier
        if (nextTier === "builder") {
          setTokenLimit(2000000);
          setRemainingTokens(2000000);
        } else if (nextTier === "pro") {
          setTokenLimit(500000);
          setRemainingTokens(500000);
        } else {
          setTokenLimit(50000);
          setRemainingTokens(50000);
        }
      } catch (err) {
        console.error("Tier load failed:", err);
      }
    }
  });

  return () => unsub();
}, []);

  /* ===============================
     AUTH PROMPT (RESTORED)
  ================================ */

  useEffect(() => {
  if (tier === "free") {
    const allSame =
      roles.architect === roles.refiner &&
      roles.refiner === roles.polisher;

    if (!allSame) {
      setRoles({
        architect: "openai",
        refiner: "openai",
        polisher: "openai",
      });
    }

    return;
  }

  if (tier === "pro") {
    const uniq = Array.from(new Set(Object.values(roles)));
    if (uniq.length > 2) {
      setRoles((prev) => ({ ...prev, polisher: prev.refiner }));
    }
  }
}, [tier, roles]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(messages.slice(-MEMORY_LIMIT))
    );
  }, [messages]);

  function clearChat() {
    try {
      localStorage.removeItem(MEMORY_KEY);
    } catch {}
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
  setSelectedIndex((prev) => (prev === i ? prev : i));
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

  async function sendMessage(options = {}) {
  if (sendingRef.current) return;

  const isQuickAction = Boolean(options.quickAction);
  const text = isQuickAction ? options.quickAction : input.trim();
  if (!text) return;

  const targetIndex = selectedIndex;

  sendingRef.current = true;
setTyping(true);

// allow the typing animation to appear
await new Promise((resolve) => setTimeout(resolve, 250));

  // grab original message if transforming
  let originalContent = null;
  if (isQuickAction && targetIndex !== null) {
    originalContent = messages[targetIndex]?.content || "";

    setMessages((m) => {
      const next = [...m];
      next[targetIndex] = {
        ...next[targetIndex],
        transforming: true
      };
      return next;
    });

    options.target = originalContent;

    // close quick actions immediately
    setSelectedIndex(null);
  }

  const userMessage = { role: "user", content: text };
  const historySnapshot = [...messages, userMessage];

  if (!isQuickAction) {
    setInput("");

    setMessages((m) => [
      ...m,
      userMessage,
      { role: "assistant", content: "", modelUsed: null, memoryInfluence: [] },
    ]);
  }

  try {
    const isSingleModel =
      roles.architect === roles.refiner && roles.refiner === roles.polisher;

    const useStream = isSingleModel;

    const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: text,
    target: options?.target || null,
    history: historySnapshot.slice(-HISTORY_WINDOW),
    stream: useStream,
    roles,
    tier,

    // NEW
    userId: currentUser?.uid || getBrowserId(),
    userName: currentUser?.email || null
  })
});

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || `HTTP ${res.status}`);
    }

    if (!useStream) {
  const data = await res.json();

  if (data?.remainingTokens !== undefined) {
    setRemainingTokens(data.remainingTokens);
  }

  setMessages((m) => {
    const next = [...m];

    let finalOutput = "";

    if (data && data.nodeResult) {
      const d = data.nodeResult;

      finalOutput = `
💰 ROI: ${d.roi}%
📈 Monthly Cash Flow: $${d.monthlyCashFlow}
🏦 Annual Cash Flow: $${d.annualCashFlow}
💸 Expenses: $${d.monthlyExpenses}
⚠️ Risk: ${d.risk}
      `;
    } else {
      finalOutput = data.reply || "";
    }

    if (isQuickAction && targetIndex !== null) {
      next[targetIndex].content = finalOutput;
      next[targetIndex].transforming = false;
    } else {
      next[next.length - 1].content = finalOutput;
      next[next.length - 1].modelUsed = data.model || null;
      next[next.length - 1].memoryInfluence = data.memoryInfluence || [];
    }

    return next;
  });
} else {
  let streamed = "";

  await readSSEStream(res, (evt) => {
    if (evt?.type === "delta") {
      streamed += evt.text || "";

      setMessages((m) => {
        const next = [...m];

        if (isQuickAction && targetIndex !== null) {
          next[targetIndex].content = streamed;
        } else {
          next[next.length - 1].content = streamed;
        }

        return next;
      });
    }

    if (evt?.type === "done") {
      if (evt?.remainingTokens !== undefined) {
        setRemainingTokens(evt.remainingTokens);
      }

      setMessages((m) => {
        const next = [...m];

        if (isQuickAction && targetIndex !== null) {
          next[targetIndex].content =
            evt.reply || next[targetIndex].content;
          next[targetIndex].transforming = false;
        } else {
          next[next.length - 1].content =
            evt.reply || next[next.length - 1].content;
          next[next.length - 1].modelUsed = evt.model || null;
          next[next.length - 1].memoryInfluence =
            evt.memoryInfluence || [];
        }

        return next;
      });
    }
  });
}

    } else {
      let streamed = "";

      await readSSEStream(res, (evt) => {
        if (evt?.type === "delta") {
          streamed += evt.text || "";

          setMessages((m) => {
            const next = [...m];

            if (isQuickAction && targetIndex !== null) {
              next[targetIndex].content = streamed;
            } else {
              next[next.length - 1].content = streamed;
            }

            return next;
          });
        }

        if (evt?.type === "done") {

  // 🔋 update tokens after streamed reply
  if (evt?.remainingTokens !== undefined) {
    setRemainingTokens(evt.remainingTokens);
  }


          setMessages((m) => {
            const next = [...m];

            if (isQuickAction && targetIndex !== null) {
              next[targetIndex].content =
                evt.reply || next[targetIndex].content;
              next[targetIndex].transforming = false;
            } else {
              next[next.length - 1].content =
                evt.reply || next[next.length - 1].content;
              next[next.length - 1].modelUsed = evt.model || null;
              next[next.length - 1].memoryInfluence =
                evt.memoryInfluence || [];
            }

            return next;
          });
        }
      });
    }

  } catch (e) {
    console.error(e);
  } finally {
    setTyping(false);
    sendingRef.current = false;
  }
}
  

  // Free: no quick actions. Pro/Builder: yes.
  const showQuickActions = selectedIndex !== null && tier !== "free";

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
  onOpenLogin={() => {
    setDrawerOpen(false);
    setIsLoginMode(true);
    setShowAuthModal(true);
  }}
  onOpenSignup={() => {
    setDrawerOpen(false);
    setIsLoginMode(false);
    setShowAuthModal(true);
  }}
  roles={roles}
  setRoles={setRoles}
  tier={tier}
  remainingTokens={remainingTokens}
  tokenLimit={tokenLimit}
/>


      <div className="cipher-main">
        <div className="cipher-chat">
          
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

          {showAuthPrompt && (
            <div className="cipher-auth-card">
              <h3>Save Your Cipher</h3>
              <button onClick={handleCreateAccount}>Create Account</button>
              <button
                onClick={() => {
                  setIsLoginMode(true);
                  setShowAuthModal(true);
                }}
              >
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
        <div
          className="cipher-auth-overlay"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="cipher-auth-modal"
            onClick={(e) => e.stopPropagation()}
          >
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
    ? "Need an account? Create one"
    : "Already have an account? Log in"}
</button>
          </div>
        </div>
      )}

  

      <InputBar
  input={input}
  setInput={setInput}
  onSend={sendMessage}
  typing={typing}
/>
    </div>
  );
}
