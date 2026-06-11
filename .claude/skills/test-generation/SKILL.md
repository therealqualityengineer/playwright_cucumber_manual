---
name: test-generation
description: Generate Cucumber feature files and step definitions for our Playwright + Cucumber framework. Use when asked to create or scaffold a test, scenario, or .feature/.steps.ts file from a scenario spec. Reuses existing step definitions instead of duplicating them.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Test Generation (Cucumber + Playwright)

Generate a Cucumber feature file and its step definitions from a scenario spec,
reusing existing steps wherever possible.

## Input

Invoked as `/test-generation` followed by a spec in this format (also available via `$ARGUMENTS`):

```
Feature file: <path to .feature>
Steps file:   <path to .steps.ts>
Tag: <tag>
Scenario: <name>
  1. Given/When/Then steps
  2. ...
Notes:
    - <extra rules>
```

> **CRITICAL — Read `Notes:` before writing anything.**
> The `Notes:` field is where the user specifies internal steps, domain-specific conditions, sequencing rules, and override behaviour that is **not** derivable from the standard procedure below. Every rule in `Notes:` is mandatory and takes precedence over the defaults in this skill. Ignoring or skimming Notes is the #1 source of incorrect output.

## Procedure

### Step 1 — Read Notes and existing code first

**Before writing anything**, read the `Notes:` field in the input spec completely. Every rule there is mandatory (see Step 7). Then read these files to understand what already exists:

```bash
# Find all existing step texts
grep -r "Given\|When\|Then\|And" features/feature --include="*.feature" | grep -v "^Binary"
grep -r "Given\|When\|Then" features/stepDef --include="*.steps.ts"
```

Also read:

- `utils/CustomWorld.ts` — to know available `ScenarioState` fields (`this.tempId`, `this.clientName`, etc.)
- `test-data/ResolveDynamicData.ts` — to know available token resolvers
- Any relevant `pages/*Page.ts` files

### Step 2 — Reuse existing steps aggressively

**Canonical reusable steps** (already implemented — use these exact texts):

#### Core Entity Steps

| Step Text                                                                    | File                   | Purpose                                                                     |
| ---------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `Given the user login to the application {string} with {string} credentials` | login.steps.ts         | Login — always in Background                                                |
| `And the user create a new temp with the following details`                  | tempManager.steps.ts   | Create a temp via DataTable → stores `this.tempFirstName`, `this.tempEmail` |
| `Then the temp id should be generated successfully in the url`               | tempManager.steps.ts   | Wait for temp ID → stores `this.tempId`                                     |
| `And the user create a new client with the following details`                | clientManager.steps.ts | Create a client via DataTable → stores `this.clientName`                    |
| `Then the client id should be generated successfully in the url`             | clientManager.steps.ts | Wait for client ID → stores `this.clientId`                                 |
| `And the user create a new order with the following details`                 | orderManager.steps.ts  | Create an order via DataTable                                               |
| `Then the order id should be generated successfully`                         | orderManager.steps.ts  | Wait for order ID → stores `this.orderId`                                   |

#### Temp-Specific Steps

| Step Text                                                                          | File                 | Purpose                                                         |
| ---------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------- |
| `And the user added the Flat pay of {string} and {string} to Pay and Bill amounts` | tempManager.steps.ts | Navigate to temp pay page and set flat pay/bill amounts         |
| `Then the user verifies Flat Pay enabled`                                          | tempManager.steps.ts | Assert that flat pay is enabled on temp pay page                |
| `When the user opens the {string} profile page`                                    | tempManager.steps.ts | Navigate to a profile page — supports `'temp'`                  |
| `And the user opens the {string} tab and applies the following filters`            | tempManager.steps.ts | Open a tab (e.g. `'Facilities'`) and apply DataTable filters    |
| `And the user sets the following status on the Facilities page`                    | tempManager.steps.ts | Set field/value pairs (e.g. Oriented/Check, Preferred/Select)   |
| `Then the user verifies the {string} message`                                      | tempManager.steps.ts | Assert a visible message on the page                            |
| `Then the user verifies that the following status is set on the {string} page`     | tempManager.steps.ts | Assert field status (e.g. Oriented→Checked, Preferred→Selected) |

#### Report Steps

| Step Text                                                                                                       | File                   | Purpose                                                          |
| --------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------- |
| `And the user navigate to the {string} section`                                                                 | reportManager.steps.ts | Navigate to a named app section (e.g. `'Report Manager'`)        |
| `Then the user generate the {string} report with the following details`                                         | reportManager.steps.ts | Generate a named report → stores `this.downloadedReportName`     |
| `Then the report should be downloaded successfully and report name start with {string}`                         | reportManager.steps.ts | Assert download filename prefix                                  |
| `Then the user open the downloaded report and verify the temp details in the report with the following details` | reportManager.steps.ts | Open downloaded file and verify content contains expected values |

#### API Steps

| Step Text                                                             | File             | Purpose                                                                 |
| --------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| `Given the user perform {string} API call with the following details` | APItest.steps.ts | Make an API call with params DataTable — action auto-injected from name |
| `Then the API response should contain the following details`          | APItest.steps.ts | Assert API response fields                                              |

**Create a new step ONLY if no canonical step matches.**

### Step 3 — Write the feature file

**Location**: `features/feature/<domain>.feature`
**No subdirectories** inside `features/feature/` or `features/stepDef/`.

```gherkin
Feature: <Domain> Functionality

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  @regression @<ticketId>
  Scenario: <name>
    And the user create a new temp with the following details
      | Field         | Value             |
      | First Name    | <RandomAlphabets> |
      | Last Name     | <RandomAlphabets> |
      | Primary Email | <RandomEmail>     |
    Then the temp id should be generated successfully in the url
```

**Credential reference by feature** (use the correct user per domain):

| Feature       | Credential                                          |
| ------------- | --------------------------------------------------- |
| tempManager   | testuser_04                                         |
| APItest       | testuser_04                                         |
| orderManager  | testuser_03                                         |
| reportManager | testuser_01                                         |
| clientManager | testuser_01                                         |
| New features  | testuser_01 (default — confirm with user if unsure) |

**Rules:**

- Tags on the `Scenario:` line: at least `@regression` or `@smoke` plus an optional `@<ticketId>`.
- Steps after Background use `And` (not `Given`/`When`) — match the existing style in the project.
- Dynamic tokens in step text: `<RandomAlphabets>`, `<RandomEmail>`, `<RandomNumbers>`, `<Today+N>`.
- World state tokens: `<this.tempId>`, `<this.tempFirstName>`, `<this.clientName>`, etc. — always `<this.*>` prefix.
- Use `Scenario Outline` + `Examples` only for data-driven multi-row cases.

### Step 3b — Shared BasePage Utilities (popup selection)

Any spec step that selects a temp, client, or entity via a search popup **must** use a page method that delegates to `BasePage.selectFromSearchPopup` — never re-implement the popup flow inline in a step or page method.

See [POM_IMPLEMENTATION.md](../cucumber-patterns/references/POM_IMPLEMENTATION.md#search-popup-selection) for the full pattern with code examples.

---

### Step 4 — Write step definitions

**Location**: `features/stepDef/<domain>.steps.ts`
One file per domain, matching the feature file name.

**DataTable pattern** — always use `raw().slice(1)` (skips the header row):

```typescript
import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { CustomWorld } from "../../utils/CustomWorld";
import { resolvePlaceholder } from "../../utils/resolvePlaceholder";
import { MyEntityDetails } from "../../pages/MyEntityPage";

Given(
  "the user create a new entity with the following details",
  async function (this: CustomWorld, dataTable: DataTable) {
    const details: Partial<MyEntityDetails> = {};

    for (const row of dataTable.raw().slice(1)) {
      const field = row[0] ?? "";
      details[field as keyof MyEntityDetails] = resolvePlaceholder(
        row[1] ?? "",
        this,
      );
    }

    const entityName = details["Name"];
    if (entityName !== undefined) this.clientName = entityName;

    await this.myEntityPage.navigateToNewEntity();
    await this.myEntityPage.createEntity(details as MyEntityDetails);
  },
);
```

**Key rules for step code:**

- `dataTable.raw().slice(1)` — skip header row; each `row[0]` is field, `row[1]` is value.
- Resolve tokens with `resolvePlaceholder(row[1] ?? '', this)` from `utils/resolvePlaceholder.ts` — handles all `<Random*>`, `<Today[±N]>`, and `<this.*>` tokens. Never re-implement inline chains.
- All `async` calls must be awaited — `@typescript-eslint/no-floating-promises` is enforced.
- No `@ts-nocheck` — write properly typed code.

### Step 5 — Add new API actions (if needed)

If the scenario calls a new API not yet in `API_METHOD_MAP`:

```typescript
// In features/stepDef/APItest.steps.ts
const API_METHOD_MAP: Record<string, HttpMethod> = {
  getTemps: "GET",
  getClients: "GET",
  getOrders: "GET", // ← ADD HERE
};
```

New `<this.*>` tokens are resolved automatically by `resolvePlaceholder` — no additional resolver branches needed.

### Step 6 — Update CustomWorld (if new state needed)

If a new `ScenarioState` field is needed (e.g., `this.invoiceId`):

1. Add to `ScenarioState` interface in `utils/CustomWorld.ts`:
   ```typescript
   interface ScenarioState {
     // ... existing
     invoiceId?: string;
   }
   ```
2. Add to `CustomWorld` class body:
   ```typescript
   invoiceId?: string;
   ```
3. Capture in the step that produces the value.

**Current `ScenarioState` fields** (already declared in `CustomWorld.ts`):

| Field                  | Type      | Captured By                                     |
| ---------------------- | --------- | ----------------------------------------------- |
| `apiResponse`          | `unknown` | API call step                                   |
| `clientName`           | `string`  | `the user create a new client...`               |
| `clientId`             | `string`  | `the client id should be generated...`          |
| `tempFirstName`        | `string`  | `the user create a new temp...`                 |
| `tempEmail`            | `string`  | `the user create a new temp...` (Primary Email) |
| `tempId`               | `string`  | `the temp id should be generated...`            |
| `orderId`              | `string`  | `the order id should be generated successfully` |
| `downloadedReportName` | `string`  | `the user generate the {string} report...`      |

### Step 7 — Honor every Note (**MANDATORY — do this before finalising anything**)

Re-read the `Notes:` section from the input spec. Treat every rule there as a hard requirement:

- Apply each note to the feature file, step definitions, page objects, and CustomWorld as appropriate.
- Notes may specify field values, step order, which existing steps to skip or replace, API actions to add, or CustomWorld fields to capture — follow them exactly.
- If a Note conflicts with a default in this procedure, **the Note wins**.
- Do not produce final output until all Notes are satisfied.

### Step 8 — Run the generated scenario and verify it passes

After writing the files, run the scenario by name to confirm it executes end-to-end:

```bash
npm run name -- "<Scenario name here>"
```

Interpret the result:

- **All steps green** → done. Report "N steps passed".
- **Any step fails** → proceed to Step 9.

### Step 9 — Fix failures using Playwright MCP (if test fails)

If the test fails, use the Playwright MCP browser tools to investigate and fix:

1. **Identify the failing step** from the error output.
2. **Navigate to the relevant page** using `mcp__playwright__browser_navigate` to open the app at the URL the step targets.
3. **Take a snapshot** with `mcp__playwright__browser_snapshot` to see the live DOM and identify the correct locator.
4. **Compare the locator in the page class** (`pages/*Page.ts`) against what the snapshot reveals.
5. **Fix the locator or step logic** — edit the page method or step definition with the corrected selector.
6. **Re-run the scenario** with `npm run name -- "<Scenario name>"` to confirm the fix.
7. Repeat steps 2–6 until all steps pass.

**Common failure causes and fixes:**

| Symptom                                | Likely cause                         | Fix                                                            |
| -------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `Timeout waiting for element`          | Locator doesn't match the live DOM   | Snapshot the page, update the `getByRole`/`getByLabel` in page |
| `No temp ID found in URL`              | Page didn't save / wrong URL pattern | Snapshot after save click; adjust `waitForTempId` regex        |
| `Assertion failed: expected X to be Y` | Wrong field name in API DataTable    | Check the actual API response key names                        |
| `Unknown API name`                     | API action not in `API_METHOD_MAP`   | Add the action name to `API_METHOD_MAP` in `APItest.steps.ts`  |

## Token Reference

| Feature Token          | Resolved By                | Example Output         |
| ---------------------- | -------------------------- | ---------------------- |
| `<RandomAlphabets>`    | `RandomAlphabets()`        | `HJKLDMQRST`           |
| `<RandomNumbers>`      | `RandomNumbers()`          | `4829103847`           |
| `<RandomEmail>`        | `RandomEmail()`            | `ABCDEFGHIJ@gmail.com` |
| `<RandomString>`       | `RandomString()`           | `A3F8M2K0PQ`           |
| `<Today>`              | `ResolveDate('<Today>')`   | `06/04/2026`           |
| `<Today+N>`            | `ResolveDate('<Today+N>')` | `06/06/2026`           |
| `<Today-N>`            | `ResolveDate('<Today-N>')` | `06/02/2026`           |
| `<this.tempId>`        | `this.tempId ?? ''`        | `12345`                |
| `<this.tempFirstName>` | `this.tempFirstName ?? ''` | `ABCDEFGHIJ`           |
| `<this.tempEmail>`     | `this.tempEmail ?? ''`     | `ABC@gmail.com`        |
| `<this.clientId>`      | `this.clientId ?? ''`      | `67890`                |
| `<this.clientName>`    | `this.clientName ?? ''`    | `ABCDEFGHIJ`           |
| `<this.orderId>`       | `this.orderId ?? ''`       | `99001`                |

All token resolvers are in [test-data/ResolveDynamicData.ts](../../test-data/ResolveDynamicData.ts).
All World state fields are in [utils/CustomWorld.ts](../../utils/CustomWorld.ts).

## Output

Report what was created vs reused: the feature file path, which steps were reused, which new
step definitions were added, and any CustomWorld/API_METHOD_MAP changes made.
