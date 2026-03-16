import { useEffect, useState } from "react";

const bootMessages = [
  "Initializing Cipher Core...",
  "Loading memory nodes...",
  "Connecting models...",
  "Cipher OS Ready"
];

export default function BootScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < bootMessages.length - 1) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 900);
      return () => clearTimeout(timer);
    } else {
      const finish = setTimeout(() => {
        onComplete();
      }, 1200);
      return () => clearTimeout(finish);
    }
  }, [step, onComplete]);

  return (
    <div className="boot-screen">
      <div className="boot-container">
        <div className="boot-logo">
          <img src="/icons/cipher-512.png" alt="Cipher OS" />
        </div>

        <div className="boot-text">
          {bootMessages.slice(0, step + 1).map((msg, i) => (
            <div key={i} className="boot-line">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
