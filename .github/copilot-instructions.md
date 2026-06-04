# Copilot Instructions — Playwright + Cucumber Test Framework

**Stack**: Playwright + Cucumber + TypeScript

This repo is a Playwright+BBD test framework. For full implementation guidance, use [CLAUDE.md](../CLAUDE.md) and [.instructions.md](../.instructions.md).

---

## Key Workflow

- Install dependencies: `npm install`
- Install Playwright browsers: `npx playwright install`
- Run tests: `npm run test`
- Run tagged tests: `npm run tag -- @smoke`
- Generate/open report: `npm run report`
- Lint TypeScript: `npm run lint`

---

## Test structure

- `features/feature/*.feature` — Gherkin scenarios
- `features/stepDef/*.steps.ts` — one step-definition file per feature
- `pages/*Page.ts` — page object classes, one per domain entity
- `hooks/` — browser and scenario lifecycle hooks
- `test-data/` — env URLs, credentials, and dynamic data helpers
- `utils/CustomWorld.ts` — shared scenario state and page object wiring

---

## Page object conventions

- Every page class extends `BasePage` (`pages/BasePage.ts`)
- Use role-based locators only: `getByRole`, `getByPlaceholder`, `getByLabel`
- Do not use CSS selectors or XPath
- Implement a private `fillField(field, value)` switch that throws on unknown fields
- Use `*Details` interfaces plus `DEFAULT_*_DETAILS` defaults for optional inputs

---

## Step-definition rules

- One unique Gherkin step maps to one step definition
- Resolve dynamic values in step code before calling page methods
- Capture scenario state on `CustomWorld` for reuse across steps
- Do not store credentials or URLs in feature text

### Dynamic placeholders

Resolve these in step code:
- `<RandomAlphabets>` / `<RandomNumbers>` / `<RandomString>` / `<RandomEmail>`
- `<Today>`, `<Today+N>`, `<Today-N>`
- `<this.someField>` → replace with `CustomWorld` state

---

## API test conventions

- API tests live under `features/feature/APItest.feature` and `features/stepDef/APItest.steps.ts`
- Use `APItestPage` to call ClearConnect APIs
- `API_METHOD_MAP` maps action names to HTTP methods
- Do not include the `action` parameter in DataTables; it is derived from step text
- Assertions should normalize responses: arrays use `[0]`, objects with `rows` use `rows[0]`

---

## Environments and credentials

- Environment URLs are configured in `test-data/env-Data.ts`
- Credentials are stored in `test-data/users.json`
- Use parameterized login in feature `Background` sections

---

## Tags

- `@smoke` — fast critical paths
- `@regression` — full regression suite
- `@api` — API tests
- `@<ticketId>` — issue-level targeting
