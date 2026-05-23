# Playwright + Cucumber BDD Framework

## Overview

TypeScript-based test automation framework using Playwright for browser control and Cucumber for BDD-style test definition. Tests run against a ColdFusion web portal (`wfportal`) across multiple environments.

## Commands

```bash
npm test                          # Run all tests
npm run test:tag -- @smoke        # Run by tag (e.g. @smoke, @regression, @12345)
npm run report                    # Open HTML report in browser
```

## Project Structure

```
features/
  feature/        # Gherkin .feature files (one per domain entity)
  stepDef/        # Step definition .ts files (one per feature file)
hooks/
  hooks.ts        # Before/After hooks — browser lifecycle + page object init
pages/            # Page Object classes (one per domain entity)
test-data/
  env-Data.ts     # Environment URL map (Env_QA, Env_Dev, Env_HF)
  users.json      # Credentials keyed by username
  ResolveDynamicData.ts  # Random value generators
utils/
  CustomWorld.ts  # Cucumber World — shared state across steps
```

## Architecture Patterns

### Page Objects (`pages/`)
- One class per domain entity (e.g. `ClientManagerPage`, `TempManagerPage`)
- Constructor accepts `Page` from Playwright; stored as `private page: Page`
- Selectors use Playwright's `getByRole` / `getByPlaceholder` — no CSS/XPath
- `fillField(field, value)` uses a `switch` to map DataTable field names to locators
- URL-relative navigation: derive `base` from `this.page.url()` then navigate to a known path

### Step Definitions (`features/stepDef/`)
- One file per feature, importing only the page objects it needs via `CustomWorld`
- Dynamic data placeholders resolved in step code before passing to the page:
  - `<RandomAlphabets>` → `RandomAlphabets()`
  - `<RandomNumbers>` → `RandomNumbers()`
  - `<RandomEmail>` → `RandomEmail()`
- Shared scenario state (e.g. `this.clientName`, `this.clientId`) stored on `CustomWorld`

### CustomWorld (`utils/CustomWorld.ts`)
- Extends Cucumber's `World`
- Declares `browser`, `context`, `page` (Playwright types)
- Declares one page object property per page class
- Declares typed scenario-state properties (e.g. `clientId?: string`)
- Add new page objects and state properties here when adding a new domain entity

### Hooks (`hooks/hooks.ts`)
- `Before`: launches Chromium (non-headless), creates context/page, instantiates **all** page objects
- `After`: closes browser
- When adding a new page class, import it and instantiate it in `Before`

### Test Data (`test-data/`)
- `env-Data.ts`: environment → login URL map; add new envs here
- `users.json`: credentials object keyed by username; `default` key holds default creds
- `ResolveDynamicData.ts`: pure functions returning random strings — add new generators here

## Adding a New Feature

1. Create `pages/XxxPage.ts` — implement `navigateTo*`, `create*`, `waitFor*Id`, and private `fillField`
2. Add `xxxPage!: XxxPage` to `CustomWorld` and import it
3. Instantiate `this.xxxPage = new XxxPage(this.page)` in `hooks.ts` `Before`
4. Create `features/feature/xxx.feature` with appropriate tags and a `Background` login step
5. Create `features/stepDef/xxx.steps.ts` — resolve dynamic data, call page methods, store state on `this`

## Tags

| Tag | Purpose |
|-----|---------|
| `@smoke` | Critical path, fast subset |
| `@regression` | Full regression suite |
| `@<ticketId>` | Ticket-level targeting (e.g. `@23455`) |

Run a specific tag: `npm run test:tag -- @regression`

## Environments

| Key | URL |
|-----|-----|
| `Env_QA` | `ctmsqa.contingenttalentmanagement.com` |
| `Env_Dev` | `ctmsdev.contingenttalentmanagement.com` |
| `Env_HF` | `ctmsqahf.contingenttalentmanagement.com` |

Login step format: `Given the user login to the application 'Env_QA' with 'testuser_01' credentials`  
Use `'default'` as credential key to use the default username from `users.json`.

## Configuration

- `cucumber.js`: entry point — points at `features/feature/**/*.feature`, requires `hooks/**/*.ts` and `features/stepDef/**/*.ts` via `ts-node`
- `tsconfig.json`: strict mode, `commonjs` modules, `noUncheckedIndexedAccess` enabled
- Reports output to `reports/cucumber-report.html`
