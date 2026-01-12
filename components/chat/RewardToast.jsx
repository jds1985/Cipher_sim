import { useEffect } from "react";

export default function RewardToast({ message, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 2200);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div style={styles.toast}>
      {message}
    </div>
  );
}

const styles = {
  toast: {
    position: "fixed",
    bottom: 90,
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    color: "white",
    padding: "12px 18px",
    borderRadius: 14,
    fontWeight: 700,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    zIndex: 9999,
    animation: "fadeIn 0.25s ease-out",
  },
};
