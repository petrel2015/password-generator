# Documentation

Detailed documentation for topics summarized in the main
[README](../../README.md).
中文文档见[中文索引](../zh/index.md).

## User Documentation

- [Usage](./usage.md) — step-by-step operation, inputs and limits, edge-case
  behavior, mobile layout.
- [FAQ](./faq.md) — scope questions: what the tool can and cannot do.
- [Privacy](./privacy.md) — what is stored and what the page sends,
  verified against the source code.
- [Troubleshooting](./troubleshooting.md) — symptoms → likely causes →
  fixes.

## Technical Documentation

- [Development](./development.md) — prerequisites, commands, test
  descriptions, project layout, local preview of the production form.
- [Deployment](./deployment.md) — how the site is hosted, first-time setup,
  post-deploy verification checklist.

## Feature Documentation

Design documents for the two subsystems with non-trivial decisions:

- [Password Engine](./features/password-engine.md) — randomness, character
  classes, readable mode, blacklist, entropy model.
- [Donation Dialog](./features/donation-dialog.md) — live QR generation,
  mobile hand-off and fallback, accessibility contracts.
