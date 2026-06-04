---
name: create-pr
description: 'Create a branch, commit staged changes, push, and open a GitHub PR. Use when the user wants to ship current workspace changes as a pull request. Runs lint first, writes a Conventional Commit message, and builds a structured PR description.'
argument-hint: 'Human-readable PR title (e.g. "Add report manager scenarios")'
allowed-tools: Bash
---

# Create PR

Convert current workspace changes into a review-ready GitHub pull request.

## Invocation

```
/create-pr <PRNAME>
```

`<PRNAME>` is the human-readable PR title (e.g. `Add report manager scenarios`).
If omitted, derive a title from the changed files.

## Workflow

### 1 — Inspect the repository state

```bash
git rev-parse --abbrev-ref HEAD          # current branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || \
  gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'   # default branch
git status                               # what is changed / untracked
git diff --stat                          # quick summary of pending changes
```

### 2 — Branch handling

- **Never commit directly to the default branch** (`main` / `master`).
- If already on a non-default branch, reuse it.
- If on the default branch, create a feature branch:
  - Derive name from `<PRNAME>`: lowercase, spaces → hyphens, strip non-alphanumeric, prefix `feature/`.
  - Example: `"Add report manager scenarios"` → `feature/add-report-manager-scenarios`.
  - `git checkout -b <branch>` (or `git checkout <branch>` if it already exists).

### 3 — Run lint before staging

```bash
npm run lint
```

- If lint **errors** (exit code 1): stop, report the errors, do not commit. Ask the user to fix them first.
- If lint **warnings only** (exit code 0): continue; note the warnings in the PR body.

### 4 — Stage changes carefully

Inspect `git status` output and stage only relevant source files:

```bash
git add features/ pages/ hooks/ utils/ test-data/ .claude/
```

**Never stage:**
- `.env`, `.env.*`, `*.pem`, `*.key`, `credentials.*` — possible secrets
- `node_modules/`, `allure-results/`, `reports/`, `downloads/` — generated artefacts
- Large binary files

If there is nothing to commit after staging, say so and stop.

### 5 — Commit

Use Conventional Commits format with the Co-Authored-By footer:

```bash
git commit -m "$(cat <<'EOF'
feat: <PRNAME>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Use the correct type prefix based on the changes:
| Type | When |
|------|------|
| `feat` | New feature, new scenario, new page |
| `fix` | Bug fix, corrected locator, broken step |
| `refactor` | Code restructured without behaviour change |
| `test` | Tests only |
| `docs` | README / CLAUDE.md / skill docs |
| `chore` | Dependency update, config, tooling |

### 6 — Push

```bash
# First push on a new branch:
git push -u origin <branch>

# Subsequent push on an existing tracking branch:
git push
```

### 7 — Analyse the diff

```bash
git diff origin/main...<branch> --stat
git diff origin/main...<branch>
```

Use the full diff to build the PR description below.

### 8 — Create the PR

Build the PR body following the project standard:

```
## Summary
- <bullet: what changed>
- <bullet: why / motivation>
- <bullet: scope — new files, updated files>

## Key changes
- `path/to/file.ts` — what changed and why
- `features/feature/foo.feature` — new scenarios added

## Test plan
- [ ] Run `npm run tag -- @regression` and verify all scenarios pass
- [ ] Confirm new scenario(s) pass individually with `npm run name -- "<scenario name>"`
- [ ] Check allure report for trace on any failure

## Config / dependency changes
<list any changed config files, or "None">

## Risks
<list any potential issues, or "No major risks detected">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Then open the PR:

```bash
gh pr create \
  --base main \
  --head <branch> \
  --title "<PRNAME>" \
  --body "$(cat <<'EOF'
<body from above>
EOF
)"
```

If `gh` is unavailable, print the compare URL and generated body instead.

### 9 — Report results

Output a concise summary:
- Branch name used
- Commit hash + message
- Push status
- PR URL (or compare URL if `gh` unavailable)
- Any lint warnings carried into the PR body
- Any risks flagged

## Safety rules

- Never commit to the default branch.
- Never force-push (`--force`).
- Never delete branches.
- Never skip `--no-verify` on hooks.
- Never include secret values in output — mention file + line number only.
- If `git status` shows nothing to commit, report it and stop cleanly.
- Echo every `git` / `gh` command before running it.
