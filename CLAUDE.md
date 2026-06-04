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

## Architecture Patterns

### Browser lifecycle
- `BeforeAll`: launches a single Chromium browser (non-headless, shared across all scenarios)
- `Before`: creates a new `BrowserContext` + `Page` per scenario, instantiates all page objects, starts tracing
- `After`: on failure — attaches a full-page screenshot and saves a trace zip to `allure-results/traces/`; always closes the context
- `AfterAll`: closes the browser; cleans up `downloads/`

### Page Objects (`pages/`)
- All page classes extend `BasePage`, which provides `navigateTo(path)` — derives the origin from `this.page.url()` and appends the given path
- Constructor accepts `Page` (passed to `super(page)`); selectors use `getByRole` / `getByPlaceholder` / `getByLabel` / `getByText` — no CSS or XPath
- Each entity page exports a typed details interface (e.g. `TempDetails`, `ClientDetails`) with required identity fields and optional defaultable fields
- A `DEFAULT_*_DETAILS` constant (not exported) inside the page file holds the defaults typed as `Required<Omit<Interface, 'requiredFields'>>` — TypeScript errors if a new optional field is added without a corresponding default
- `create*(details)` merges `{ ...DEFAULT_*_DETAILS, ...details }` so DataTable values override defaults; omitted fields fall back to defaults
- Private `fillField(field, value)` maps DataTable field names to locators via a `switch`; throws on unknown fields

### Step Definitions (`features/stepDef/`)
- One file per feature; access page objects via `CustomWorld` properties
- DataTable rows are iterated with `dataTable.raw().slice(1)` (skips the header row); each `row[0]` is the field name, `row[1]` is the value
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

- Build `Partial<TDetails>` from the iterated rows using `field as keyof TDetails`, then cast to `TDetails` when calling the page method
- Shared scenario state (e.g. `this.clientName`, `this.tempId`) stored on `CustomWorld` — used to pass values between steps within a scenario

### CustomWorld (`utils/CustomWorld.ts`)
- Extends Cucumber's `World` and implements two interfaces:
  - `PageObjects` — browser infrastructure (`context`, `page`) and all page class instances
  - `ScenarioState` — values captured during a scenario and passed between steps (all optional)
- `CustomWorld implements PageObjects, ScenarioState` ensures TypeScript errors if either interface drifts from the class declaration
- Add new page class properties to `PageObjects` and new captured values to `ScenarioState` when adding a new domain entity

### API Testing (`pages/APItestPage.ts` + `features/stepDef/APItest.steps.ts`)
- Single generic method `callApi(method, params)` on `APItestPage` — handles GET and POST; base URL resolved from the current page's origin via `apiConfig`; auth via Basic header
- API base path: `/wfportal/clearConnect/2_0/`; `action` is always auto-injected from the API name in the step text — never put it in the DataTable
- `API_METHOD_MAP` in `APItest.steps.ts` is the registry that maps action name → HTTP method; the step throws if the name is not registered
- Step pattern: `Given the user perform 'actionName' API call with the following details`; DataTable rows are query params (GET) or body params (POST)
- Response handling in the `Then` assertion step: top-level array → uses `[0]`; object with `rows` key → uses `rows[0]`; plain object → used as-is
- `<this.*>` tokens supported in both the API call step and the assertion step: `<this.tempId>`, `<this.tempFirstName>`, `<this.tempEmail>`, `<this.clientId>`, `<this.clientName>`

## Adding a New API Action

1. Add one entry to `API_METHOD_MAP` in `features/stepDef/APItest.steps.ts`: `actionName: 'GET'`
2. If the action uses a `<this.*>` placeholder not yet listed, add a resolver branch in both the `Given` and `Then` steps in `APItest.steps.ts`, and declare the property on `CustomWorld`'s `ScenarioState` interface
3. Write the scenario in `features/feature/APItest.feature` — assert against the exact field names the API returns

## Adding a New UI Feature

1. Create `pages/XxxPage.ts` — extend `BasePage`; export a `XxxDetails` interface (required identity fields + optional defaultable fields); define `DEFAULT_XXX_DETAILS` constant; implement `navigateTo*`, `create*` (merge defaults), `waitFor*Id`, and private `fillField`
2. Add `xxxPage: XxxPage` to the `PageObjects` interface in `CustomWorld.ts`, declare it with `!` on the class, and import it
3. Instantiate `this.xxxPage = new XxxPage(this.page)` in the `Before` hook in `hooks.ts`
4. Create `features/feature/xxx.feature` with appropriate tags and a `Background` login step
5. Create `features/stepDef/xxx.steps.ts` — build `Partial<XxxDetails>` from DataTable, cast to `XxxDetails`, call page methods, store captured IDs/names on `ScenarioState`

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

- `hooks/hooks.ts`: `setDefaultTimeout(60 * 1000)` — each step times out after 60 seconds
- `cucumber.js`: glob `features/feature/**/*.feature`, requires hooks + step defs via `ts-node`; `parallel: 0` (serial), `retry: 0`; outputs HTML + Allure reports
- `tsconfig.json`: strict mode, `commonjs`, `noUncheckedIndexedAccess` enabled
- `.eslintrc.json`: `@typescript-eslint/no-floating-promises` and `@typescript-eslint/await-thenable` enforced — all async calls must be awaited
