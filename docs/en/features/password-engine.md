# Password Engine

中文版见[密码生成引擎](../../zh/features/password-engine.md).

## Summary

A pure, DOM-free generation core (`js/generator.js`) that turns an options
object into a password using Web Crypto randomness, guarantees one character
per selected class, and scores the result in entropy bits.

## Background

The project started as a single static page in 2026 with three commits. The
generator was split from the UI from day one: the same file must run in the
browser (`window.PG.generator`) and under Node (`module.exports`) so the
logic can be tested exhaustively without a DOM.

## Problem

Web password generators fail in two predictable ways: they use
`Math.random()` (predictable, not crypto-grade), and they draw characters
with `pool[Math.floor(random * pool.length)]`, which biases output whenever
the pool size does not divide the RNG's range. Class-based generators add a
third: "at least one of each class" implemented by *checking and retrying*,
which quietly makes some shapes rarer than others, or by *appending* class
representatives, which clumps them at the front.

## Goals

- Every character drawn from a cryptographically secure source.
- Uniform draws — no modulo bias for any pool size the UI can produce.
- Exactly one guaranteed character per selected class, without a skewed
  distribution of positions.
- Easy-to-type, easy-to-speak and dictation grouping as composable pool
  filters with predictable semantics, alongside the blacklist.
- 100% of the logic testable from Node with a deterministic injected RNG.
- Zero dependencies in the shipped page.

## Non-Goals

- **Passphrase generation** from word lists — not attempted; the tool is a
  character generator.
- **Strength checking of user-entered passwords** — the meter scores the
  generator's settings, not arbitrary input.
- **Pronounceable passwords** — the easy-to-speak filter removes sound-alike
  characters but does not build syllables.
- **Seeded / deterministic generation** — regeneration is meant to produce
  *different* output; a master-secret KDF mode is a different product.
- **Length beyond 64** — UI decision; the core itself only requires
  `length ≥ number of selected classes`.
- **Custom character classes** — four fixed classes plus the blacklist cover
  the practical cases without a class editor.

## Solution Overview

One UMD module exposes `buildClasses(opts)`, `generate(opts, rng?)`,
`groupPassword(pw, size?, sep?)`, `entropyBits(length, poolSize)`,
`strengthLevel(bits)`, and `randomInt(rng, max)`.

- **Randomness:** `defaultRng()` reads `Uint32Array(1)` from
  `crypto.getRandomValues` (falling back to Node's `crypto.webcrypto` under
  test). Tests inject a seeded LCG instead — determinism for structure, real
  crypto for one end-to-end case.
- **Uniformity:** `randomInt` uses rejection sampling — values ≥
  `2³² − (2³² mod max)` are discarded before the modulo, so every index is
  exactly equiprobable.
- **Class guarantee:** take one character from each surviving class, fill the
  remaining positions from the joined pool, then a full Fisher–Yates shuffle
  makes positions exchangeable.
- **Filtering:** `buildClasses` applies easy-type replacement/exclusion,
  easy-speak replacement/exclusion, active-separator removal, then blacklist
  removal; classes that end up empty are dropped from the array entirely.
  `groupPassword` is pure layout on top of `generate` output.

## Detailed Behavior

Character sets as shipped:

| Class | Set | Size |
| --- | --- | --- |
| Uppercase | `A–Z` | 26 |
| Lowercase | `a–z` | 26 |
| Digits | `0–9` | 10 |
| Symbols | ``!@#$%^&*()-_=+[]{};:'",.<>?/~\`|`` | 32 |

Full pool: **94** characters.

**Easy-to-type mode** (`TYPE_EXCLUDE = 0Oo1lIi2Zz5Ss8B6b9gq`):

- Uppercase loses `O I Z S B` → 21 left.
- Lowercase loses `o l i z s b g q` → 18 left.
- Digits reduce to `347`.
- Symbols are replaced wholesale by ``!@#$%^&*-_=+?~`` (13).
- Easy-type pool: **55** characters.

**Easy-to-speak mode** (`SPEAK_EXCLUDE = BCDEGNPTVZbcdegnptvz17`):

- Letters that share one spoken sound are dropped in both cases: the "ee"
  family `B C D E G P T V Z`, plus `N` (kept `M` wins the "em/en" pair) →
  16 uppercase + 16 lowercase remain.
- Digits lose `1`/`7` (Mandarin "yī"/"qī") → `02345689`.
- Symbols are replaced by `!@#$%*+=?` (9) — short, distinct spoken names.
- Easy-speak pool: **49** characters.

**Both advanced filters together:** uppercase 13, lowercase 11 (`l`/`q`
already removed by easy-type), digits `34`, speakable symbols 9 → **35**
characters. 16 characters still rate ~82 bits.

**Dictation grouping** (`groupSep = '-' | '_'`): the active separator is
removed from the candidate pool (symbols 32 → 31, easy-type symbols 13 → 12;
the speakable subset never contained either), then `groupPassword` joins
blocks of four with it. Separators are layout only — entropy counts the real
characters, and copying yields the grouped string.

**Blacklist** applies after all of the above. A class emptied by any
filter is skipped — it neither contributes a guaranteed character nor
appears in the joined pool. Order of effects: easy-type → easy-speak →
separator removal → blacklist → drop empties.

**Errors thrown by the core:**

| Condition | Error |
| --- | --- |
| No class survives filtering | `no character class selected` |
| `length < number of surviving classes` | `length shorter than number of selected classes` |
| Web Crypto unavailable | `Web Crypto API unavailable` |
| `randomInt` with non-positive max | `max must be positive` |

**Entropy model:** displayed bits = `length × log2(joined pool size)`,
rounded. With the class-guarantee rule the true min-entropy of the output
distribution is marginally below this uniform upper bound (the guarantee
excludes class-empty strings, which are already astronomically unlikely at
realistic lengths); the common log2 estimate is used deliberately so the
number matches what any password-strength reference would compute. Strength
levels: <40 Weak · 40–59 Fair · 60–79 Strong · ≥80 Excellent.

**UI clamping:** the page clamps length to 4–64 before calling the core, so
the "length shorter than classes" error is unreachable from the UI (min 4 =
max classes); it exists to protect programmatic callers.

## User Experience

The engine has no UI of its own; `js/app.js` maps it to the page: the
password output, the entropy readout, the four-segment meter, and two
warning states ("Select at least one character set." / "No usable characters
left — adjust the blacklist."). Basic controls (length, four classes,
blacklist) live in section 02 — Settings; the three advanced modes
(**Easy to type**, **Easy to read aloud**, **Easy to dictate** with a
hyphen/underscore separator picker) live in their own section 03 — Advanced.
Every option change regenerates immediately.
See [Usage](../usage.md#generating-a-password).

![Generator UI](../../img/overview-en.webp)

## Compatibility and Historical Impact

No historical behavior is affected. The core's public surface
(`buildClasses`, `generate`, `entropyBits`, `strengthLevel`, `randomInt`,
plus the exported charset constants) has been stable since the first commit
and is covered by tests; any future change to output distribution or error
contracts must bump the CHANGELOG and extend the tests first.

## Data and Privacy Impact

The core is pure computation: it touches no storage and no network. No new
localStorage keys, no uploads. (Privacy statement: [Privacy](../privacy.md).)

## Performance Impact

A 64-character password costs at most ~130 `getRandomValues`-backed draws;
`getRandomValues` is called once per draw with a single-word buffer, which
stays well under any perceptible threshold on any device that runs the page.
No measurement claims beyond that are made here.

## Current Limitations

- The guaranteed-character rule is per *surviving* class: with advanced
  filters + blacklist combined, "guaranteed" can silently mean fewer classes
  than the user ticked (the UI shows the pool honestly via entropy, but does
  not flag dropped classes individually).
- `entropyBits` is an estimate of the uniform upper bound, not the exact
  min-entropy of the guaranteed-class distribution (difference is
  negligible at ≥4 characters).
- The symbol set deliberately omits the space character and all non-ASCII
  characters (Unicode quotes, CJK punctuation, …) to stay safe across login
  forms and encodings.

## Release Information

- Introduced: v0.1.0 (2026-08-27)
- Advanced options (easy to type / read aloud / dictate): v0.2.0 (2026-08-27)
- Status: Stable

## Related Documentation

- [Usage — Generating a password](../usage.md#generating-a-password) ·
  [Reading entropy and strength](../usage.md#reading-entropy-and-strength) ·
  [Advanced options](../usage.md#advanced-options) ·
  [Blacklist](../usage.md#blacklist)
- [Development — What the tests cover](../development.md#what-the-tests-cover)
- [Donation Dialog](./donation-dialog.md) — the other feature's use of lazy
  loading, unrelated to generation
- [FAQ](../faq.md) — entropy, length cap, offline use

## Feature Changelog

### v0.2.0

Advanced options moved to their own UI level (section 03): easy-to-type
(renamed from "human-readable"), easy-to-speak filter
(`BCDEGNPTVZbcdegnptvz17` + speakable symbol subset), and dictation
grouping (`groupPassword`, hyphen/underscore, separator kept out of the
pool). 22 Node tests.

### v0.1.0

Initial implementation: Web Crypto rejection sampling, class-guaranteed
generation with Fisher–Yates, readable mode, blacklist, entropy/strength
model, 16 Node tests.
