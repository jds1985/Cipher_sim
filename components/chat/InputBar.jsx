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
  const longPressTriggered = useRef(false);

  function startHold() {
    if (typing) return;

    longPressTriggered.current = false;

    holdTimer.current = setTimeout(() => {
      longPressTriggered.current = true;

      // haptic feedback
      if (navigator.vibrate) navigator.vibrate(20);
    }, 600);
  }

  function endHold() {
    clearTimeout(holdTimer.current);

    if (typing) return;
    if (!input || !input.trim()) return;

    // 🔥 THIS IS THE KEY
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      onSend({ forceDecipher: true });
    } else {
      onSend({ forceDecipher: false });
    }
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
          if (e.key === "Enter") {
            onSend({ forceDecipher: false });
          }
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
      >
        ➤
      </button>
    </div>
  );
}
