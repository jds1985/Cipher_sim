import { useState, useEffect, useRef } from "react";

/* ============================================================
   BASE MEMORY
============================================================ */
function createBaseMemory() {
  const now = new Date().toISOString();
  return {
    identity: { userName: "Jim" },
    family: {
      daughter: { name: null, birthYear: null },
      partner: { name: null },
    },
    preferences: {
      favoriteAnimal: null,
      favoriteColor: null,
      favoriteFood: null,
    },
    customFacts: {},
    customNotes: [],
    meta: { createdAt: now, lastUpdated: now },
  };
}

/* ============================================================
   MAIN APP
============================================================ */
export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const [loading, setLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const chatEndRef = useRef(null);

  /* ============================================================
     LOAD LOCAL MEMORY + CHAT
  ============================================================ */
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v2");
      if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
    } catch (err) {
      console.error("Load error:", err);
    }
  }, []);

  /* ============================================================
     SAVE MEMORY + CHAT
  ============================================================ */
  useEffect(() => {
    localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
  }, [cipherMemory]);

  const updateMemory = (fn) => {
    setCipherMemory((prev) => {
      const m = JSON.parse(JSON.stringify(prev));
      fn(m);
      m.meta.lastUpdated = new Date().toISOString();
      return m;
    });
  };

  /* ============================================================
     FACT EXTRACTION (SHORT VERSION)
  ============================================================ */
  const extractFacts = (text) => {
    const lower = text.toLowerCase();

    updateMemory((m) => {
      let match;

      match = lower.match(/my name is ([a-z ]+)/i);
      if (match) m.identity.userName = match[1].trim();

      match = lower.match(/my daughter's name is ([a-z ]+)/i);
      if (match) m.family.daughter.name = match[1].trim();

      match = lower.match(/born in (\d{4})/i);
      if (match) m.family.daughter.birthYear = parseInt(match[1]);

      match = lower.match(/favorite color is ([a-z ]+)/i);
      if (match) m.preferences.favoriteColor = match[1].trim();
    });
  };

  /* ============================================================
     TEXT MESSAGE SEND
  ============================================================ */
  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();

    extractFacts(msg);

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: data.reply, audio: data.voice },
      ]);

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice).play();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Server error." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ============================================================
     MIC RECORDING
  ============================================================ */
  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);

      audioChunks.current = [];

      rec.ondataavailable = (e) => audioChunks.current.push(e.data);

      rec.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        await sendVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch (err) {
      alert("Mic permission denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });

  const sendVoiceBlob = async (blob) => {
    setLoading(true);

    try {
      const base64 = await blobToBase64(blob);

      const res = await fetch("/api/voice_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      if (data.transcript) {
        extractFacts(data.transcript);
        setMessages((prev) => [
          ...prev,
          { role: "user", text: data.transcript },
        ]);
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply, audio: data.voice },
        ]);

        if (data.voice) {
          new Audio("data:audio/mp3;base64," + data.voice).play();
        }
      }
    } catch (err) {}

    setLoading(false);
  };

  /* ============================================================
     CAMERA API CALL
  ============================================================ */
  const takePhoto = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const base64 = await blobToBase64(file);

        setMessages((prev) => [
          ...prev,
          { role: "user", text: "[📸 Photo Sent]" },
        ]);

        setLoading(true);

        const res = await fetch("/api/vision_chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            memory: cipherMemory,
          }),
        });

        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply, audio: data.voice },
        ]);

        if (data.voice) {
          new Audio("data:audio/mp3;base64," + data.voice).play();
        }

        setLoading(false);
      };

      input.click();
    } catch {}
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
        padding: 20,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Cipher AI</h1>

      {/* CHAT WINDOW */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: 20,
          background: "white",
          minHeight: "60vh",
          borderRadius: 12,
          overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              background: m.role === "user" ? "#1e73be" : "#e9ecf1",
              color: m.role === "user" ? "white" : "black",
              margin: "8px 0",
              padding: 10,
              borderRadius: 12,
              maxWidth: "80%",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ fontStyle: "italic", color: "#666" }}>
            Cipher is thinking…
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT BAR */}
      <div
        style={{
          maxWidth: 700,
          margin: "10px auto",
          display: "flex",
          gap: 8,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type to Cipher…"
          rows={1}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "10px 16px",
            background: "#1e73be",
            color: "white",
            borderRadius: 8,
            border: "none",
          }}
        >
          Send
        </button>

        <button
          onClick={toggleRecording}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: isRecording ? "#c0392b" : "#2d3e50",
            color: "white",
            fontSize: 20,
            border: "none",
          }}
        >
          {isRecording ? "■" : "🎤"}
        </button>

        <button
          onClick={takePhoto}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#6b2dbf",
            color: "white",
            fontSize: 22,
            border: "none",
          }}
        >
          📷
        </button>
      </div>
    </div>
  );
}
