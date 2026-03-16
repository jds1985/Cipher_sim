import { useEffect, useState } from "react";

export default function BootScreen({ onComplete }) {
  const [line, setLine] = useState("");

  useEffect(() => {
    const steps = [
      "Initializing Cipher Core...",
      "Loading memory nodes...",
      "Connecting models...",
      "Cipher OS ready"
    ];

    let i = 0;

    const interval = setInterval(() => {
      setLine(steps[i]);
      i++;

      if (i === steps.length) {
        clearInterval(interval);
        setTimeout(onComplete, 700);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="boot-container">
      <img src="/icons/cipher-512.png" className="boot-logo" />

      <div className="boot-text">
        {line}
      </div>
    </div>
  );
}
