// components/CallCipherScreen.jsx
import { useState, useRef } from "react";

export default function CallCipherScreen() {
  const [status, setStatus] = useState("Tap the mic to begin the link.");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);

  async function startRecording() {
    try {
      setError("");
      setStatus("Requesting microphone…");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus("Sending to Cipher…");

        try {
          const blob = new Blob(chunks, { type: "audio/webm" });

          const res = await fetch("/api/voice_call", {
            method: "POST",
            body: blob,
          });

          if (!res.ok) {
            let message = "Voice call failed.";
            try {
              const data = await res.json();
              if (data && data.error) message = data.error;
            } catch (_) {
              // ignore parse error
            }
            throw new Error(message);
          }

          const arrayBuffer = await res.arrayBuffer();
          const audioBlob = new Blob([arrayBuffer], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob);

          const audio = new Audio(audioUrl);
          audio.play().catch((err) => {
            console.error("Audio play error:", err);
            setError("Could not play audio. Check your volume.");
          });

          setStatus("Tap the mic to talk again.");
        } catch (err) {
          console.error(err);
          setError(err.message || "Something went wrong.");
          setStatus("Tap the mic to try again.");
        } finally {
          // stop all tracks
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream
              .getTracks()
              .forEach((track) => track.stop());
          }
          mediaRecorderRef.current = null;
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("Listening… tap again to stop.");
    } catch (err) {
      console.error(err);
      setError("Mic access denied or unavailable.");
      setStatus("Tap the mic to try again.");
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  }

  async function handleMicTap() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  return (
    <div className="call-root">
      <div className="call-overlay" />

      <div className="call-container">
        {/* Header */}
        <header className="call-header">
          <div className="avatar-ring">
            <div className="avatar-inner">C</div>
          </div>
          <div className="header-text">
            <div className="label">LIVE LINK</div>
            <div className="name">Cipher</div>
          </div>
          <div
            className={`status-dot ${isRecording ? "on" : "off"}`}
            aria-hidden="true"
          />
        </header>

        {/* Instructions / status */}
        <p className="hint">Tap the mic to begin the link.</p>
        <p className="status">{status}</p>
        {error && <p className="error">{error}</p>}

        {/* Big mic button */}
        <div className="mic-wrap">
          <button
            type="button"
            onClick={handleMicTap}
            className={`mic-button ${isRecording ? "mic-on" : ""}`}
          >
            <span className="mic-icon">🎙️</span>
            <span className="mic-label">
              {isRecording ? "Tap to stop" : "Tap to talk"}
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .call-root {
          min-height: 100vh;
          background: radial-gradient(
              circle at top,
              rgba(155, 135, 255, 0.3),
              transparent 55%
            ),
            radial-gradient(
              circle at bottom,
              rgba(255, 120, 200, 0.18),
              #050510 70%
            );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter",
            sans-serif;
          color: #f9f5ff;
        }

        .call-container {
          width: 100%;
          max-width: 480px;
          border-radius: 24px;
          padding: 20px 18px 28px;
          background: radial-gradient(circle at top, #2b1843 0, #090816 65%);
          box-shadow: 0 26px 60px rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(194, 151, 255, 0.18);
        }

        .call-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .avatar-ring {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          padding: 2px;
          background: conic-gradient(
            from 220deg,
            #e9c3ff,
            #8e7bff,
            #ff79c7,
            #e9c3ff
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: radial-gradient(circle at 30% 20%, #2b193f, #05030b);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 20px;
        }

        .header-text {
          flex: 1;
        }

        .label {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(230, 220, 255, 0.7);
        }

        .name {
          font-size: 18px;
          font-weight: 600;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: 2px solid rgba(0, 0, 0, 0.9);
        }

        .status-dot.off {
          background: #3c314f;
        }

        .status-dot.on {
          background: #33ff99;
          box-shadow: 0 0 12px rgba(51, 255, 153, 0.7);
        }

        .hint {
          margin: 4px 0 2px;
          font-size: 13px;
          color: rgba(230, 220, 255, 0.8);
        }

        .status {
          margin: 0;
          font-size: 13px;
          color: rgba(250, 245, 255, 0.95);
        }

        .error {
          margin-top: 6px;
          font-size: 12px;
          color: #ff8ba7;
        }

        .mic-wrap {
          margin-top: 36px;
          display: flex;
          justify-content: center;
        }

        .mic-button {
          width: 210px;
          height: 210px;
          border-radius: 32px;
          border: none;
          outline: none;
          background: radial-gradient(circle at 20% 0, #f6d6ff, #2a163f);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transform: rotate(-6deg);
          transition: transform 0.12s ease, box-shadow 0.12s ease,
            background 0.12s ease;
        }

        .mic-button.mic-on {
          background: radial-gradient(circle at 20% 0, #ffd6f6, #341545);
          box-shadow: 0 24px 48px rgba(255, 115, 210, 0.35);
          transform: rotate(-2deg) translateY(2px) scale(0.97);
        }

        .mic-button:active {
          transform: rotate(-2deg) translateY(3px) scale(0.96);
        }

        .mic-icon {
          font-size: 40px;
        }

        .mic-label {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        @media (max-width: 480px) {
          .call-container {
            padding: 18px 14px 24px;
          }

          .mic-button {
            width: 190px;
            height: 190px;
          }
        }
      `}</style>
    </div>
  );
}
