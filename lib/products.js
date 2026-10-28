// © 2026 Cipher CTS. All Rights Reserved.
// Single source of truth for the products on the homepage and for each product page (pages/<slug>.js).
// RULE: only facts that are true. Where something is unknown, status stays "Coming soon" and the copy says only what the card says.
// To add a product "the same way as HLC": add an entry here, add pages/<slug>.js, and pass `purchase` / `download` slots to <ProductPage>.

export const CONTACT = "team@ciphercts.com";
export const SITE = "https://ciphercts.com";

export const STATUS = {
  available: "Available",
  development: "In development",
  soon: "Coming soon",
};

export const products = [
  {
    slug: "cipher",
    sellable: true, // paid flow is built but OFF until CIPHER_PURCHASE_ENABLED is set (see docs/STRIPE_SETUP.md)
    name: "Cipher",
    status: "soon",
    cardTag: "Coming soon",
    cardDesc: "An on-device AI assistant. Your conversations stay on your phone, not on anyone's servers.",
    summary: "An on-device AI assistant. Your conversations stay on your phone, not on anyone's servers.",
    what: [
      "Cipher is a private AI assistant that runs on your phone instead of on a server.",
      "It is powered by Cipher 2.0, a 369M-parameter ternary model made by Cipher CTS. No third-party AI is used in it.",
    ],
    points: [
      { title: "Stays on your phone", text: "Your conversations stay on your phone, not on anyone's servers." },
      { title: "Our own model", text: "Cipher 2.0 is a 369M-parameter ternary model built by Cipher CTS. Every weight is −1, 0 or +1." },
      { title: "No third-party AI", text: "Nothing in Cipher calls out to someone else's AI service." },
      { title: "Zero data extraction", text: "Intelligent Systems. Zero Data Extraction." },
    ],
    statusNote: "Cipher is not released yet. There is nothing to download today. Ask for early access and we will write to you.",
    primary: { label: "Get early access", href: "/#early-access" },
  },
  {
    slug: "cipher-bot",
    sellable: true, // paid flow is built but OFF until CIPHER_BOT_PURCHASE_ENABLED is set (see docs/STRIPE_SETUP.md)
    name: "Cipher Bot",
    status: "soon",
    cardTag: "Coming soon",
    cardDesc: "A local AI agent that works for you on your own machine, with your files and data never leaving it.",
    summary: "A local AI agent that works for you on your own machine, with your files and data never leaving it.",
    what: [
      "Cipher Bot is a local-first desktop app for making simple chat bots and talking to them.",
      "Every reply comes from Cipher, our own model, which is built into the app and runs on your computer.",
    ],
    points: [
      { title: "Runs on your own machine", text: "The model runs on your computer. Your files and data never leave it." },
      { title: "Our own model", text: "Replies come from Cipher, made by Cipher CTS. There is no third-party model." },
      { title: "No cloud server", text: "No cloud server, no account and no telemetry." },
      { title: "No model download", text: "The model ships inside the app, so there is nothing extra to fetch." },
    ],
    statusNote: "Cipher Bot is not released yet. There is nothing to download today. Ask for early access and we will write to you.",
    primary: { label: "Get early access", href: "/#early-access" },
  },
  {
    slug: "cipher-studio",
    sellable: true, // paid flow is built but OFF until CIPHER_STUDIO_PURCHASE_ENABLED is set (see docs/STRIPE_SETUP.md)
    name: "Cipher Studio",
    status: "soon",
    cardTag: "Coming soon",
    cardDesc: "Build your own private AI, step by step. Shape a model that is yours alone.",
    summary: "Build your own private AI, step by step. Shape a model that is yours alone.",
    what: [
      "Cipher Studio is where you build your own private AI, one easy step at a time.",
      "It is still being designed. The direction below is what we are working toward, and it may change before release.",
    ],
    points: [
      { title: "Easy steps", text: "Pick a starting idea, give your AI a name, colour and badge, and shape how it behaves. No jargon." },
      { title: "Teach it your own files", text: "Files you give it are read on your computer and are not sent anywhere." },
      { title: "Saved as one file", text: "Each AI is meant to be saved as a single file you can keep or share." },
      { title: "Private by design", text: "Works offline with no account. Built on Cipher, our own model." },
    ],
    statusNote: "Cipher Studio is not released yet. There is nothing to download today. Ask for early access and we will write to you.",
    primary: { label: "Get early access", href: "/#early-access" },
  },
  {
    slug: "cipher-concierge",
    name: "Cipher Concierge",
    status: "available",
    cardTag: "Available now",
    live: true,
    cardDesc: "Hotel guest AI delivered through an in-room QR code. Instant 24/7 guest service with no extra hardware.",
    summary: "Hotel guest AI delivered through an in-room QR code. Instant 24/7 guest service with no extra hardware.",
    what: [
      "Cipher Concierge is a private hotel concierge. Guests reach it by scanning a QR card in their room, so there is no app to install and no extra hardware.",
      "It runs only on Cipher 2.0, Cipher CTS's own model. No third-party AI, CDN, fonts or analytics.",
    ],
    points: [
      { title: "A QR card in the room", text: "Guests scan the card in their room to start chatting. Each room's card carries its own signed code." },
      { title: "Answers from the hotel's own information", text: "Common questions such as check-out, Wi-Fi, breakfast, parking and pool hours are answered from the hotel's own file." },
      { title: "Never invents facts", text: "If the hotel has not provided an answer, the guest is sent to the front desk with a tap-to-call button." },
      { title: "Private", text: "Nothing is stored on our servers, and message content is never logged. The chat lives only in the guest's browser tab." },
    ],
    statusNote: "The public demo uses sample hotel information. Real hotel details are added one hotel file at a time.",
    primary: { label: "Visit Concierge", href: "https://cipher-concierge.vercel.app", external: true },
  },
  {
    // HLC has its own page and purchase/download flow at /hlc. It is only linked from here.
    slug: "hlc",
    name: "HLC",
    status: "available",
    cardTag: "Try it now",
    live: true,
    wide: true,
    href: "/hlc",
    sellable: true, // has the paid flow (see purchaseOf below); HLC keeps its original env var names
    cardCta: "Open the HLC dashboard and download →",
    cardDesc: "Hierarchical Latent Controller: local predictive maintenance. Estimates how many operating cycles of life a machine has left, on your own computer. Try the live dashboard and download the engine.",
    ownPage: true,
  },
];

export const pageProducts = products.filter((p) => !p.ownPage);
export const getProduct = (slug) => products.find((p) => p.slug === slug);
export const productHref = (p) => p.href || `/${p.slug}`;

// ---------------------------------------------------------------------------------------------------------------------
// Paid flow (Stripe Checkout, webhook, emailed one-time download link). One pattern for every `sellable` product.
// Everything is OFF by default. Only env var NAMES live here, never values, prices or secrets.
// Cipher Concierge is a hosted hotel service delivered by QR code, not a download, so it is not `sellable`.
// ---------------------------------------------------------------------------------------------------------------------
export const envSuffix = (slug) => String(slug).toUpperCase().replace(/-/g, "_");

/** Purchase settings for one product (by slug), or null when the product is not sellable. */
export function purchaseOf(slug) {
  const p = getProduct(slug);
  if (!p || !p.sellable) return null;
  const S = envSuffix(slug);
  const legacy = slug === "hlc"; // HLC shipped first and keeps its original names, price and behaviour exactly
  return {
    id: slug,
    name: p.name,
    key: legacy ? "hlc-commercial" : slug, // Stripe session metadata.product
    kv: slug, // store key prefix: `${kv}:email:<session>` and `${kv}:dl:<jti>`
    flag: `${S}_PURCHASE_ENABLED`, // server switch (exactly "true" opens /api/checkout for this product)
    publicFlag: `NEXT_PUBLIC_${S}_PURCHASE_ENABLED`, // page switch (shows the Purchase button); set both
    packageUrlVar: legacy ? "PRODUCTION_PACKAGE_URL" : `PRODUCTION_PACKAGE_URL_${S}`,
    priceIdVar: legacy ? null : `STRIPE_PRICE_ID_${S}`, // HLC's price is fixed in code; the others come only from Stripe
    priceLabelVar: legacy ? null : `NEXT_PUBLIC_PRICE_LABEL_${S}`, // optional text such as "$X / year", shown only when set
    returnPath: `/${slug}`,
    termsPath: legacy ? "/hlc/commercial-terms" : null, // other products have no commercial terms page yet
  };
}
export const purchaseProducts = () => products.filter((p) => p.sellable).map((p) => purchaseOf(p.slug));
export const purchaseByKey = (key) => purchaseProducts().find((x) => x.key === key) || null;
