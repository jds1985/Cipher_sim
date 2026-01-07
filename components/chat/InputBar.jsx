// components/chat/InputBar.jsx
import { styles } from "./ChatStyles";

export default function InputBar({ input, setInput, onSend, typing }) {
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div style={styles.inputRow}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Talk to Cipher…"
        style={styles.input}
        disabled={typing}
      />
      <button onClick={onSend} style={styles.send} disabled={typing}>
        Send
      </button>
    </div>
  );
}
