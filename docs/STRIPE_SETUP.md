# HLC Commercial License: Stripe setup guide

This guide turns on the **"Purchase Commercial Production License"** button on `/hlc`.
Until every step is done, the button shows **"Online purchase opens soon"** and nothing can be charged.
Nothing in the code contains a key. You add keys in Vercel only.

## How it works (the short version)

1. A visitor clicks the button on `/hlc`. The site calls `POST /api/checkout`, which creates a Stripe Checkout page: **$499 per asset per year**, 1 to 50 assets, chosen by the buyer on Stripe's page. Stripe collects the email address.
2. Stripe takes the payment and tells us by calling `POST /api/webhook`. The site checks Stripe's signature.
3. For a **paid** session the site emails the buyer a **signed link that works one time and expires after 72 hours**.
4. The link opens `/api/download`. The buyer presses "Download now". The first press delivers the file. Any later use is refused.
5. Renewals (`invoice.paid`) are only written to the log. No second email is sent.

Files: `pages/api/checkout.js`, `pages/api/webhook.js`, `pages/api/download.js` (logic in `lib/hlc/license/`).
These are *Pages Router* API routes, because this site uses the `pages/` folder. Next.js `app/api/.../route.ts` files would not fit next to it.

## Step 0. Start in TEST mode (no bank account needed)

Stripe has a **test mode**. Test keys start with `sk_test_` and `pk_test_`. No real money moves and no bank account is needed.
Do all of steps 1 to 6 in test mode first. Use the fake card `4242 4242 4242 4242`, any future date, any 3 digits.

## Step 1. Create the Stripe account

1. Go to https://dashboard.stripe.com/register and sign up with the business email.
2. To **take real money** Stripe will ask for business details, an identity check and a **bank account for payouts**. A bank account is not set up yet, so real payments cannot be switched on until it is. Test mode works without it.
3. In the Dashboard, copy the keys from **Developers > API keys**: the *Publishable key* and the *Secret key*.

## Step 2. Free services the site needs

| Need | Free option | Where the value goes |
|---|---|---|
| Remember "link already used" and "email already sent" | **Upstash Redis** (Vercel Marketplace > Upstash, or https://upstash.com). Create a database and copy the **REST URL** and **REST token**. | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| Send the email | **Resend** (https://resend.com). The site already uses it for the recruit form. Verify the domain `ciphercts.com`, create an API key. | `RESEND_API_KEY`, `FROM_EMAIL` (for example `licensing@ciphercts.com`) |
| Store the private package | Any **private** storage: a private bucket (Vercel Blob private, S3, Cloudflare R2) with a long-lived signed URL, or a file on a server you control. **Never** put it in `public/`. | `PRODUCTION_PACKAGE_URL` |

Make a link-signing secret yourself: in a terminal run `openssl rand -hex 32` and use the result as `DOWNLOAD_LINK_SECRET`.

**Important:** if `PRODUCTION_PACKAGE_URL` is a web address, anyone who learns it can download the file. Use a signed URL that expires, or rotate it after launch. The one-time link protects the *email link*, and the storage protects the *file*.

## Step 3. Put the values in Vercel

Vercel > the project > **Settings > Environment Variables**. Add each name from `.env.example`:

`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (step 4), optionally `STRIPE_REQUIRE_TERMS_CHECKBOX` (see step 6), `DOWNLOAD_LINK_SECRET`, `PRODUCTION_PACKAGE_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `RESEND_API_KEY`, `FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` (`https://ciphercts.com`).

Then **redeploy**. `NEXT_PUBLIC_...` values are baked in at build time, so a redeploy is required for the button to switch on.
Use test keys for Preview and real keys for Production only when you are ready.

## Step 4. Connect the webhook

1. Stripe Dashboard > **Developers > Webhooks > Add endpoint**.
2. Endpoint URL: `https://ciphercts.com/api/webhook`
3. Select events: **`checkout.session.completed`** and **`invoice.paid`**.
4. Save, then copy the **Signing secret** (starts with `whsec_`) into Vercel as `STRIPE_WEBHOOK_SECRET`, and redeploy.

If anything is missing (email, link secret, store, package address) the webhook answers an error on purpose, so Stripe **retries for up to 3 days** and no paid customer is silently skipped. Watch the Vercel function logs for `[hlc webhook]`.

## Step 5. Test it with the Stripe CLI

```bash
# one time: https://docs.stripe.com/stripe-cli   (then: stripe login)
stripe listen --forward-to localhost:3000/api/webhook
# it prints a signing secret "whsec_..." : put it in .env.local as STRIPE_WEBHOOK_SECRET

# in a second terminal
npm run dev
# open http://localhost:3000/hlc , press Purchase, pay with 4242 4242 4242 4242
# or fire a sample event:
stripe trigger checkout.session.completed
```

Note: `stripe trigger` sends a sample that does not carry our `product` marker, so the site correctly **ignores** it. Real test purchases from the button do carry it and send the email.
Automatic checks that need no keys at all: `npm test`.

## Step 6. Before real money: legal and tax reminders

- **Terms.** The page `/hlc/commercial-terms` (source: `content/hlc/HLC_COMMERCIAL_TERMS.txt`) is the **Cipher CTS Commercial License Terms**, Version 1.0, October 26, 2026. It is linked from the purchase card, shown on the Stripe Checkout page and linked in the delivery email. It is an **AI-written plain-English template, not legal advice. Have a lawyer review it before real sales** (refund wording, liability cap, Tennessee law, sales tax, and your own support promise). It is deliberately NOT inside the free evaluation zip, whose `LICENSE` is the separate Cipher CTS Proprietary Evaluation License.
- **How Checkout shows the terms.** By default the Stripe page carries the link in `custom_text.submit` ("By completing this purchase you agree to the Cipher CTS Commercial License Terms: <link>"). This needs no dashboard setup and cannot fail. If you want Stripe's required **"I agree" checkbox** as well (`consent_collection.terms_of_service = required`), first save a *Terms of service URL* (`https://ciphercts.com/hlc/commercial-terms`) in **Stripe Dashboard > Settings > Public details**, then set `STRIPE_REQUIRE_TERMS_CHECKBOX=true` in Vercel and redeploy. Stripe refuses the checkbox until that URL is saved, so if you set the flag too early the site logs it and falls back to the link-only version instead of breaking the checkout.
- **Tax.** Check **Stripe Dashboard > Settings > Tax** (Stripe Tax) and your state/country sales-tax or VAT duties before going live. The checkout code does not add tax by itself.
- **Business details.** Business name on the Stripe account should match "Cipher CTS" so customers recognise the charge.

## Open item: what is in the "full production package"?

The contents of the paid production package are **not defined yet**. Nothing in this repo creates it, and the page does not describe its contents (the card lists only the license rights, the agreement and support). Decide what it contains, build it, upload it to private storage, and set `PRODUCTION_PACKAGE_URL`. Please do not sell before this is real.

Features on the card marked **Coming soon** (multi-asset dashboard, custom sensor schema generator) do not exist yet. Remove the "Coming soon" tags in `components/hlc/License.js` only when they are built.

## Support commitment

The card says "Priority support". The commercial terms promise best-effort support on business days and **no response-time number**. If you want to promise one (for example "reply within 2 business days"), add it to `content/hlc/HLC_COMMERCIAL_TERMS.txt` after a lawyer reviews it.

## What the free build is (so the card stays honest)

The free download is the **Evaluation & Benchmarking Build (Personal & Non-Commercial Use Only)** under the Cipher CTS Proprietary Evaluation License. Production, industrial-fleet or revenue-generating use needs the paid commercial license, which this purchase provides per asset. The card says exactly that and lists only what exists today; "Multi-asset dashboard license" and "Custom sensor schema generator" carry a visible **Coming soon** tag. Custom fleet or telemetry deals go through the separate contact card (team@ciphercts.com).
