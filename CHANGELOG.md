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
