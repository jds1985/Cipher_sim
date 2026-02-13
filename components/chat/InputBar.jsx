// components/chat/InputBar.jsx
import { useRef, useState } from "react";

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
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setRipple(false), 400);
  }

  function handleClick() {
    if (typing) return;
    if (!input.trim()) return;

    fireRipple();
    onSend({ forceDecipher: false });
  }

  return (
    <div className="cipher-input-wrap">
      <input
        className="cipher-input"
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
        className={`cipher-send ${charging ? "charging" : ""}`}
      >
        ➤
        {ripple && <span className="ripple" />}
      </button>

      <style jsx>{`
        .cipher-send {
          width: 58px;
          height: 58px;
          font-size: 20px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255,255,255,0.05);
          color: white;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;
        }

        .cipher-send:hover {
          background: rgba(0, 255, 200, 0.18);
          box-shadow: 0 0 10px rgba(0, 255, 200, 0.5);
        }

        .cipher-send.charging {
          box-shadow:
            0 0 20px rgba(255,90,90,0.8),
            0 0 35px rgba(255,90,90,0.5);
          transform: scale(0.94);
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
