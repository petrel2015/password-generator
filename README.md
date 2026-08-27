# PW·GEN

English | [简体中文](./README.zh.md)

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Runtime dependencies](https://img.shields.io/badge/runtime%20deps-0-brightgreen)
![Build step](https://img.shields.io/badge/build%20step-none-8A2BE2)
![UI languages](https://img.shields.io/badge/UI-EN%20%7C%20%E4%B8%AD%E6%96%87-informational)

A Swiss-style password generator that runs entirely in your browser. Every
password is produced locally with the Web Crypto API — nothing is stored,
nothing leaves the page.

Most online generators are ad-heavy pages that hand your future password to a
server, or they quietly use `Math.random()`, which is not cryptographically
secure. PW·GEN is a dependency-free static page: it draws every character from
`crypto.getRandomValues` via rejection sampling, shows you the real entropy of
the current settings, and makes zero network requests at runtime.

> AI assistants and agents: for a structured, machine-friendly description
> of this project, see [README_FOR_AI.md](./README_FOR_AI.md).

## Live Demo

**[Open the online tool →](https://petrel2015.github.io/password-generator/)**

![PW·GEN desktop screenshot (English)](./docs/img/overview-en.webp)

## Core Features

### Cryptographically secure generation

Every character is drawn with the browser's Web Crypto API using rejection
sampling, so picks are uniform with no modulo bias. If several character
classes are selected, each one is guaranteed to contribute at least one
character, and the result is shuffled with Fisher–Yates so the guaranteed
characters are not predictably front-loaded.

Design details: [Password Engine](./docs/en/features/password-engine.md) ·
How to use: [Generating a password](./docs/en/usage.md#generating-a-password)

### Live entropy and strength meter

The current settings are scored as `length × log2(pool size)` and displayed
next to the password, with a four-segment strength meter (Weak / Fair /
Strong / Excellent at 40 / 60 / 80 bits). Change any option and both the
password and its score update immediately.

How to use: [Reading entropy and strength](./docs/en/usage.md#reading-entropy-and-strength)

### Human-readable mode

One checkbox removes the characters people misread and mistype — `0/O/o`,
`1/l/I/i`, `2/Z/z`, `5/S/s`, `8/B`, `6/b`, `9/g/q` — and narrows the symbol
set to clearly visible marks. Useful for passwords you will type by hand or
read over the phone.

![Readable mode with a blacklist](./docs/img/readable-blacklist-en.webp)

How to use: [Human-readable mode](./docs/en/usage.md#human-readable-mode) ·
Exact exclusion lists: [Detailed Behavior](./docs/en/features/password-engine.md#detailed-behavior)

### Character blacklist

Type any characters you want gone (for example the ones your keyboard or a
target site rejects) and they are removed from the candidate pool instantly.
A character class that becomes empty is skipped; the UI warns you before the
whole pool runs dry.

How to use: [Blacklist](./docs/en/usage.md#blacklist)

### Bilingual UI (English / 简体中文)

The whole interface switches between English and Simplified Chinese,
following your saved choice or your browser language. Passwords, of course,
are language-independent.

![PW·GEN desktop screenshot (Chinese)](./docs/img/overview-zh.webp)

### Built-in donation dialog

If you like the tool, a footer entry opens a small dialog with Alipay and
WeChat Pay tabs. The QR codes are generated live in the browser — no static
images, no third-party QR service, no analytics.

Design details: [Donation Dialog](./docs/en/features/donation-dialog.md) ·
How to use: [Donation dialog](./docs/en/usage.md#donation-dialog)

## Quick Start

The site is fully static — no build, no bundler, no environment variables.

```bash
git clone https://github.com/petrel2015/password-generator.git
cd password-generator
python3 -m http.server 8471
# open http://127.0.0.1:8471/
```

Opening `index.html` directly from the filesystem also works, since every
asset path is relative.

## Basic Usage

1. Adjust **Length** (4–64) with the slider or number box.
2. Tick the character sets you want; optionally enable **Human-readable**
   and/or fill in a **Blacklist**.
3. The password regenerates on every change; press **Regenerate** for a new
   one with the same settings.
4. Press **Copy** to copy the password to the clipboard.

Full walkthrough with edge cases: [Usage](./docs/en/usage.md).

## Tech Stack

| Layer | Choice |
| --- | --- |
| Page | Single static HTML file, hand-written |
| Styling | Plain CSS, Swiss / German-school design system (white paper, near-black ink, one red accent) |
| Logic | Vanilla ES5-compatible JavaScript, no framework |
| Randomness | Web Crypto API (`crypto.getRandomValues`) with rejection sampling |
| QR encoding | [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), vendored, lazy-loaded |
| Tests | Node test runner scripts (`node test/*.js`), 29 tests |

## Architecture Summary

```
index.html            page shell: markup + mount points ([data-donation] in footer)
css/style.css         site design system (CSS variables, layout, components)
css/donation.css      donation dialog styles (uses the site's CSS variables)
js/generator.js       pure generation core — UMD, no DOM, tested in Node
js/i18n.js            EN/zh dictionaries, language detection + persistence
js/app.js             UI wiring: options → generator → display, copy, language
js/donation.js        donation entry + QR dialog (self-contained drop-in)
js/vendor/            qrcode-generator.js (MIT), loaded lazily on first dialog open
test/                 Node unit tests for the core and the donation contracts
```

The generation core is deliberately separated from the UI: `generator.js`
exposes pure functions over an options object and is exercised directly by
the Node test suite.

## Documentation

| Document | Description |
| --- | --- |
| [Usage](./docs/en/usage.md) | Step-by-step usage, inputs, limits, edge-case table |
| [Development](./docs/en/development.md) | Commands, tests, project layout, local preview |
| [Deployment](./docs/en/deployment.md) | GitHub Pages setup, post-deploy checklist |
| [Troubleshooting](./docs/en/troubleshooting.md) | Symptoms → causes → fixes |
| [Privacy](./docs/en/privacy.md) | What is stored, what the page sends (code-verified) |
| [FAQ](./docs/en/faq.md) | Scope and design questions |
| [Documentation index](./docs/en/index.md) | Full table of contents |

Feature design documents: [Password Engine](./docs/en/features/password-engine.md) ·
[Donation Dialog](./docs/en/features/donation-dialog.md)

中文文档：[文档索引](./docs/zh/index.md)

## Compatibility

Any browser with the Web Crypto API (all evergreen Chrome, Edge, Firefox,
Safari; not IE 11). The page needs a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
for the clipboard API — `https://`, `http://127.0.0.1`, `localhost`, and
`file://` all qualify; on plain HTTP over a LAN IP the copy button falls back
to a legacy method and passwords still display.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) (Keep a Changelog format). The repository
has no version tags yet; `0.1.0` is the initial published feature set.

## Contributing

Issues and pull requests are welcome at
[petrel2015/password-generator](https://github.com/petrel2015/password-generator).
Run `npm test` before submitting — all 29 tests must pass. If you add a UI
string, add it to **both** dictionaries in `js/i18n.js` (a test enforces key
parity for the donation strings; keep the main dictionaries in the same
discipline).

## License Notes

**This repository currently has no license file.** All rights are reserved by
default until the maintainer adds one. If you want to reuse the code, please
open an issue to discuss licensing first — do not assume MIT or any other
license. (The vendored `js/vendor/qrcode-generator.js` is MIT-licensed by its
original author regardless of what is later chosen for the rest of the code.)
