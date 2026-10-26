// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
export const CONTACT_EMAIL = "team@ciphercts.com";
const SUBJECT = "HLC Edge Engine: production / fleet licensing inquiry";

export default function ContactCard() {
  return (
    <section className="hx-contact" id="production" aria-labelledby="hx-contact-h" data-testid="contact-card">
      <h2 className="hx-h2" id="hx-contact-h">
        Deploy in Production — Contact Cipher CTS for Fleet Licensing &amp; Custom Telemetry Integration
      </h2>
      <p className="hx-sub">
        The free download above is for personal, non-commercial evaluation and benchmarking only. Production, industrial fleet, or revenue-generating use needs a paid commercial license.
      </p>
      <a
        className="hx-btn hx-btn-primary hx-btn-xl"
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}`}
        data-testid="contact-btn"
      >
        <span aria-hidden="true">✉</span> Email {CONTACT_EMAIL} about production licensing
      </a>
    </section>
  );
}
