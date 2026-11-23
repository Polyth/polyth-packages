<!-- Adding or updating a package? One package per pull request, please. -->

## Package

- Id: `<id>` (file `packages/<id>.json`)
- New listing or update: <!-- new / update from <old version> -->
- Source: <!-- https://github.com/<owner>/<repo>/tree/<tag-or-commit> -->

## What changed

<!-- For an update: what is new in this version, and any new access it needs. -->

## Checklist

- [ ] The entry passes `node scripts/validate-registry.mjs` (the check runs on this pull request).
- [ ] `source` is a full https URL pinned to tag `v<version>`, `<version>` or a 40-character commit, never a branch.
- [ ] `permissions` lists every capability the package uses.
- [ ] The source is readable: not obfuscated or minified-only.
- [ ] I installed this exact link in Polyth with **Settings → Packages → Add package**.
- [ ] I follow the [publication rules](https://packages.polyth.app/rules/) and accept the [terms of use](https://packages.polyth.app/terms/).
- [ ] `reviewedAt` is today's date; the maintainer who approves sets the real one.
