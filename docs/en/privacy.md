# Privacy

中文版见[隐私说明](../zh/privacy.md).

Every claim below was checked against the source (`js/*.js`,
`index.html`). File-level pointers are given so you can re-verify.

## What is stored

| Item | Where | Key | Lifetime | Purpose |
| --- | --- | --- | --- | --- |
| Language choice (`en` or `zh`) | localStorage | `pg-lang` | Until you clear site data | Remembers your UI language (`js/i18n.js`, `setLang`) |

**Nothing else is stored.** Passwords are never written to localStorage,
sessionStorage, cookies, IndexedDB, or any disk cache by the page's own code.
Generator settings (length, classes, advanced options, blacklist)
deliberately do not persist — a reload resets them.

## Network behavior

- **Zero runtime data requests.** The scripts contain no `fetch`, no
  `XMLHttpRequest`, no `sendBeacon`, no `WebSocket`, no analytics snippet,
  and load no external fonts, CDNs, or trackers.
- The only things fetched are the page's **own static assets** (2 CSS files,
  4 JS files) and, additionally, the same-origin vendored
  `js/vendor/qrcode-generator.js` — but only the first time the donation
  dialog is opened (lazy load).
- **One outbound navigation exists, by design and only on mobile:** tapping
  the Alipay tab in the donation dialog navigates to the official
  `https://qr.alipay.com/…` link. From that moment the Alipay site/app
  applies its own policies; the page itself sends nothing along.

## Clipboard

The clipboard is **written** only when you click Copy, and **never read**.
If the Clipboard API is unavailable, a legacy `execCommand('copy')` fallback
is tried once — also only on your click.

## What this means in practice

Generated passwords exist in three places only: the page's memory, the
screen, and (after an explicit Copy) your clipboard. Closing the tab or
regenerating discards them.

## Outside this project's control

- When you use the hosted instance, **GitHub Pages** (the host) records
  standard request logs (IP, timestamps) like any web server; that is
  hosting infrastructure, not this application. Self-hosting from the
  repository gives you full control.
- Browser-level features (your password manager's form autofill, browser
  history of the URL) are likewise outside the page.

## Re-verification pointers

- Storage writes: grep `localStorage` in `js/` → only `pg-lang` in
  `js/i18n.js`.
- Network: grep `fetch|XMLHttpRequest|sendBeacon|WebSocket` in `js/` → no
  hits; the only script injection is the same-origin QR vendor
  (`js/donation.js`, `loadQrLib`).
- Clipboard: `copyText()` in `js/app.js` — write-only, click-gated.
