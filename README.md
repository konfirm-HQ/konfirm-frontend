# konfirm-frontend

The customer- and merchant-facing pages for [Konfirm](https://github.com/samuel2926i39-art/konfirm-backend), a non-custodial payment processor on Stellar.

Sibling repos: [konfirm-backend](https://github.com/samuel2926i39-art/konfirm-backend) (the API these pages call) and [konfirm-contracts](https://github.com/samuel2926i39-art/konfirm-contracts) (Soroban contracts, not yet in the live request path).

## Pages

| Page | Route | Purpose |
|---|---|---|
| `public/signup.html` | `/signup` | Merchant account creation — business name, email, password, Stellar payout address |
| `public/login.html` | `/login` | Merchant login |
| `public/new.html` | `/new` | Create a payment link — amount, XLM/USDC toggle, description |
| `public/pay.html` | `/pay/:linkId` | Checkout — Freighter *or* a SEP-7 QR code / tappable link for any Stellar mobile wallet, whichever the payer finishes first |
| `public/activity.html` | `/activity` | Merchant dashboard — live payment feed, polls every 3s, per-asset totals |
| `public/cashout.html` | `/cashout` | Fiat off-ramp — real SEP-10/SEP-24 flow against Stellar's reference anchor |
| `public/vendor/qrcode.js` | — | Vendored QR encoder (MIT, kazuhikoarase/qrcode-generator) |

## Tech approach

No framework, no bundler, no build step — plain HTML, CSS custom properties, and vanilla JS `<script type="module">` per page. This is a deliberate choice for a pilot this size: every page is small enough that a build pipeline would add more overhead than it saves, and it keeps "edit a file, refresh the browser" as the entire feedback loop.

The one external dependency loaded at runtime is `@stellar/freighter-api`, imported from `esm.sh` in `pay.html` and `cashout.html`. The QR encoder is vendored rather than CDN-loaded on purpose — after tracing several bugs back to trusting an unverified CDN library's shape, anything whose exact behavior mattered got pulled in-repo instead.

## Running it locally

These pages aren't a standalone app today — see [Current state](#current-state). To actually exercise them, run [konfirm-backend](https://github.com/samuel2926i39-art/konfirm-backend) (which serves its own copy of this same `public/` directory) and open `http://localhost:4001`.

## Current state

Every page assumes it's running same-origin with the API: auth uses an httpOnly session cookie, and each script does `const API_BASE = window.location.origin`. This repo is the versioned source of the frontend, not an independently running site — the copy actually served today lives in `konfirm-backend/public/`.

Splitting this into a genuinely separately-deployed frontend (its own host, its own origin) would need:
- CORS enabled on the backend
- Cookie `SameSite`/`Secure` settings changed for cross-origin use
- `API_BASE` pointed at a configured backend URL instead of `window.location.origin`

None of that has been done yet.

## Design language

Dark by design, not by default — every page shares the same token set (`--ink`, `--surface`, `--accent`, etc.) defined inline per page rather than a shared stylesheet, matching the no-build-step approach. Status copy is written for the person using it: no "session," "reconciler," or "screening" ever reaches a customer-facing screen, and raw errors are filtered through an allowlist (`friendlyMessage()` in each page) before they're shown — anything not explicitly recognized falls back to a generic message, with the real error going to the console instead.

## License

No license file yet — private project, all rights reserved by default.
