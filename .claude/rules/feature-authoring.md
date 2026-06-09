---
description: Rules for writing or editing Gherkin .feature files. Apply when creating scenarios, adding tags, or structuring Background steps.
globs: features/feature/**/*.feature
alwaysApply: false
---

# Feature File Authoring Rules

For full authoring procedure, invoke `/cucumber-patterns`.

## File Location

- One `.feature` file per domain entity, in `features/feature/` — no subdirectories.
- Naming: `<domainEntity>.feature` (e.g., `tempManager.feature`, `clientManager.feature`).

## Tags

- Every `Scenario:` line needs at least `@regression` or `@smoke`.
- Add `@<ticketId>` when work is ticket-linked (e.g., `@23455`).
- Use `@api` for scenarios that make ClearConnect API calls.
- Feature-level tags (`@smoke @regression`) are inherited by all scenarios — don't repeat on each scenario if already on Feature.

## Background

- Always use a `Background:` block with the login step.
- Format: `Given the user login to the application 'Env_QA' with '<credential>' credentials`
- Use the correct credential per domain:

| Feature file   | Credential   |
|----------------|--------------|
| tempManager    | testuser_04  |
| APItest        | testuser_04  |
| orderManager   | testuser_03  |
| reportManager  | testuser_01  |
| clientManager  | testuser_01  |
| New features   | testuser_01 (default — confirm if unsure) |

## Step Style

- Steps after Background use `And` — not `Given`/`When`/`Then` — to match existing project style.
- Reuse existing canonical steps before writing new ones (see `test-generation` skill for the full registry).

## Dynamic Tokens

Tokens are placeholders resolved in step code — never hardcode values in the feature file:

| Token                  | Resolves to           |
|------------------------|-----------------------|
| `<RandomAlphabets>`    | Random uppercase word |
| `<RandomEmail>`        | Random email address  |
| `<RandomNumbers>`      | Random numeric string |
| `<RandomString>`       | Alphanumeric mix      |
| `<Today>`              | Today's date          |
| `<Today+N>` / `<Today-N>` | Offset date       |
| `<this.tempId>`        | World state field     |
| `<this.clientName>`    | World state field     |

## Scenario Outline

Use `Scenario Outline` + `Examples` only for data-driven cases with multiple distinct rows. Do not use it for single-row parameterisation.
