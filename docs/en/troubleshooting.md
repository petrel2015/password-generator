# Troubleshooting

中文版见[故障排查](../zh/troubleshooting.md).

Every row below comes from an actual code path — the warning states in
`js/app.js`, the error branches in `js/generator.js`, and the fallback logic
in `js/donation.js`.

## Generating

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Password area shows `——————` and "Select at least one character set." | All four class checkboxes are unticked | Tick at least one class |
| Password area shows `——————` and "No usable characters left — adjust the blacklist." | The blacklist (possibly combined with readable mode) removed every candidate character | Remove some blacklist characters or enable more classes |
| Entropy is lower than expected | Readable mode (pool 94 → 55) or the blacklist shrank the pool — the number is correct for the current settings | This is expected; see [Usage — Reading entropy](./usage.md#reading-entropy-and-strength) |
| Typed length does not stick (e.g. `99`) | The UI clamps to the 4–64 range on change | Use values within 4–64 |
| Error "Web Crypto API unavailable" (very old browser) | The browser predates `crypto.getRandomValues` (e.g. IE 11, or a very old embedded webview) | Use a current Chrome, Edge, Firefox, or Safari |

## Copying

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "Copy" does not flash "Copied" | The clipboard write failed: the Clipboard API is unavailable (non-secure context) **and** the legacy `execCommand` fallback was denied | Select the password text manually and copy with Ctrl/Cmd+C; serving over HTTPS, localhost, or file:// restores the API |
| Clipboard contains an older password | The copy click happened before the latest regeneration | Click Copy again after the password updates |

## Language

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Language resets between visits | localStorage is unavailable (private browsing) or was cleared; detection falls back to the browser language | Nothing to fix — the choice cannot persist without storage; switch manually per visit |
| Page shows mixed languages | A string is missing from one dictionary (`js/i18n.js`) — `t()` falls back to English, then to the raw key | Add the key to both dictionaries; see [Development — Conventions](./development.md#conventions) |

## Donation dialog

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "Could not generate the QR code. Please try again." | The vendored `js/vendor/qrcode-generator.js` failed to load (file missing, or you are offline on a partial copy) | Ensure `js/vendor/qrcode-generator.js` exists next to the page; closing and reopening the dialog retries the load |
| On mobile, tapping Alipay does nothing visible | The hand-off to the Alipay app happened, or the OS blocked it; the dialog is waiting on its visibility timer | Wait ~1.3 s for the automatic QR fallback, or press "Show QR code" immediately |
| WeChat tab never opens the app | By design — WeChat deep links are payment payloads that browsers cannot launch | Scan the QR with the WeChat app; see [Donation Dialog](./features/donation-dialog.md) |

## Hosting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Page loads unstyled / scripts 404 | Files were moved but `index.html` kept its relative paths, or the CSS/JS folders were not uploaded | Keep the tree intact: `index.html`, `css/`, `js/` side by side |
| 404 on `https://<user>.github.io/password-generator/` | Pages not enabled, or source not set to `main` / root | See [Deployment — First-time setup](./deployment.md#first-time-setup-new-repository) |

## Still stuck?

Open an issue at
[petrel2015/password-generator/issues](https://github.com/petrel2015/password-generator/issues)
and include: browser + version, page URL (or "local file"), the exact
warning text if any, and what you clicked. For generation surprises, paste
the settings (length, classes, readable on/off, blacklist) — never paste the
generated password itself.
