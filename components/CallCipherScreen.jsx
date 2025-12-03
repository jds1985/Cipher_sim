// components/CallCipherScreen.jsx

import { useState, useRef } from "react";

export default function CallCipherScreen() {
  const [status, setStatus] = useState("idle");
  const [captions, setCaptions] = useState([]);
  const audioRef = useRef(null);
  let mediaRecorder = useRef(null);
  let ws = useRef(null);

  async function startConnection() {
    setStatus("connecting");

    // Call our backend to create session
    const resp = await fetch("/api/realtime", { method: "POST" });
    const data = await resp.json();

    if (!data.session?.client_secret?.value) {
      setStatus("error");
      console.error("Session creation failed:", data);
      return;
    }

    // Connect WebSocket
    ws.current = new WebSocket(data.session.client_secret.value);

    ws.current.onopen = () => {
      setStatus("connected");
    };

    ws.current.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        // Handle model's live text
        if (msg.type === "response.output_text.delta") {
          setCaptions((prev) => [...prev, msg.delta]);
        }

        // Handle model's live audio reply
        if (msg.type === "response.output_audio.chunk") {
          const audio = new Blob([msg.audio], { type: "audio/mpeg" });
          const url = URL.createObjectURL(audio);
          const audioElem = new Audio(url);
          audioElem.play();
        }
      } catch (e) {
        console.log("WS msg error:", e);
      }
    };

    ws.current.onerror = (err) => {
      console.error(err);
      setStatus("error");
    };
  }

  async function handleMicTap() {
    if (status === "idle") {
      startConnection();
      return;
    }

    if (status === "connected") {
      // Start recording mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (e) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(e.data);
        }
      };

      mediaRecorder.current.start(150);
      setStatus("recording");
    }

    if (status === "recording") {
      // Stop recording
      mediaRecorder.current.stop();
      setStatus("connected");
    }
  }

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2>LIVE LINK</h2>
      <h3>Cipher</h3>

      <p>
        {status === "idle" && "Tap the mic to begin the link."}
        {status === "connecting" && "Connecting…"}
        {status === "connected" && "Connected. Tap & hold to talk."}
        {status === "recording" && "Recording… Release to send."}
        {status === "error" && "Voice pipeline failed. Try again."}
      </p>

      <div
        onClick={handleMicTap}
        style={{
          marginTop: 40,
          background: "#c198e6",
          width: 170,
          height: 170,
          borderRadius: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        TAP TO TALK
      </div>

      <div style={{ marginTop: 25 }}>
        {captions.map((c, i) => (
          <p key={i}>{c}</p>
        ))}
      </div>
    </div>
  );
}
