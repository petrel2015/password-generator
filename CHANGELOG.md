# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repository has no Git tags or GitHub Releases yet (verified via
`git tag` and `gh release list`: both empty), so per-project convention the
single entry below summarizes the complete published feature set of the
initial release. Finer-grained history is available from the Git log; the
entry will be split into per-version sections once the first tag is created.

## [Unreleased]

Nothing yet.

## [0.2.0] - 2026-08-27

### Added

- **Advanced options** in their own "03 — Advanced" UI section, clearly
  separated from the basic character-set toggles:
  - **Easy to read aloud** — excludes characters whose spoken names are
    easily confused (`B C D E G P T V Z` both cases, `N` in favour of `M`,
    digits `1`/`7` for the Mandarin "yī/qī" pair) and narrows symbols to a
    speakable subset `!@#$%*+=?` (pool 94 → 49).
  - **Easy to dictate** — groups the password into blocks of four with a
    hyphen or underscore separator (two-choice picker); separators are pure
    layout (no entropy), are never drawn from the pool, and the grouped
    string is what gets copied.

### Changed

- **Human-readable mode renamed to "Easy to type"** and moved from the
  character-set grid into the new advanced section; the filtering behavior
  is unchanged (`0Oo1lIi2Zz5Ss8B6b9gq`, visible-only symbols, pool 94 → 55).
  Both advanced filters can be combined (pool 94 → 35).

### Tests

- Generator suite extended from 16 to 22 tests (speak-mode exclusions,
  filter stacking, grouping layout, separator pool removal).
- New `test/app-test.js` — 8 UI-wiring tests that load the real
  `app.js`/`i18n.js`/`generator.js` against a minimal DOM stub: option
  toggles, separator switching, grouped display, entropy readout,
  blacklist interplay (total suite: 43 tests).

## [0.1.0] - 2026-08-27

First public release on GitHub Pages. This entry summarizes the complete
feature set as of the initial release date.

### Added

- Password generation core: Web Crypto API randomness with rejection
  sampling, four character classes (uppercase / lowercase / digits /
  symbols) with at least one character guaranteed per selected class,
  Fisher–Yates shuffle, and a pure Node-testable UMD module.
- Length control from 4 to 64 characters with synced slider and number input.
- Human-readable mode excluding look-alike characters (`0Oo1lIi2Zz5Ss8B6b9gq`)
  and restricting symbols to a clearly visible subset.
- Per-character blacklist; classes emptied by filtering are skipped.
- Live entropy display (`length × log2(pool size)`) with a four-segment
  strength meter (thresholds at 40 / 60 / 80 bits).
- One-click copy with Clipboard API and a legacy fallback.
- Bilingual interface (English / 简体中文) with browser-language detection
  and persistence of the chosen language in localStorage (`pg-lang`).
- Donation dialog: Alipay / WeChat Pay tabs, QR codes generated live in the
  browser (vendored MIT `qrcode-generator`, lazy-loaded), mobile Alipay
  hand-off to the official URL with a visibility-based QR fallback,
  accessibility support (dialog role, tablist, focus trap, ESC/overlay
  close, focus restore).
- Swiss / German-school visual design: white paper, near-black ink, one red
  accent, hairline rules, no gradients or shadows.
- Node test suite: 16 generator tests + 13 donation contract tests.

(Version comparison links will be added once the first Git tag exists.)
