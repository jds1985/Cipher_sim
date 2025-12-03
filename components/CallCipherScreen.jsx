// components/CallCipherScreen.jsx

import { useState } from "react";

export default function CallCipherScreen() {
  const [status, setStatus] = useState("idle"); // idle | connecting | listening | speaking | ended
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState("");

  // fake connect for now – we’ll wire real audio after UI is done
  const connectToCipher = () => {
    setError("");
    setStatus("connecting");

    setTimeout(() => {
      setStatus("listening");
    }, 900);
  };

  const endCall = () => {
    setStatus("ended");
  };

  const handleMicPress = () => {
    if (status === "idle" || status === "ended") {
      connectToCipher();
      return;
    }

    if (status === "connecting") return;

    // simulate speaking & reply
    if (status === "listening") {
      setStatus("speaking");
      setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          { from: "you", text: "Hey Cipher, can you hear me?" },
          {
            from: "cipher",
            text:
              "Yes. This is a simulated call. Soon this will be a real-time voice conversation.",
          },
        ]);
        setStatus("listening");
      }, 1200);
    }
  };

  const statusLabel = {
    idle: "Tap the mic to begin the link.",
    connecting: "Establishing quantum link to Cipher…",
    listening: "Cipher is listening.",
    speaking: "Cipher is speaking…",
    ended: "Call ended. Tap to reconnect.",
  }[status];

  return (
    <>
      <div className="call-root">
        {/* holographic grid background */}
        <div className="grid-overlay" />

        {/* top bar */}
        <header className="top-bar">
          <div className="avatar-row">
            <div className="cipher-orb">
              <div className="cipher-orb-inner">C</div>
            </div>
            <div className="cipher-labels">
              <span className="cipher-tag">LIVE LINK</span>
              <span className="cipher-name">Cipher</span>
            </div>
          </div>

          {(status !== "idle" && status !== "ended") && (
            <button className="end-btn" onClick={endCall}>
              End
            </button>
          )}
        </header>

        {/* status text */}
        <div className="status-row">
          <div className={`status-dot status-${status}`} />
          <div className="status-text">{statusLabel}</div>
        </div>

        {/* transcript window */}
        <div className="transcript">
          {transcript.length === 0 && (
            <div className="transcript-empty">
              When the live voice connection is ready, you’ll see your words
              and Cipher’s responses appear here as captions.
            </div>
          )}

          {transcript.map((line, idx) => (
            <div
              key={idx}
              className={
                line.from === "you" ? "bubble bubble-you" : "bubble bubble-ai"
              }
            >
              <div className="bubble-from">
                {line.from === "you" ? "YOU" : "CIPHER"}
              </div>
              <div>{line.text}</div>
            </div>
          ))}

          {error && <div className="error-box">{error}</div>}
        </div>

        {/* mic + hint */}
        <div className="bottom-bar">
          <button className="mic-wrap" onClick={handleMicPress}>
            <div className={`mic-ring ring-back ring-${status}`} />
            <div className={`mic-ring ring-front ring-${status}`} />
            <div className="mic-core">
              🎙
            </div>
          </button>
          <div className="hint">
            Tap to start. In the live version, Cipher will listen and reply in
            real time.
          </div>
        </div>
      </div>

      {/* styled-jsx so it looks futuristic even without Tailwind */}
      <style jsx>{`
        .call-root {
          min-height: 100vh;
          background: radial-gradient(circle at top, #3a1b6f 0, #05030a 55%);
          color: #f8f5ff;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          padding: 16px;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter",
            sans-serif;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
          opacity: 0.18;
          pointer-events: none;
        }

        .top-bar {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
        }

        .avatar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cipher-orb {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: conic-gradient(
            from 210deg,
            #6c5ce7,
            #a855f7,
            #f59e0b,
            #6c5ce7
          );
          padding: 2px;
          box-shadow: 0 0 18px rgba(168, 85, 247, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cipher-orb-inner {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          background: #05030a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.08em;
        }

        .cipher-labels {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cipher-tag {
          font-size: 10px;
          letter-spacing: 0.16em;
          opacity: 0.7;
        }

        .cipher-name {
          font-size: 15px;
          font-weight: 600;
        }

        .end-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.7);
        }

        .status-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.9;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          box-shadow: 0 0 8px currentColor;
        }

        .status-idle {
          background: #6b7280;
          color: #6b7280;
        }
        .status-connecting {
          background: #f59e0b;
          color: #f59e0b;
          animation: pulse 1.2s infinite;
        }
        .status-listening {
          background: #22c55e;
          color: #22c55e;
          animation: pulse 1.2s infinite;
        }
        .status-speaking {
          background: #38bdf8;
          color: #38bdf8;
          animation: pulse 1.2s infinite;
        }
        .status-ended {
          background: #6b7280;
          color: #6b7280;
        }

        .status-text {
          flex: 1;
        }

        .transcript {
          position: relative;
          z-index: 1;
          flex: 1;
          margin-top: 8px;
          margin-bottom: 12px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(5, 3, 20, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.25);
          overflow-y: auto;
        }

        .transcript-empty {
          font-size: 12px;
          opacity: 0.7;
        }

        .bubble {
          max-width: 82%;
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .bubble-you {
          margin-left: auto;
          background: rgba(88, 28, 135, 0.9);
          border: 1px solid rgba(248, 250, 252, 0.18);
        }

        .bubble-ai {
          margin-right: auto;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(129, 140, 248, 0.6);
        }

        .bubble-from {
          font-size: 9px;
          letter-spacing: 0.16em;
          opacity: 0.7;
          margin-bottom: 2px;
        }

        .error-box {
          margin-top: 8px;
          font-size: 11px;
          color: #fecaca;
          background: rgba(127, 29, 29, 0.5);
          border-radius: 10px;
          padding: 8px 10px;
          border: 1px solid rgba(248, 113, 113, 0.8);
        }

        .bottom-bar {
          position: relative;
          z-index: 1;
          padding-bottom: 16px;
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .mic-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          border: none;
          background: transparent;
          padding: 0;
        }

        .mic-ring {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .ring-back {
          background: radial-gradient(
            circle,
            rgba(129, 140, 248, 0.3),
            transparent 60%
          );
          filter: blur(2px);
        }

        .ring-front {
          border-width: 2px;
          border-image: conic-gradient(
              from 230deg,
              #22c55e,
              #a855f7,
              #38bdf8,
              #f97316,
              #22c55e
            )
            1;
          animation: spin 6s linear infinite;
        }

        .ring-idle {
          opacity: 0.7;
        }
        .ring-connecting,
        .ring-listening,
        .ring-speaking {
          opacity: 1;
        }
        .ring-ended {
          opacity: 0.4;
        }

        .mic-core {
          position: absolute;
          inset: 18%;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 0%, #ffffff, #111827);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 0 30px rgba(129, 140, 248, 0.8);
        }

        .hint {
          font-size: 11px;
          opacity: 0.7;
          text-align: center;
          max-width: 260px;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
