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

  const [charging, setCharging] = useState(false);
  const [ripple, setRipple] = useState(false);

  function startHold() {
    decipherArmed.current = false;
    longPressTriggered.current = false;

    setCharging(true);

    holdTimer.current = setTimeout(() => {
      decipherArmed.current = true;
      longPressTriggered.current = true;

      // stronger vibration for decipher
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    }, 600);
  }

  function endHold() {
    clearTimeout(holdTimer.current);
    setCharging(false);

    if (longPressTriggered.current && !typing) {
      fireRipple();
      onSend({ forceDecipher: true });
    }

    decipherArmed.current = false;
    longPressTriggered.current = false;
  }

  function fireRipple() {
    setRipple(true);
    if (navigator.vibrate) navigator.vibrate(10); // tap feedback
    setTimeout(() => setRipple(false), 400);
  }

  function handleClick() {
    if (typing) return;
    if (!input.trim()) return;

    fireRipple();
    onSend({ forceDecipher: false });
  }

  const hasText = Boolean(input.trim());

  return (
    <div
      style={{
        ...styles.inputWrap,
        padding: "12px",
      }}
    >
      <input
        style={{
          ...styles.input,
          flex: 1,
          fontSize: 16,
          padding: "14px 16px",
        }}
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

          // ⭐ BIGGER BUTTON
          width: 58,
          height: 58,
          fontSize: 20,

          transform: charging ? "scale(0.94)" : "scale(1)",

          animation: hasText && !charging ? "cipherPulse 2s infinite" : "none",

          boxShadow: charging
            ? "0 0 20px rgba(255,90,90,0.8), 0 0 35px rgba(255,90,90,0.5)"
            : hasText
            ? "0 0 14px rgba(140,100,255,0.45)"
            : "none",

          position: "relative",
          overflow: "hidden",
          transition: "all 0.15s ease",
        }}
      >
        ➤

        {/* ⭐ RIPPLE */}
        {ripple && <span className="ripple" />}
      </button>

      <style jsx>{`
        @keyframes cipherPulse {
          0% { box-shadow: 0 0 0 rgba(140,100,255,0.0); }
          50% { box-shadow: 0 0 14px rgba(140,100,255,0.45); }
          100% { box-shadow: 0 0 0 rgba(140,100,255,0.0); }
        }

        .ripple {
          position: absolute;
          width: 10px;
          height: 10px;
          background: rgba(255,255,255,0.6);
          border-radius: 50%;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          animation: rippleOut 0.4s ease-out forwards;
        }

        @keyframes rippleOut {
          from {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(12);
          }
        }
      `}</style>
    </div>
  );
}
