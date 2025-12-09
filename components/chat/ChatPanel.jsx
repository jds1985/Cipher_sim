import { useState, useEffect, useRef } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  /* -------------------------------------------------------
     IMAGE UPLOAD HANDLER — Upload to Vercel Blob
  ------------------------------------------------------- */
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];

      // Upload image to API
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const url = result.url;

        // Show image in chat UI
        setMessages((prev) => [
          ...prev,
          { role: "user", type: "image", url }
        ]);

        // Send the URL to Cipher
        await sendMessage(url, true);
      }
    };

    reader.readAsDataURL(file);
  }


  /* -------------------------------------------------------
     SEND MESSAGE TO CIPHER
  ------------------------------------------------------- */
  async function sendMessage(msgOverride = null, isImage = false) {
    const userMessage = msgOverride || input;
    if (!userMessage.trim()) return;

    // Show user's message
    setMessages((prev) => [
      ...prev,
      { role: "user", type: isImage ? "image" : "text", content: userMessage }
    ]);

    setInput("");

    // Call Cipher API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
      }),
    });

    const data = await response.json();

    if (data.reply) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", type: "text", content: data.reply }
      ]);
    }
  }


  /* -------------------------------------------------------
     RENDER CHAT PANEL
  ------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full bg-black text-white">

      {/* CHAT WINDOW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[75%] p-3 rounded-xl ${
              msg.role === "user"
                ? "bg-blue-700 text-white self-end ml-auto"
                : "bg-gray-800 text-gray-100"
            }`}
          >
            {msg.type === "image" ? (
              <img
                src={msg.url}
                alt="uploaded"
                className="rounded-xl border border-gray-700 max-w-full"
              />
            ) : (
              msg.content
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-4 border-t border-gray-900 bg-[#050505]">
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById("fileInput").click()}
            className="px-3 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg active:scale-95 transition"
          >
            📸 Upload
          </button>

          <input
            className="flex-1 px-3 py-2 rounded-lg bg-gray-900 text-gray-100 border border-gray-800 focus:outline-none focus:ring focus:ring-blue-700"
            placeholder="Message Cipher…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={() => sendMessage()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg active:scale-95 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
