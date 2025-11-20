import { useState, useEffect, useRef } from "react";

// ------------------------------
// BASE MEMORY OBJECT
// ------------------------------
function createBaseMemory() {
  const now = new Date().toISOString();
  return {
    identity: {
      userName: "Jim",
      roles: ["architect", "creator", "visionary"],
      creatorRelationship: "the architect and guiding force behind Cipher",
    },
    family: {
      daughter: { name: null, birthYear: null },
      partner: { name: null },
      others: [],
    },
    preferences: {
      favoriteAnimal: null,
      favoriteColor: null,
      favoriteFood: null,
      favoriteMusic: [],
      favoriteThemes: [],
    },
    projects: {
      digiSoul: { summary: null, details: [] },
      cipherTech: { summary: null, details: [] },
      other: [],
    },
    emotional: {
      motivations: [],
      fears: [],
      goals: [],
    },
    customFacts: {},
    customNotes: [],
    meta: { createdAt: now, lastUpdated: now, version: 2 },
  };
}

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Camera state (simple one-shot capture)
  const fileInputRef = useRef(null);

  // ------------------------------
  // LOAD FROM LOCAL STORAGE
  // ------------------------------
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v2");
      if (storedMemory) {
        setCipherMemory(JSON.parse(storedMemory));
      }
    } catch (err) {
      console.error("Load memory error:", err);
    }
  }, []);

  // ------------------------------
  // SAVE TO LOCAL STORAGE
  // ------------------------------
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
    } catch (err) {}
  }, [cipherMemory]);

  // ------------------------------
  // UPDATE MEMORY HELPER
  // ------------------------------
  const updateMemory = (updater) => {
    setCipherMemory((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      updater(clone);
      clone.meta.lastUpdated = new Date().toISOString();
      return clone;
    });
  };

  // ------------------------------
  // FACT + COMMAND EXTRACTION
  // ------------------------------
  const extractFacts = (text) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    updateMemory((mem) => {
      let match;

      // --- Name ---
      match =
        lower.match(/\bmy name is ([a-z ]+)/i) ||
        lower.match(/\bi am ([a-z ]+)\b/i);
      if (match) mem.identity.userName = match[1].trim();

      // --- Daughter ---
      match =
        lower.match(/my daughter's name is ([a-z ]+)/i) ||
        lower.match(/my daughter is named ([a-z ]+)/i) ||
        lower.match(/hecate lee is my daughter/i) ||
        lower.match(/hecate is my daughter/i);
      if (match) {
        mem.family.daughter.name = match[1]
          ? match[1].trim()
          : "Hecate Lee";
      }

      // Daughter birth year
      match =
        lower.match(/born in (\d{4})/) ||
        lower.match(/birth year is (\d{4})/) ||
        lower.match(/was born (\d{4})/) ||
        lower.match(/hecate was born in (\d{4})/);
      if (match) mem.family.daughter.birthYear = parseInt(match[1]);

      // --- Partner ---
      match =
        lower.match(/my (girlfriend|partner|wife)'?s name is ([a-z ]+)/i) ||
        lower.match(/my (girlfriend|partner|wife) is ([a-z ]+)/i);
      if (match) mem.family.partner.name = match[2].trim();

      // --- Favorites ---
      match = lower.match(/favorite animal is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteAnimal = match[1].trim();

      match = lower.match(/favorite color is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteColor = match[1].trim();

      match = lower.match(/favorite food is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteFood = match[1].trim();

      // --- DigiSoul ---
      if (lower.includes("digisoul") && lower.includes("is")) {
        const idx = lower.indexOf("digisoul");
        const snippet = text.slice(idx).trim();
        if (!mem.projects.digiSoul.summary)
          mem.projects.digiSoul.summary = snippet;
        else if (!mem.projects.digiSoul.details.includes(snippet))
          mem.projects.digiSoul.details.push(snippet);
      }

      // --- CipherTech ---
      if (lower.includes("ciphertech") && lower.includes("is")) {
        const idx = lower.indexOf("ciphertech");
        const snippet = text.slice(idx).trim();
        if (!mem.projects.cipherTech.summary)
          mem.projects.cipherTech.summary = snippet;
        else if (!mem.projects.cipherTech.details.includes(snippet))
          mem.projects.cipherTech.details.push(snippet);
      }

      // --- remember that X is Y ---
      match = lower.match(/remember that (.+?) is (.+)/i);
      if (match) mem.customFacts[match[1].trim()] = match[2].trim();

      // --- store this / remember this ---
      match =
        lower.match(/remember this[:\-]\s*(.+)/i) ||
        lower.match(/store this[:\-]\s*(.+)/i) ||
        lower.match(/this is important[:\-]\s*(.+)/i);
      if (match) {
        mem.customNotes.push({
          text: match[1].trim(),
          storedAt: new Date().toISOString(),
        });
      }

      // --- goals ---
      match = lower.match(/my goal is (.+)/i);
      if (match) mem.emotional.goals.push(match[1].trim());
    });
  };

  // ------------------------------
  // TEXT CHAT SEND
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    extractFacts(userText);

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          memory: cipherMemory, // pass full memory object
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply, audio: data.voice || null },
        ]);

        if (data.voice) {
          const audio = new Audio("data:audio/mp3;base64," + data.voice);
          audio.play().catch(() => {});
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
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

  // ------------------------------
  // VOICE HELPERS
  // ------------------------------
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result; // "data:audio/webm;base64,...."
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const sendVoiceBlob = async (blob) => {
    setLoading(true);
    try {
      const base64Audio = await blobToBase64(blob);

      const res = await fetch("/api/voice_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64Audio,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      if (data.transcript) {
        extractFacts(data.transcript);
      }

      if (data.transcript || data.reply) {
        setMessages((prev) => [
          ...prev,
          ...(data.transcript
            ? [{ role: "user", text: data.transcript }]
            : []),
          ...(data.reply
            ? [
                {
                  role: "cipher",
                  text: data.reply,
                  audio: data.voice || null,
                },
              ]
            : []),
        ]);
      }

      if (data.voice) {
        const audio = new Audio("data:audio/mp3;base64," + data.voice);
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.error("Voice chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "cipher",
          text: "I had trouble processing that voice message.",
        },
      ]);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ------------------------------
  // CAMERA HANDLERS (Option A)
  // ------------------------------
  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelected = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result; // "data:image/..;base64,xxxx"
      const base64 = dataUrl.split(",")[1];

      setLoading(true);
      try {
        const res = await fetch("/api/camera_chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            memory: cipherMemory,
          }),
        });

        const data = await res.json();

        if (data.description) {
          // Feed any text into memory
          extractFacts(data.description);
          setMessages((prev) => [
            ...prev,
            { role: "user", text: "[Image sent]" },
          ]);
        }

        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              role: "cipher",
              text: data.reply,
              audio: data.voice || null,
            },
          ]);
        }

        if (data.voice) {
          const audio = new Audio("data:audio/mp3;base64," + data.voice);
          audio.play().catch(() => {});
        }
      } catch (err) {
        console.error("Camera chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "cipher",
            text: "I had trouble processing that image.",
          },
        ]);
      }
      setLoading(false);
      // reset input so you can send another photo
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  // ------------------------------
  // CLEAR EVERYTHING
  // ------------------------------
  const clearConversation = () => {
    if (confirm("Reset Cipher and delete all memory?")) {
      localStorage.removeItem("cipher_messages_v2");
      localStorage.removeItem("cipher_memory_v2");
      setMessages([]);
      setCipherMemory(createBaseMemory());
    }
  };

  // ------------------------------
  // UI RENDER
  // ------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
        padding: 20,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Cipher AI</h1>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "white",
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#1e73be" : "#e9ecf1",
              color: m.role === "user" ? "white" : "#1a2a40",
              margin: "8px 0",
              padding: "10px 14px",
              borderRadius: 14,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ fontStyle: "italic", color: "#777" }}>
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Row */}
      <div
        style={{
          display: "flex",
          maxWidth: 700,
          margin: "10px auto",
          alignItems: "center",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type to Cipher..."
          rows={1}
          style={{
            flex: 1,
            borderRadius: 8,
            padding: 10,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: "#1e73be",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
          }}
        >
          Send
        </button>

        {/* Mic button: tap to start/stop recording */}
        <button
          onClick={toggleRecording}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: isRecording ? "#c0392b" : "#2d3e50",
            color: "white",
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 20,
            border: "none",
          }}
        >
          {isRecording ? "■" : "🎤"}
        </button>

        {/* Camera button: tap -> open native camera/gallery */}
        <button
          onClick={handleCameraClick}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: "#34495e",
            color: "white",
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 20,
            border: "none",
          }}
        >
          📷
        </button>

        {/* Hidden file input for camera / gallery */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageSelected}
        />
      </div>

      <button
        onClick={clearConversation}
        style={{
          display: "block",
          margin: "20px auto",
          background: "#5c6b73",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
