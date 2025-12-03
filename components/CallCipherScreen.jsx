// components/CallCipherScreen.jsx

import { useState, useEffect } from "react";

export default function CallCipherScreen() {
  const [status, setStatus] = useState("idle"); // "idle" | "connecting" | "listening" | "speaking" | "ended"
  const [transcript, setTranscript] = useState([]);
  const [ws, setWs] = useState(null);
  const [error, setError] = useState("");

  // TODO: later – hook this to real Realtime WS
  const connectToCipher = () => {
    setError("");
    setStatus("connecting");

    // Placeholder for now:
    // Eventually this will open a WebSocket to your /api/realtime endpoint.
    // For now, just fake a short delay so you can test UI.
    setTimeout(() => {
      setStatus("listening");
      // setWs(new WebSocket("wss://your-vercel-url/api/realtime"));
    }, 800);
  };

  const endCall = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    setStatus("ended");
  };

  // Mic button press (later will send audio chunks)
  const handleMicPress = () => {
    if (status === "idle" || status === "ended") {
      connectToCipher();
      return;
    }

    if (status === "connecting") return;

    // In a real version, this toggles recording
    if (status === "listening") {
      setStatus("speaking");
      // Simulate Cipher responding
      setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          { from: "you", text: "Hey Cipher, can you hear me?" },
          {
            from: "cipher",
            text: "Yes, I can hear you clearly. This will be a live call soon.",
          },
        ]);
        setStatus("listening");
      }, 1200);
    }
  };

  const statusLabel = {
    idle: "Tap to start a call with Cipher",
    connecting: "Connecting to Cipher…",
    listening: "Listening…",
    speaking: "Cipher is speaking…",
    ended: "Call ended",
  }[status];

  const statusDotClass = {
    idle: "bg-zinc-500",
    connecting: "bg-yellow-500 animate-pulse",
    listening: "bg-emerald-500 animate-pulse",
    speaking: "bg-cyan-400 animate-pulse",
    ended: "bg-zinc-500",
  }[status];

  return (
    <div className="min-h-screen flex flex-col bg-[#05030A] text-zinc-100">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 flex items-center justify-center shadow-lg shadow-violet-500/40">
            <span className="text-lg font-bold">C</span>
          </div>
          <div>
            <div className="text-sm text-zinc-400">Live Call</div>
            <div className="text-base font-semibold">Cipher</div>
          </div>
        </div>
        {status !== "idle" && status !== "ended" && (
          <button
            onClick={endCall}
            className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-xs font-semibold"
          >
            End
          </button>
        )}
      </div>

      {/* Status */}
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-900">
        <div className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`} />
        <div className="text-sm text-zinc-300">{statusLabel}</div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-3">
        {transcript.length === 0 && (
          <div className="mt-6 text-sm text-zinc-500">
            When the live voice connection is ready, you’ll see your words and
            Cipher’s responses appear here as captions.
          </div>
        )}

        {transcript.map((line, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              line.from === "you"
                ? "ml-auto bg-violet-600/70"
                : "mr-auto bg-zinc-800/80 border border-violet-500/40"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide mb-1 text-zinc-400">
              {line.from === "you" ? "You" : "Cipher"}
            </div>
            <div>{line.text}</div>
          </div>
        ))}

        {error && (
          <div className="mt-4 text-xs text-red-400 bg-red-950/40 border border-red-800 px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Mic button + hint */}
      <div className="px-6 pb-8 pt-3 border-t border-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleMicPress}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition 
              ${
                status === "idle" || status === "ended"
                  ? "bg-violet-600 hover:bg-violet-500 shadow-violet-500/40"
                  : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-400/40"
              }`}
          >
            <span className="material-icons text-3xl">
              {status === "listening" || status === "connecting"
                ? "mic"
                : "mic_none"}
            </span>
          </button>
          <div className="text-[11px] text-zinc-500 text-center">
            Tap to start. Hold to talk (in the real version Cipher will listen
            and reply in real time).
          </div>
        </div>
      </div>
    </div>
  );
}
