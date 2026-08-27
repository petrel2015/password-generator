# Development

How to work on PW·GEN locally. 中文版见[开发文档](../zh/development.md).

## Prerequisites

- The **site itself needs nothing** — it is plain HTML/CSS/JS with zero
  runtime dependencies.
- The **test tooling needs Node.js** (any currently maintained version; the
  suite only uses `node:test`-free plain `assert`, so there is no strict
  engine requirement) and npm to install three dev packages.

## Commands

All commands were executed against this repository and pass:

| Command | What it does | Status |
| --- | --- | --- |
| `npm install` | Installs the three test-only dev dependencies (`jsqr`, `pngjs`, plus `qrcode`/`qrcode-generator` listed for parity with the vendored encoder) | ✅ clean, 0 vulnerabilities |
| `npm test` | Runs both suites: `node test/generator-test.js && node test/donation-test.js` | ✅ 29 passed, 0 failed |
| `python3 -m http.server 8471` | Serves the working tree at `http://127.0.0.1:8471/` — this is the production form, since there is no build step | ✅ verified |

There is deliberately **no build, no bundler, and no lint configuration**.
Deploying means copying the working tree (see [Deployment](./deployment.md)).

## What the tests cover

**`test/app-test.js` — 8 tests, UI wiring via a minimal DOM stub** (loads the
real `js/app.js` + `js/i18n.js` + `js/generator.js`, no browser needed):

- Init render: 16-char password, full-pool entropy, disabled separator picker.
- Dictate toggle: blocks-of-four grouping, hyphen/underscore switching,
  picker enable/disable, separators excluded from the character count.
- Easy-speak / easy-type: excluded characters absent from output, entropy
  readout follows the pool (105 → 90 → 82 bits); blacklist interplay.

**`test/generator-test.js` — 22 tests, pure logic via the UMD export:**

- Character-class construction: unfiltered sets, easy-type exclusions
  (digits reduce to `347`), visible-only symbol subset.
- Easy-speak mode: sound-alike exclusions per class, speakable symbol subset,
  easy-type + easy-speak stacking (pool 94 → 35).
- Dictation grouping: `groupPassword` chunking, active separator removed
  from the pool, separators never leak into generated output, entropy
  unaffected by layout.
- Blacklist: removal across classes, emptied classes dropped, whole-pool
  exhaustion throws, blacklist + easy-type combined over 200 runs.
- Generation invariants: exact length, every selected class covered, all
  output characters inside the effective pool, across lengths 4–64.
- 200-run sweeps asserting no excluded character ever appears.
- Error contracts: no class selected, length below class count.
- Math: `entropyBits` equals `length × log2(pool)`, strength thresholds at
  40 / 60 / 80 bits, `randomInt` bounds over 5000 draws, and one end-to-end
  run through the real Web Crypto RNG.

**`test/donation-test.js` — 13 contract tests:**

- QR round-trips: both payment payloads survive encode → rasterize (pngjs) →
  decode (jsqr) with the exact string back.
- QR geometry: error-correction level M, quiet zone ≥ 4 modules, ~220 px.
- Source-contract checks against `js/donation.js`: exact spec payloads, no
  `alipays://` scheme, no static image references, no `img/` directory,
  exact footer entry texts, zh/en key parity, mobile jump rules (Alipay may
  jump, WeChat must not), visibility-based fallback + explicit show-QR
  button, accessibility hooks (ESC, overlay close, aria attributes, focus
  restore), lazy loading of the vendor script, the `[data-donation]` mount
  contract, and CSS coverage of every `donation-*` class.

## Project layout

```
index.html                  page shell; loads CSS and the four scripts in order
css/style.css               design system: CSS variables (--ink/--paper/--red/…), layout, components
css/donation.css            donation overlay/dialog/tabs styles on the same variables
js/generator.js             UMD pure core: buildClasses / generate / entropyBits / strengthLevel / randomInt
js/i18n.js                  DICT(en|zh), detection (saved > browser), apply() via data-i18n-* attributes
js/app.js                   DOM wiring: options → generator → output/meter/warnings, copy, language buttons
js/donation.js              self-contained footer entry + QR dialog; only touches its own DOM
js/vendor/qrcode-generator.js  MIT third-party QR encoder (do not edit)
test/generator-test.js      core unit tests (node)
test/donation-test.js       donation contract tests (node)
docs/                       this documentation set (en + zh mirrors)
```

Script load order matters only in one respect: `app.js` expects
`PG.generator` and `PG.i18n` to exist, so `generator.js` and `i18n.js` must
precede it. `donation.js` is `defer`-loaded and only reads `PG.i18n`
optionally.

## Conventions

- **ES5-compatible syntax** in the four first-party scripts (no arrow
  functions, `const`/`let`); keep it that way unless the whole codebase moves
  forward together.
- **UI strings live in `js/i18n.js`** — add every new string to *both*
  dictionaries. Static markup uses `data-i18n`, `data-i18n-placeholder`,
  `data-i18n-aria-label`, `data-i18n-alt`; dynamic strings call
  `PG.i18n.t(key, params)` with `{param}` placeholders.
- **The donation component is a drop-in**: it must keep working with nothing
  but a `[data-donation]` mount, `css/donation.css`, and optional `PG.i18n`.
  Changes there are guarded by the 13 contract tests — run them first.
- The vendored file under `js/vendor/` is third-party; do not restyle or
  "modernize" it.
- Screenshots referenced by the docs live in `docs/img/` (WebP, ≤1600 px
  wide). If the UI changes materially, re-shoot rather than letting the
  docs drift.

## Local verification of the production form

Because the site is static, "a production build" is simply the working tree
served over HTTP:

```bash
python3 -m http.server 8471
# open http://127.0.0.1:8471/ and walk the page: generate, tweak options,
# copy, switch language, open the donation dialog
```

Before submitting a change, run `npm test` (all 29 must pass) and click
through the served page once — the test suite cannot see CSS or DOM
behavior.
