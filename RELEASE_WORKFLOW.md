# Release Workflow

This document explains how to release a new version of `@kleri/ui`.

## Overview

Releases are **fully automated**. Once a PR with a version bump is merged into `main`, the CI pipeline handles the rest: building, publishing to npm, and creating a GitHub release.

## Release Steps

### 1. Prepare the Release PR

Create a branch and bump the version in `package.json`:

```bash
# Example: bump from 0.0.1 to 0.0.2
# Edit package.json directly, or use a tool like:
npm version patch   # or minor, major
```

Make sure the version follows [Semantic Versioning](https://semver.org/):

| Bump            | When                               |
| --------------- | ---------------------------------- |
| `patch` (0.0.X) | Bug fixes, small changes           |
| `minor` (0.X.0) | New features, backwards-compatible |
| `major` (X.0.0) | Breaking changes                   |

### 2. Open a Pull Request

Open a PR to `main` with the version bump. The PR title/description should briefly summarize what's in the release.

The existing CI workflow will run (lint, typecheck, tests) as usual.

### 3. Merge into `main`

Once the PR is reviewed and merged, the [release workflow](.github/workflows/release.yml) triggers automatically.

### 4. What Happens Automatically

The release workflow does the following:

1. **Version check** — compares `package.json` version against existing git tags. If the version is already released, it exits cleanly.
2. **Build** — runs `bun run prepack` to build the package.
3. **Publish to npm** — publishes `@kleri/ui` to the npm registry.
4. **GitHub Release** — creates a release page with auto-generated release notes at `https://github.com/kleri-org/kleri-ui/releases`.
5. **Git tag** — creates and pushes a tag (e.g. `v0.0.2`).

You can monitor progress in the **Actions** tab on GitHub.

## Required Secrets

The following secret must be configured in the repository:

| Secret      | Where to get it                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `NPM_TOKEN` | [npm → Access Tokens → Granular Token](https://www.npmjs.com/settings/tokens) with **Publish** permission for the `@kleri` scope |

Add it at: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

## Manual Release (Emergency Only)

If you need to release manually, run locally:

```bash
# 1. Make sure you're on main and up to date
git checkout main
git pull origin main

# 2. Bump version
npm version patch

# 3. Build
bun run prepack

# 4. Publish to npm
npm publish --access public

# 5. Push the tag
git push origin main --tags

# 6. Create GitHub Release manually at:
# https://github.com/kleri-org/kleri-ui/releases/new
```

## Troubleshooting

| Problem                | Likely Cause                             | Fix                                                     |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------- |
| Release didn't trigger | Version wasn't changed in `package.json` | Bump version and merge again                            |
| npm publish failed     | `NPM_TOKEN` missing or expired           | Regenerate token in npm settings and update repo secret |
| Tag already exists     | Version was previously released          | Bump to a new version                                   |
| Build fails            | Code issue on `main`                     | Fix the issue, open a new PR, and re-bump version       |
