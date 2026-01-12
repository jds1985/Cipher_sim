// components/chat/RewardToast.jsx
import { useEffect } from "react";

export default function RewardToast({ message, onClose, duration = 2400 }) {
  useEffect(() => {
    const id = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  return (
    <div style={toastStyles.wrap} onClick={() => onClose?.()}>
      <div style={toastStyles.card}>
        <div style={toastStyles.text}>{message}</div>
      </div>
    </div>
  );
}

const toastStyles = {
  wrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 18,
    display: "flex",
    justifyContent: "center",
    zIndex: 10050,
    padding: "0 14px",
    pointerEvents: "auto",
  },
  card: {
    width: "min(520px, 100%)",
    background: "rgba(10,15,42,0.92)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 14,
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
    padding: "12px 14px",
    backdropFilter: "blur(10px)",
  },
  text: {
    color: "white",
    fontWeight: 700,
    letterSpacing: 0.2,
  },
};
