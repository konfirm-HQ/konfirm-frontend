# konfirm-frontend

The customer- and merchant-facing pages for [Konfirm](https://github.com/samuel2926i39-art/konfirm-backend), a non-custodial payment processor on Stellar.

| Page | Route | Purpose |
|---|---|---|
| `public/signup.html` | `/signup` | Merchant account creation |
| `public/login.html` | `/login` | Merchant login |
| `public/new.html` | `/new` | Create a payment link (amount, currency, description) |
| `public/pay.html` | `/pay/:linkId` | Checkout — Freighter or SEP-7 QR/mobile-wallet |
| `public/activity.html` | `/activity` | Merchant dashboard, live payment feed |
| `public/cashout.html` | `/cashout` | Fiat off-ramp via SEP-10/SEP-24 |
| `public/vendor/qrcode.js` | — | Vendored QR encoder (MIT, kazuhikoarase/qrcode-generator) — not CDN-loaded, so checkout doesn't depend on a third-party host being up |

## Current state

These pages are plain HTML/CSS/vanilla JS with no build step, and today they're served directly by `konfirm-backend` (same copy lives in that repo's `public/`) rather than deployed as an independent site. Every page assumes it's running same-origin with the API — auth uses an httpOnly session cookie, and each script does `const API_BASE = window.location.origin`.

Splitting this into a genuinely separately-deployed frontend (its own host, its own origin) would need:
- CORS enabled on the backend
- Cookie `SameSite`/`Secure` settings changed for cross-origin use
- `API_BASE` pointed at a configured backend URL instead of `window.location.origin`

None of that has been done yet — this repo exists today as the versioned source of the frontend, not as an independently running site.
