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

  function handlePointerDown() {
    if (typing) return;

    longPressTriggered.current = false;

    holdTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
    }, 600); // ⏱ long-press threshold
  }

  function handlePointerUp() {
    if (typing) return;

    clearTimeout(holdTimer.current);

    onSend({ forceDecipher: longPressTriggered.current });
    longPressTriggered.current = false;
  }

  function handlePointerLeave() {
    clearTimeout(holdTimer.current);
    longPressTriggered.current = false;
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
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        disabled={typing}
        title="Hold to Decipher"
      >
        ➤
      </button>
    </div>
  );
}
