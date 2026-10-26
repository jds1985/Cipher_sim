import { useId } from "react";

// Hex Circuit mark v2 (traced from Jim's reference lockup). Geometry generated from the Cipher brand kit (brand/gen_brand.py, viewBox 64).
export function LogoMark({ size = 36 }) {
  const id = useId().replace(/:/g, "");
  const g = `url(#g${id})`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="5" y1="40" x2="57" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1557F0" />
          <stop offset="0.33" stopColor="#0E8CF8" />
          <stop offset="0.55" stopColor="#2FDDCF" />
          <stop offset="0.8" stopColor="#8CEF60" />
          <stop offset="1" stopColor="#D4EA48" />
        </linearGradient>
      </defs>
      <path d="M53.82,16.94 Q54.60,16.49 53.82,16.04 L34.17,4.70 Q31.40,3.10 28.63,4.70 L8.88,16.10 Q6.11,17.70 6.11,20.90 L6.11,43.70 Q6.11,46.90 8.88,48.50 L28.63,59.90 Q31.40,61.50 34.17,59.90 L53.82,48.56 Q54.60,48.11 53.82,47.66 L46.29,43.31 Q45.51,42.86 44.73,43.31 L32.79,50.20 Q31.40,51.00 30.01,50.20 L16.59,42.45 Q15.21,41.65 15.21,40.05 L15.21,24.55 Q15.21,22.95 16.59,22.15 L30.01,14.40 Q31.40,13.60 32.79,14.40 L44.73,21.29 Q45.51,21.74 46.29,21.29 Z" fill={g} />
      <path d="M31.40,7.15 L9.62,19.72 L9.62,44.87 L31.40,57.45" stroke="#FFFFFF" strokeOpacity="0.13" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52.02,23.41 L42.38,27.79 M57.40,44.50 L48.60,38.30 L45.35,37.80" stroke={g} strokeWidth="1.65" strokeLinejoin="round" />
      <path d="M55.75,22.60 A1.95,1.95 0 1,0 51.85,22.60 A1.95,1.95 0 1,0 55.75,22.60 M42.55,28.60 A1.95,1.95 0 1,0 38.65,28.60 A1.95,1.95 0 1,0 42.55,28.60 M45.35,37.80 A1.95,1.95 0 1,0 41.45,37.80 A1.95,1.95 0 1,0 45.35,37.80" stroke={g} strokeWidth="1.35" />
    </svg>
  );
}

export default function Logo({ size = 36, className = "" }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      <span style={{ fontWeight: 700, fontSize: size * 0.5, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        <span style={{ color: "#fff" }}>Cipher </span>
        <span className="grad-text">CTS</span>
      </span>
    </span>
  );
}
