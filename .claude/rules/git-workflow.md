---
description: Rules for branching, committing, and opening pull requests. Apply when asked to commit changes, create a branch, push code, or open a PR.
alwaysApply: false
---

# Git Workflow Rules

For the full PR creation procedure, invoke `/create-pr <PR title>`.

## Branch Rules

- **Never commit directly to `main`**.
- Feature branch naming: `feature/<kebab-case-description>` derived from the PR title.
- Reuse an existing non-default branch if one is already checked out.

## Pre-Commit: Run Lint

```bash
npm run lint
```

- Lint errors (exit 1) → stop. Do not commit. Report errors and ask user to fix.
- Lint warnings only (exit 0) → proceed; note warnings in PR body.

## Stage Only Source Files

```bash
git add features/ pages/ hooks/ utils/ test-data/ .claude/
```

Never stage:
- `.env`, `*.pem`, `*.key`, `credentials.*`
- `node_modules/`, `allure-results/`, `reports/`, `downloads/`

## Commit Message Format

Use Conventional Commits with the co-author footer:

```
feat: <description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Type guide: `feat` (new scenario/page), `fix` (broken step/locator), `refactor`, `test`, `docs`, `chore`.

## PR Body Structure

```
## Summary
- What changed
- Why / motivation

## Key changes
- `path/to/file.ts` — what and why

## Test plan
- [ ] npm run tag -- @regression
- [ ] npm run name -- "<scenario name>"
- [ ] Check allure report on failure

## Risks
<risks or "No major risks detected">
```

## Safety Rules

- No `--force` push.
- No `--no-verify` to skip hooks.
- No branch deletion.
- If nothing to commit after staging, report it and stop.
