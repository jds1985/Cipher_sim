// © 2026 Cipher CTS. All Rights Reserved.
// Product icon family: "Hex Colony" logos. Source art: /workspace/brand/product_logos_colony/*_dark.jpg
// Icon-only crops (wordmark removed, background made transparent) live in /public/logos.
// Decorative only: always render the product name as text beside it.
export const ICON_SLUGS = ["cipher", "cipher-bot", "cipher-studio", "cipher-concierge", "hlc"];

export default function ProductIcon({ slug, size = 40, className = "" }) {
  if (!ICON_SLUGS.includes(slug)) return null;
  const src = size > 128 ? `/logos/${slug}-icon-512.webp` : `/logos/${slug}-icon-128.webp`;
  return (
    <img className={className} src={src} srcSet={`/logos/${slug}-icon-128.webp 128w, /logos/${slug}-icon-512.webp 512w`}
      sizes={`${size}px`} width={size} height={size} alt="" aria-hidden="true" decoding="async" style={{ display: "block", objectFit: "contain" }} />
  );
}

// Full logo (icon + product name wordmark) for the top of each product page. Not decorative.
export function ProductLogo({ slug, name, className = "" }) {
  if (!ICON_SLUGS.includes(slug)) return null;
  return (
    <img className={className} src={`/logos/${slug}-full.webp`} alt={`${name} logo`} width={320} height={320}
      decoding="async" style={{ display: "block", objectFit: "contain", height: "auto" }} />
  );
}
