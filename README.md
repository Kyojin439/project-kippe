# Kippe

Unofficial **mobile-first prototype** for [kippenstummel.de](https://kippenstummel.de) moderators.

It is **not** the live product, **not** wired to production, and **not** a 1:1 visual copy. English UI. Example pins around Cologne.

## What it shows

1. **Reasoned downvotes** — wrong location / empty / broken / other, plus an optional reviewer note.
2. **Creator karma** — register is +5 (as live). Casting a vote stays ±0. Receiving a downvote hits the creator only when the reason and pin age say it should.
3. **Moderation labels** — Flagged / Unremarkable / Review from those reasons and timestamps.

Tune weights in `src/domain/karma.ts`.

## Run

```bash
npm install
npm run dev
npm test
npm run build
```

## Install on iPhone (free HTTPS)

An APK cannot run on iOS. After GitHub Pages deploy:

1. Open the live URL in **Safari** (must be `https://`).
2. Tap **Share** → **Add to Home Screen** → **Add**.

The app opens full-screen like a native demo. No paid hosting required.

18+ demo. Does not sell tobacco.
