# Contributing to RNK Hero Forge

Thanks for considering contributing! This document outlines a simple workflow for code and documentation contributions.

## How to Contribute

1. Fork the repo and create a feature branch named `feature/my-change`.
2. Commit working changes and open a pull request against `main` once the feature is ready.
3. Follow existing code styles (ESLint / Prettier where applicable), and add unit or integration tests for new features.
4. Include a changelog entry for user-visible changes.

## Running validation locally

1. Install dependencies:

```bash
npm ci
```

2. Run validation and packaging locally:

```bash
npm run validate
npm run package
```

## Release Workflow

- Tag and release using the `RELEASE.md` checklist. Use the included packaging script to produce a zip for the GitHub release.

## Issues and Discussions

- Open issues for bugs, feature requests, or design discussions. Prefer PRs for multi-file changes and clearly document API or UX changes.
