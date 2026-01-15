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

  function startHold() {
    decipherArmed.current = false;

    holdTimer.current = setTimeout(() => {
      decipherArmed.current = true;

      // optional haptic (mobile)
      if (navigator.vibrate) navigator.vibrate(15);
    }, 600);
  }

  function endHold() {
    clearTimeout(holdTimer.current);
  }

  function handleSend() {
    if (typing) return;

    const forceDecipher = decipherArmed.current;
    decipherArmed.current = false;

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
