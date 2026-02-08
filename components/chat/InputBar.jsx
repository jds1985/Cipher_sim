// components/chat/InputBar.jsx
import { useRef, useState } from "react";
import { styles } from "./ChatStyles";

export default function InputBar({
  input,
  setInput,
  onSend,
  typing,
}) {
  const holdTimer = useRef(null);
  const decipherArmed = useRef(false);
  const longPressTriggered = useRef(false);

  const [charging, setCharging] = useState(false); // ⭐ visual state

  function startHold() {
    decipherArmed.current = false;
    longPressTriggered.current = false;

    setCharging(true); // ⭐ glow start

    holdTimer.current = setTimeout(() => {
      decipherArmed.current = true;
      longPressTriggered.current = true;

      if (navigator.vibrate) navigator.vibrate(15);
    }, 600);
  }

  function endHold() {
    clearTimeout(holdTimer.current);
    setCharging(false); // ⭐ glow stop

    if (longPressTriggered.current && !typing) {
      onSend({ forceDecipher: true });
    }

    decipherArmed.current = false;
    longPressTriggered.current = false;
  }

  function handleClick() {
    if (typing) return;
    if (!input.trim()) return;
    onSend({ forceDecipher: false });
  }

  const hasText = Boolean(input.trim());

  return (
    <div style={styles.inputWrap}>
      <input
        style={styles.input}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Talk to Cipher…"
        disabled={typing}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.shiftKey) return;

          if (e.key === "Enter") {
            e.preventDefault();
            handleClick();
          }
        }}
      />

      <button
        disabled={typing}
        title="Hold to Decipher"
        onTouchStart={startHold}
        onTouchEnd={endHold}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onClick={handleClick}
        style={{
          ...styles.sendBtn,

          // ⭐ PRESS FEEL
          transform: charging ? "scale(0.96)" : "scale(1)",

          // ⭐ IDLE PULSE WHEN READY
          animation: hasText && !charging ? "cipherPulse 2s infinite" : "none",

          // ⭐ CHARGING MODE
          boxShadow: charging
            ? "0 0 18px rgba(255,90,90,0.7), 0 0 30px rgba(255,90,90,0.4)"
            : hasText
            ? "0 0 12px rgba(140,100,255,0.45)"
            : "none",

          transition: "all 0.15s ease",
        }}
      >
        ➤
      </button>

      {/* ⭐ animation definition */}
      <style jsx>{`
        @keyframes cipherPulse {
          0% { box-shadow: 0 0 0 rgba(140,100,255,0.0); }
          50% { box-shadow: 0 0 14px rgba(140,100,255,0.45); }
          100% { box-shadow: 0 0 0 rgba(140,100,255,0.0); }
        }
      `}</style>
    </div>
  );
}
