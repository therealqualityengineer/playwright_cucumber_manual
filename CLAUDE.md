# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup

```bash
npm install
npx playwright install        # Install Chromium browser binary
```

## Commands

```bash
npm test                      # Run all tests (serially — parallel: 0)
npm run tag -- @smoke         # Run by tag (e.g. @smoke, @regression, @api, @23455)
npm run name -- "scenario name"  # Run by scenario name substring
npm run line -- features/feature/tempManager.feature:12  # Run by file:line
npm run lint                  # ESLint across all .ts source directories
npm run report                # Open HTML report (reports/cucumber-report.html)
npm run allure:report         # Generate + open Allure report
```

To view a Playwright trace from a failed scenario:
```bash
npx playwright show-trace allure-results/traces/<trace>.zip
```

## Project Structure

```
features/
  feature/        # Gherkin .feature files (one per domain entity)
  stepDef/        # Step definition .ts files (one per feature file)
hooks/
  hooks.ts        # BeforeAll/AfterAll (browser) + Before/After (context, page, page objects)
pages/
  BasePage.ts     # Abstract base — all page objects extend this
  *Page.ts        # One class per domain entity
test-data/
  env-Data.ts     # Environment → login URL map
  ApplicationUrls.ts  # App-relative paths (e.g. /wfportal/clientmanager.cfm)
  apiConfig.ts    # API base URLs + credentials per environment
  users.json      # Credentials keyed by username; 'default' key = default creds
  ResolveDynamicData.ts  # Random value generators + date resolver
utils/
  CustomWorld.ts  # Cucumber World — shared state across steps
```

## Tags

| Tag | Purpose |
|-----|---------|
| `@smoke` | Critical path, fast subset |
| `@regression` | Full regression suite |
| `@api` | API-level tests via ClearConnect |
| `@<ticketId>` | Ticket-level targeting (e.g. `@23455`) |

## Environments

| Key | Login URL |
|-----|-----------|
| `Env_QA` | `ctmsqa.contingenttalentmanagement.com` |
| `Env_Dev` | `ctmsdev.contingenttalentmanagement.com` |
| `Env_HF` | `ctmsqahf.contingenttalentmanagement.com` |

Login step format: `Given the user login to the application 'Env_QA' with 'testuser_01' credentials`

**Credential used per feature:**

| Feature file  | Credential  |
| ------------- | ----------- |
| tempManager   | testuser_04 |
| APItest       | testuser_04 |
| orderManager  | testuser_03 |
| reportManager | testuser_01 |
| clientManager | testuser_01 |

## Configuration

- `hooks/hooks.ts`: `setDefaultTimeout(60 * 1000)` — each step times out after 60 seconds
- `cucumber.js`: serial (`parallel: 0`), `retry: 0`; HTML + Allure reports
- `tsconfig.json`: strict mode, `commonjs`, `noUncheckedIndexedAccess` enabled
- `.eslintrc.json`: `no-floating-promises` and `await-thenable` enforced — all async calls must be awaited

## Skills

Invoke these skills for detailed patterns and procedures:

| Skill | When to use |
|-------|-------------|
| `/test-generation` | Generate a new feature file + step definitions from a spec |
| `/cucumber-patterns` | Author or edit `.feature` / `.steps.ts` files |
| `/api-test` | Write API assertion steps against the ClearConnect backend |
| `/create-pr` | Commit, push, and open a GitHub PR |
