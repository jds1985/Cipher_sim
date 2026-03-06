import { useRef, useState } from "react";

export default function InputBar({
  input,
  setInput,
  onSend,
  typing,
  remainingTokens = 0,
  tokenLimit = 50000
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

  // 🔋 Power calculations
  const percent = Math.max(0, Math.min(100, Math.round((remainingTokens / tokenLimit) * 100)));

  return (
    <div className="cipher-input-wrap">

      {/* 🔋 AI POWER METER */}
      <div style={{
        marginBottom: 10,
        padding: "6px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        fontSize: 12,
        color: "rgba(255,255,255,0.85)"
      }}>
        ⚡ AI Power Remaining: {percent}%
        <div style={{
          height: 6,
          borderRadius: 6,
          background: "rgba(255,255,255,0.08)",
          marginTop: 6,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${percent}%`,
            height: "100%",
            background: percent > 50
              ? "linear-gradient(90deg,#00ffc8,#5a46ff)"
              : percent > 20
              ? "linear-gradient(90deg,#ffd166,#ff8a00)"
              : "linear-gradient(90deg,#ff4d4d,#b30000)",
            transition: "width 0.4s ease"
          }} />
        </div>
      </div>

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
