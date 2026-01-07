// components/chat/CipherNote.jsx
import { noteStyles } from "./ChatStyles";

export default function CipherNote({ note, onOpen, onDismiss }) {
  return (
    <div style={noteStyles.wrap}>
      <div style={noteStyles.note}>
        <div style={noteStyles.glue} />
        <div style={noteStyles.body}>{note.message}</div>
        <div style={noteStyles.actions}>
          <button style={noteStyles.primary} onClick={onOpen}>
            Open chat
          </button>
          <button style={noteStyles.secondary} onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
