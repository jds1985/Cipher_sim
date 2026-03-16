import { useEffect, useState } from "react";

export default function BootScreen({ onComplete }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setTimeout(() => setActive(true), 200);

    const audio = new Audio("/sounds/power.mp3");
    setTimeout(() => {
      audio.play().catch(() => {});
    }, 900);

    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="boot-container">
      <img
        src="/icons/cipher-512.png"
        className={`boot-logo ${active ? "boot-active" : ""}`}
      />
    </div>
  );
}
