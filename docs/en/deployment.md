# Deployment

中文版见[部署文档](../zh/deployment.md).

## How the site is hosted

PW·GEN is a static site with no build step. The live instance runs on
**GitHub Pages**:

- Host: GitHub Pages (project site)
- Source: **`main` branch, root (`/`) of the repository** (verified via the
  Pages API at the time of writing)
- Public URL: https://petrel2015.github.io/password-generator/

## Why no base-path configuration is needed

All asset references in `index.html` are **relative** (`css/style.css`,
`js/app.js`, …), and the donation component resolves its lazily-loaded
vendor script relative to the document. A GitHub Pages project site serves
under a sub-path (`/password-generator/`), and relative paths resolve
correctly under it without any configuration. The site therefore also works
at a domain root, under any sub-path, on `localhost`, and from `file://`.

## First-time setup (new repository)

1. Push the project to GitHub.
2. Repository **Settings → Pages → Build and deployment → Source**:
   choose *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Save; the deployment completes in a minute or two.

## Redeploying after changes

Nothing to run — push to `main` and GitHub Pages redeploys the working tree
automatically. Before pushing, confirm locally that the tree you are about
to publish is the one you want public (there is no build step to catch
mistakes):

```bash
npm test                                   # 29 tests must pass
python3 -m http.server 8471                # then click through http://127.0.0.1:8471/
```

## Post-deploy verification checklist

Run through this after the first deploy and after any significant change:

1. `curl -sI https://petrel2015.github.io/password-generator/` returns
   `HTTP 200`.
2. The page opens with a generated password and an entropy value (not `—`).
3. Browser console shows no errors (generation, language switch, donation
   dialog open/close).
4. Change each option once and confirm the password regenerates.
5. Copy works (button flashes "Copied").
6. Donation dialog renders a QR code on both tabs.
7. Switch to 中文 and back; reload — the language persists.

## Custom domain (optional)

GitHub Pages custom domains work without code changes because every asset
path is relative:

1. Add a `CNAME` file at the repository root containing the domain, or set
   it in **Settings → Pages → Custom domain** (which creates the file for
   you).
2. Configure your DNS (Apex `A` records to Pages IPs, or a `CNAME` for a
   subdomain).
3. Enable **Enforce HTTPS** once the certificate is issued.

Note: a `CNAME` file in the root would be an untracked-by-tests extra file —
harmless to the app, but remember it is deployment configuration, not
product code.
