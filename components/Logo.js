import { useId } from "react";

export function LogoMark({ size = 36 }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="8" y1="8" x2="60" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e6bff" />
          <stop offset=".5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#9dff3a" />
        </linearGradient>
      </defs>
      <path d="M48 22.5 32 13 14 23.5v17L32 51l16-9.5" stroke={`url(#g${id})`} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M48 22.5h6M48 41.5h6" stroke={`url(#g${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="57" cy="22.5" r="3" fill="#9dff3a" />
      <circle cx="57" cy="41.5" r="3" fill="#9dff3a" />
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
