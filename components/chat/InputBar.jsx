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
  const isLongPress = useRef(false);

  function startHold() {
    isLongPress.current = false;

    holdTimer.current = setTimeout(() => {
      isLongPress.current = true;
    }, 600); // ⏱ long-press threshold
  }

  function endHold() {
    clearTimeout(holdTimer.current);
  }

  function handleSend() {
    if (typing) return;

    // snapshot the flag
    const forceDecipher = isLongPress.current;

    // 🔥 RESET IMMEDIATELY — this is the fix
    isLongPress.current = false;

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
          if (e.key === "Enter") handleSend();
        }}
      />

      <button
        style={styles.sendBtn}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        onClick={handleSend}
        disabled={typing}
        title="Hold to Decipher"
      >
        ➤
      </button>
    </div>
  );
}
