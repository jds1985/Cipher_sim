// components/chat/InputBar.jsx
import { useRef } from "react";
import { styles } from "./ChatStyles";

export default function InputBar({
  input,
  setInput,
  onSend,
  typing,
}) {
  const holdTimer = useRef(null);
  const decipherArmed = useRef(false);
  const suppressClick = useRef(false);

  function startHold() {
    decipherArmed.current = false;
    suppressClick.current = false;

    holdTimer.current = setTimeout(() => {
      decipherArmed.current = true;
      suppressClick.current = true;

      // 📳 haptic feedback
      if (navigator.vibrate) navigator.vibrate(15);
    }, 600);
  }

  function endHold() {
    clearTimeout(holdTimer.current);
  }

  function handleSend(e) {
    // 🚫 stop synthetic click after long-press
    if (suppressClick.current && e?.type === "click") {
      suppressClick.current = false;
      return;
    }

    if (typing) return;

    const forceDecipher = decipherArmed.current;

    decipherArmed.current = false;
    suppressClick.current = false;

    onSend({ forceDecipher });
  }

  return (
    <div style={styles.inputWrap}>
      <input
        style={styles.input}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Talk to Cipher…"
        disabled={typing}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend(e);
        }}
      />

      <button
        style={styles.sendBtn}
        disabled={typing}
        title="Hold to Decipher"
        onTouchStart={startHold}
        onTouchEnd={endHold}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onClick={handleSend}
      >
        ➤
      </button>
    </div>
  );
}
