# FAQ

中文版见[常见问题](../zh/faq.md).

## Does my password ever leave the page?

No. Generation runs on the Web Crypto API in your browser; the page makes no
runtime network requests and stores nothing but your language choice. See
[Privacy](./privacy.md) for the code-verified breakdown.

## Does it work offline? Can I self-host?

Yes to both. The site is a handful of static files with relative asset
paths — save the repository, open `index.html` directly (`file://`), serve it
with any static file server, or host it anywhere. No build step, no
environment variables, no backend.

## Why does the entropy drop when I tick an advanced option?

Each advanced filter removes whole groups of characters: **Easy to type**
shrinks the pool from 94 to 55, **Easy to read aloud** to 49, both together
to 35. Fewer possibilities per position means fewer bits per character
(log2 94 ≈ 6.55 vs log2 55 ≈ 5.78). The readout always reflects the real
cost — 16 easy-to-type characters still rate ~92 bits, far beyond brute
force.

## Why is the maximum length 64?

A product decision: 64 uniformly random characters already exceed any sane
requirement (a full-ASCII 64-character password carries ~419 bits), and a
bounded slider keeps the UI honest. If you need longer strings, run the core
in Node with a bigger `length` — see
[Password Engine — Detailed Behavior](./features/password-engine.md#detailed-behavior).

## Can I exclude specific characters?

Yes — type them into the **Blacklist** field. Every character you type is
removed from the candidate pool; a class emptied entirely is skipped. See
[Usage — Blacklist](./usage.md#blacklist).

## Which browsers are supported?

Any browser with the Web Crypto API: current Chrome, Edge, Firefox, and
Safari (desktop and mobile). IE 11 is not supported. The clipboard button
needs a secure context (HTTPS, localhost, or file://) or it falls back to a
legacy copy method.

## Are my settings saved between visits?

Only the interface language is. Length, character classes, advanced
options, and blacklist intentionally reset on reload — nothing about your password
habits persists on your machine.

## Is the strength meter a guarantee?

It measures the *generator*, not your usage: the score assumes the string is
uniformly random (true here) and says nothing about reuse, phishing, or
keyloggers. A 4-segment "Excellent" string from this page is unbreakable by
brute force; everything after that is operational security.

## Why does the WeChat tab only show a QR code on mobile?

WeChat's `wxp://` deep links are payment payloads that mobile browsers
cannot reliably launch, so the component deliberately never attempts a jump
for WeChat — it always renders the QR. Alipay, whose official `https://`
link is a normal URL, does attempt the hand-off with an automatic QR
fallback. See [Donation Dialog](./features/donation-dialog.md).

## Can I reuse the donation component in my own site?

Yes, that is exactly how it is built — a self-contained drop-in needing only
a `[data-donation]` mount point, `css/donation.css`, and the script. It
optionally follows an existing `PG.i18n`. Swap the payment URLs in
`DONATION_CONFIG` for your own. Integration notes:
[Donation Dialog — Solution Overview](./features/donation-dialog.md#solution-overview).

## Is the code free to use?

The repository currently declares **no license**, so all rights are reserved
until the maintainer adds one. The vendored `qrcode-generator.js` is MIT by
its original author. See [License Notes](../../README.md#license-notes).
