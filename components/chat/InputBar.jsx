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
            className={`cipher-send-btn ${charging ? "charging" : ""}`}
          >
            {/* 🔥 PRO ARROW */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>

            {ripple && <span className="ripple" />}
          </button>
        </div>
      </div>
    </div>
  );
}
