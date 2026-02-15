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
      <div className="cipher-input-shell">
        <div className="cipher-input-inner">
          <input
            className="cipher-input-field"
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
        </div>
      </div>

      <style jsx>{`
        /* WRAP */
        .cipher-input-wrap {
          width: 100%;
        }

        /* OUTER NEON RAIL */
        .cipher-input-shell {
          width: 100%;
          height: 60px;
          border-radius: 18px;
          background: linear-gradient(
            90deg,
            rgba(90,70,255,0.7),
            rgba(0,255,200,0.7)
          );
          padding: 2px;
        }

        /* INNER GLASS */
        .cipher-input-inner {
          height: 100%;
          width: 100%;
          border-radius: 16px;
          background: rgba(5, 8, 18, 0.96);
          backdrop-filter: blur(12px);

          display: flex;
          align-items: center;
          padding: 0 10px 0 16px;
          gap: 10px;
        }

        /* TEXT */
        .cipher-input-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 15px;
        }

        /* SEND BUTTON */
        .cipher-send {
          height: 44px;
          width: 44px;
          border-radius: 12px;
          border: none;

          background: linear-gradient(
            135deg,
            rgba(90,70,255,1),
            rgba(0,255,200,1)
          );

          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;

          box-shadow:
            0 0 12px rgba(0,255,200,0.4),
            0 0 22px rgba(90,70,255,0.35);
        }

        .cipher-send:active {
          transform: scale(0.95);
        }

        /* HOLD CHARGE */
        .cipher-send.charging {
          box-shadow:
            0 0 20px rgba(255,90,90,0.9),
            0 0 40px rgba(255,90,90,0.5);
        }

        /* RIPPLE */
        .ripple {
          position: absolute;
          width: 10px;
          height: 10px;
          background: rgba(255,255,255,0.7);
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
