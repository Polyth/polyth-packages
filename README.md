# Polyth package registry

The list of community packages shown at **[packages.polyth.app](https://packages.polyth.app)**, the catalog for [Polyth](https://polyth.app). Each approved package is one file, `packages/<id>.json`. The catalog is rebuilt from this folder, and Polyth installs exactly the release a file pins, only after the person installing it confirms.

Built-in Polyth packages are not listed here; they ship with Polyth.

## Submit a package

1. Read the [publication rules](https://packages.polyth.app/rules/) and the [terms of use](https://packages.polyth.app/terms/).
2. Check that your package installs in Polyth with **Settings → Packages → Add package** and the exact link you will submit.
3. Submit it, either way:
   - **[The issue form](https://github.com/Polyth/polyth-packages/issues/new?template=submit-package.yml)** (easiest): answer the questions, and a maintainer writes the file.
   - **A pull request** that adds `packages/<id>.json`, like the example below. The validation check runs on it.

```json
{
  "id": "deploy-board",
  "name": "Deploy board",
  "summary": "The last five deploys and their status, in a panel beside the chat.",
  "summary_uk": "Останні п’ять розгортань і їхній статус у панелі поруч із чатом.",
  "author": { "name": "Acme Tools", "url": "https://github.com/acme" },
  "source": "https://github.com/acme/deploy-board/tree/v1.2.0",
  "version": "1.2.0",
  "license": "MIT",
  "category": "engineering",
  "maturity": "beta",
  "icon": "rocket",
  "homepage": "https://github.com/acme/deploy-board",
  "permissions": ["Reads deploy status from api.github.com", "Adds a panel beside the chat"],
  "reviewedAt": "2026-11-23"
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | 3–40 lowercase letters, digits or dashes; equals the file name |
| `name` | yes | plain text, 2–40 characters |
| `summary` | yes | one plain sentence, 20–160 characters (`summary_uk`: optional Ukrainian) |
| `author` | yes | `{ "name": …, "url": "https://…" }`, `url` optional |
| `source` | yes | `https://github.com/<owner>/<repo>/tree/<tag-or-commit>`, `https://gitlab.com/<group>/<repo>/-/tree/<tag-or-commit>` or an `https://….zip` link |
| `version` | yes | semver; a tag in `source` must be `v<version>` or `<version>`, a commit the full 40 characters |
| `license` | yes | SPDX expression, such as `MIT` |
| `category` | yes | agents, workspace, engineering, research, operations, finance, wellbeing, home or system |
| `reviewedAt` | yes | the approval date, `YYYY-MM-DD`; set by the approving maintainer |
| `description`, `maturity` (`stable`/`beta`), `icon`, `homepage`, `tags`, `permissions` | no | see `scripts/validate-registry.mjs` |

Check an entry locally (Node 20, no install step):

```bash
node scripts/validate-registry.mjs
```

## How moderation works

1. **Submit**: an issue or a pull request.
2. **Automatic check**: `scripts/validate-registry.mjs` checks the fields, the pinned source, the license and the version.
3. **Moderator review**: a maintainer reads the code at that tag or commit and compares it with the declared `permissions`.
4. **Listed**: the file is merged with its `reviewedAt` date and appears in the catalog after the next build.

Every update is reviewed again: an entry pins one tag or commit, so a new version reaches people only after it is submitted and approved. Moving a tag after review is a reason for removal.

## Reports and appeals

- Something wrong with a listed package? [Report it](https://github.com/Polyth/polyth-packages/issues/new?template=report-package.yml). For a security hole that should not be public yet, say only that, without details.
- Disagree with a decision? Reply on the issue where it was made. Decisions are written there, so the reasoning stays public.

Packages are third-party code, listed as is and without warranty; see the [terms](https://packages.polyth.app/terms/).
