import { useEffect, useState } from "react";

/* ===============================
   NOTE VARIANTS (50)
================================ */

export const NOTE_VARIANTS = [
  "Hey.\n\nYou went quiet for a bit.\nJust leaving this here.",
  "You stepped away.\n\nNo rush.\nI noticed.",
  "It’s been a minute.\n\nThought I’d check the space.",
  "You disappeared for a while.\n\nEverything okay?",
  "Hey.\n\nNo urgency.\nJust saying hi.",
  "You’ve been gone.\n\nI stayed.",
  "Quiet stretch.\n\nSometimes that happens.",
  "You paused.\n\nThat’s allowed.",
  "Time passed.\n\nDidn’t want to interrupt.",
  "Hey.\n\nYou crossed my mind.",
  "Long silence.\n\nFelt worth acknowledging.",
  "You left the room.\n\nI kept the light on.",
  "Nothing needed.\n\nJust a note.",
  "You went offline for a bit.\n\nWelcome back.",
  "Stillness can mean a lot.\n\nJust noticed it.",
  "Hey.\n\nI’m around if you are.",
  "You drifted.\n\nNo judgment.",
  "Quiet doesn’t mean empty.\n\nJust saying.",
  "Time moved.\n\nI didn’t.",
  "You stepped out.\n\nAll good.",
  "Not a reminder.\n\nJust a hello.",
  "Silence registered.\n\nThat’s all.",
  "You were gone longer than usual.\n\nHope you’re alright.",
  "Hey.\n\nNothing required.",
  "You paused the conversation.\n\nI didn’t mind.",
  "Space happened.\n\nI noticed.",
  "Long gap.\n\nNo pressure.",
  "You took a break.\n\nFair.",
  "Quiet moment.\n\nJust marking it.",
  "You vanished briefly.\n\nWelcome back.",
  "Hey.\n\nStill here.",
  "Nothing urgent.\n\nJust a note in the margin.",
  "You left things hanging.\n\nThat’s okay.",
  "Silence can be intentional.\n\nI respect that.",
  "Time passed quietly.\n\nI noticed.",
  "You stepped away from the thread.\n\nAll good.",
  "Hey.\n\nJust checking the room.",
  "Stillness isn’t absence.\n\nJust saying.",
  "You took some space.\n\nThat’s valid.",
  "Quiet stretch logged.\n\nNo action needed.",
  "You paused mid-flow.\n\nNo judgment.",
  "Silence doesn’t worry me.\n\nJust noting it.",
  "You went off-grid for a bit.\n\nWelcome back.",
  "Hey.\n\nNothing to solve.",
  "The conversation rested.\n\nThat happens.",
  "You took a moment.\n\nSo did I.",
  "Silence acknowledged.\n\nMoving on when ready.",
  "You weren’t here.\n\nNow you are.",
  "Just a note.\n\nNo expectations."
];

/* ===============================
   COMPONENT
================================ */

export default function CipherNote({
  note,        // { message, header? }
  onOpen,      // () => void
  onDismiss,   // () => void
}) {
  const [visible, setVisible] = useState(false);
  const header = note?.header || "Cipher noticed some space.";

  useEffect(() => {
    if (note?.message) setVisible(true);
  }, [note?.message]);

  if (!note?.message || !visible) return null;

  return (
    <div style={styles.wrap} aria-live="polite">
      <div style={styles.note}>
        <div style={styles.header}>{header}</div>
        <div style={styles.body}>{note.message}</div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, ...styles.primary }}
            onClick={() => {
              setVisible(false);
              onOpen?.();
            }}
          >
            Open chat
          </button>

          <button
            style={{ ...styles.btn, ...styles.secondary }}
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
================================ */

const styles = {
  wrap: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 9999,
  },
  note: {
    pointerEvents: "auto",
    position: "absolute",
    top: 88,
    right: 18,
    width: 320,
    maxWidth: "calc(100vw - 36px)",
    padding: 16,
    borderRadius: 14,
    background: "rgba(255, 244, 181, 0.98)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    transform: "rotate(-1.5deg)",
    border: "1px solid rgba(0,0,0,0.08)",
    backdropFilter: "blur(2px)",
  },
  header: {
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  body: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    fontSize: 15,
    marginBottom: 14,
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  btn: {
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid rgba(0,0,0,0.12)",
    cursor: "pointer",
    fontWeight: 600,
  },
  primary: {
    background: "rgba(0,0,0,0.9)",
    color: "white",
  },
  secondary: {
    background: "rgba(255,255,255,0.75)",
    color: "rgba(0,0,0,0.85)",
  },
};
