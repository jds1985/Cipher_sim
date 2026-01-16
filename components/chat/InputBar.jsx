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
  const longPressTriggered = useRef(false);

  function startHold() {
    decipherArmed.current = false;
    longPressTriggered.current = false;

    holdTimer.current = setTimeout(() => {
      decipherArmed.current = true;
      longPressTriggered.current = true;

      // 📳 haptic feedback
      if (navigator.vibrate) navigator.vibrate(15);
    }, 600);
  }

  function endHold() {
    clearTimeout(holdTimer.current);

    // 🔥 MOBILE: fire immediately on long-press release
    if (longPressTriggered.current && !typing) {
      onSend({ forceDecipher: true });
    }

    decipherArmed.current = false;
    longPressTriggered.current = false;
  }

  function handleClick() {
    // 🖱 desktop / short tap
    if (typing) return;
    onSend({ forceDecipher: false });
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
          if (e.key === "Enter") handleClick();
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
        onClick={handleClick}
      >
        ➤
      </button>
    </div>
  );
}
