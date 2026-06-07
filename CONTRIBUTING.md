# Contributing to gMessages

Thank you for your interest in contributing. This guide explains how to work on the project without disrupting the stable `main` branch.

## Branch model

| Branch | Purpose |
|--------|---------|
| `main` | Stable, release-ready code. Tagged releases are cut from here. |
| `develop` | Integration branch for the next release. |
| `feat/*`, `fix/*` | Short-lived branches for individual changes. |

**Never open pull requests directly into `main` for feature work.** Target `develop` instead.

### Maintainer workflow

1. Check out `develop` and pull the latest changes.
2. Create a branch: `git checkout -b feat/my-change`
3. Make changes, commit, and push.
4. Open a pull request targeting **`develop`**.
5. Wait for CI to pass (`check` and `build` jobs).
6. When ready to release: open a PR from `develop` → `main`, merge, then tag.

### Release workflow

1. Bump `version` in `package.json` on `develop` (or as part of the release PR).
2. Merge `develop` into `main` via pull request.
3. Tag the release on `main`:

   ```bash
   git checkout main
   git pull
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. GitHub Actions builds the Windows installer and publishes a [GitHub Release](https://github.com/gotoel/gMessages/releases) with the `.exe` attached.
5. Add or edit release notes in the GitHub UI.

## Development setup

Requires Node.js 18+.

```bash
npm install
npm start        # run the app
npm run dev      # run with DevTools
npm run lint     # ESLint
npm run build:dir  # unpackaged Windows build for testing
```

## Pull requests

- Base branch: **`develop`** (unless this is a release PR into `main`)
- Keep changes focused and describe what you tested manually
- Ensure CI passes before requesting review

CI runs on every push and pull request to `main` and `develop`:

- **check** (Ubuntu): lint + JavaScript syntax validation
- **build** (Windows): `npm run build:dir` to verify packaging

## Reporting issues

Use the GitHub issue templates for bug reports and feature requests. Include your OS, steps to reproduce, and expected vs actual behavior.

## Branch protection (maintainers)

Pre-built ruleset JSON files live in [`.github/rulesets/`](.github/rulesets/). Import them once in GitHub:

1. **Settings → Rules → Rulesets**
2. **New ruleset → Import a ruleset**
3. Select [`.github/rulesets/main.json`](.github/rulesets/main.json), review, and click **Create**
4. Repeat for [`.github/rulesets/develop.json`](.github/rulesets/develop.json)

### What each ruleset does

**`main.json`**

- Require a pull request before merging (0 approvals — fine for solo maintainers)
- Require status checks: `check`, `build`
- Block force pushes and branch deletion

**`develop.json`**

- Require status checks: `check`, `build`
- Block force pushes and branch deletion
- No PR requirement (you can push directly while integrating work)

> **Note:** Rulesets may not enforce on private repositories until the repo is public or the account is on GitHub Team. CI still runs either way.

## Code style

- ESLint is enforced in CI (`npm run lint`)
- Match existing patterns in surrounding code
- Keep changes minimal and focused on the task at hand

## Tests

There is no automated test suite yet. Manual testing on Windows is expected before merge. If you add tests in a PR, keep them focused on real behavior rather than trivial assertions.
