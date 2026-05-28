# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                          # Run all tests (serially — parallel: 0)
npm run test:tag -- @smoke        # Run by tag (e.g. @smoke, @regression, @api, @12345)
npm run lint                      # ESLint across all .ts source directories
npm run report                    # Open HTML report (reports/cucumber-report.html)
npm run allure:report             # Generate + open Allure report
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
pages/            # Page Object classes (one per domain entity)
test-data/
  env-Data.ts     # Environment → login URL map
  ApplicationUrls.ts  # App-relative paths (e.g. /wfportal/clientmanager.cfm)
  apiConfig.ts    # API base URLs + credentials per environment
  users.json      # Credentials keyed by username; 'default' key = default creds
  ResolveDynamicData.ts  # Random value generators + date resolver
utils/
  CustomWorld.ts  # Cucumber World — shared state across steps
```

## Architecture Patterns

### Browser lifecycle
- `BeforeAll`: launches a single Chromium browser (non-headless, shared across all scenarios)
- `Before`: creates a new `BrowserContext` + `Page` per scenario, instantiates all page objects, starts tracing
- `After`: on failure — attaches a full-page screenshot and saves a trace zip to `allure-results/traces/`; always closes the context
- `AfterAll`: closes the browser; cleans up `downloads/`

### Page Objects (`pages/`)
- One class per domain entity (e.g. `ClientManagerPage`, `TempManagerPage`)
- Constructor accepts `Page`; stored as `private page: Page`
- Selectors use `getByRole` / `getByPlaceholder` — no CSS or XPath
- `fillField(field, value)` maps DataTable field names to locators via a `switch`; throws on unknown fields
- Navigation uses `ApplicationUrls` constants: derive `base` from `this.page.url()`, append the path constant

### Step Definitions (`features/stepDef/`)
- One file per feature; access page objects via `CustomWorld` properties
- Dynamic placeholders resolved in step code before passing to the page:

  | Placeholder | Resolver |
  |---|---|
  | `<RandomAlphabets>` | `RandomAlphabets()` |
  | `<RandomNumbers>` | `RandomNumbers()` |
  | `<RandomEmail>` | `RandomEmail()` |
  | `<RandomString>` | `RandomString()` |
  | `<Today>` | `ResolveDate('<Today>')` → `MM/DD/YYYY` |
  | `<Today+N>` / `<Today-N>` | `ResolveDate(placeholder)` → offset date |
  | `<this.fieldName>` | replace with `this.fieldName` from CustomWorld at runtime |

- Shared scenario state (e.g. `this.clientName`, `this.tempId`) stored on `CustomWorld` — used to pass values between steps within a scenario

### CustomWorld (`utils/CustomWorld.ts`)
- Extends Cucumber's `World`
- Declares `context` (`BrowserContext`), `page`, and one typed property per page class
- Declares typed scenario-state properties (e.g. `clientId?: string`, `tempEmail?: string`)
- Add new page class properties and scenario-state fields here when adding a new domain entity

### API Testing (`pages/APItestPage.ts`)
- Uses `this.page.request` (Playwright's built-in API client) — no separate HTTP lib needed
- Auth via Basic auth header; base URL resolved from the current page's origin via `apiConfig`
- API base path: `/wfportal/clearConnect/2_0/`

## Adding a New Feature

1. Create `pages/XxxPage.ts` — implement `navigateTo*`, `create*`, `waitFor*Id`, and private `fillField`; use `ApplicationUrls` for paths
2. Add `xxxPage!: XxxPage` to `CustomWorld` and import it
3. Instantiate `this.xxxPage = new XxxPage(this.page)` in the `Before` hook in `hooks.ts`
4. Create `features/feature/xxx.feature` with appropriate tags and a `Background` login step
5. Create `features/stepDef/xxx.steps.ts` — resolve dynamic data, call page methods, store state on `this`

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

## Configuration

- `cucumber.js`: glob `features/feature/**/*.feature`, requires hooks + step defs via `ts-node`; `parallel: 0` (serial), `retry: 0`; outputs HTML + Allure reports
- `tsconfig.json`: strict mode, `commonjs`, `noUncheckedIndexedAccess` enabled
- `.eslintrc.json`: `@typescript-eslint/no-floating-promises` and `@typescript-eslint/await-thenable` enforced — all async calls must be awaited
