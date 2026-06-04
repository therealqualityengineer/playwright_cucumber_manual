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
Notes: <extra rules>
```

## Procedure

### Step 1 — Read existing code first

Before writing anything, read these files to understand what already exists:

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

| Step Text | File | Purpose |
|-----------|------|---------|
| `Given the user login to the application 'Env_QA' with 'testuser_01' credentials` | login.steps.ts | Login — always in Background |
| `And the user create a new temp with the following details` | tempManager.steps.ts | Create a temp via DataTable |
| `Then the temp id should be generated successfully in the url` | tempManager.steps.ts | Wait for temp ID → stores `this.tempId`, `this.tempFirstName` |
| `And the user create a new client with the following details` | clientManager.steps.ts | Create a client via DataTable |
| `Then the client id should be generated successfully in the url` | clientManager.steps.ts | Wait for client ID → stores `this.clientId`, `this.clientName` |
| `And the user create a new order with the following details` | orderManager.steps.ts | Create an order via DataTable |
| `Then the order id should be generated successfully` | orderManager.steps.ts | Wait for order ID → stores `this.orderId` |
| `And the user navigate to the {string} section` | reportManager.steps.ts | Navigate to a named section |
| `And the user generate the {string} report with the following details` | reportManager.steps.ts | Generate a named report |
| `Then the report should be downloaded successfully and report name start with {string}` | reportManager.steps.ts | Assert download filename prefix |
| `Given the user perform {string} API call with the following details` | APItest.steps.ts | Make an API call with params DataTable |
| `Then the API response should contain the following details` | APItest.steps.ts | Assert API response fields |

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

**Rules:**
- Tags on the `Scenario:` line: at least `@regression` or `@smoke` plus an optional `@<ticketId>`.
- Steps after Background use `And` (not `Given`/`When`) — match the existing style in the project.
- Dynamic tokens in step text: `<RandomAlphabets>`, `<RandomEmail>`, `<RandomNumbers>`, `<Today+N>`.
- World state tokens: `<this.tempId>`, `<this.tempFirstName>`, `<this.clientName>`, etc. — always `<this.*>` prefix.
- Use `Scenario Outline` + `Examples` only for data-driven multi-row cases.

### Step 4 — Write step definitions

**Location**: `features/stepDef/<domain>.steps.ts`  
One file per domain, matching the feature file name.

**DataTable pattern** — always use `raw().slice(1)` (skips the header row):

```typescript
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { CustomWorld } from '../../utils/CustomWorld';
import { RandomAlphabets, RandomEmail, RandomNumbers, RandomString, ResolveDate } from '../../test-data/ResolveDynamicData';
import { MyEntityDetails } from '../../pages/MyEntityPage';

Given('the user create a new entity with the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const details: Partial<MyEntityDetails> = {};

    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        let value = row[1] ?? '';

        // Resolve dynamic tokens inline BEFORE assigning
        if (value === '<RandomAlphabets>') {
            value = RandomAlphabets();
        } else if (value === '<RandomEmail>') {
            value = RandomEmail();
        } else if (value === '<RandomNumbers>') {
            value = RandomNumbers();
        } else if (value === '<RandomString>') {
            value = RandomString();
        } else if (value.includes('<Today')) {
            value = ResolveDate(value);
        } else if (value === '<this.clientName>') {
            value = this.clientName ?? '';
        } else if (value === '<this.tempFirstName>') {
            value = this.tempFirstName ?? '';
        } else if (value === '<this.tempId>') {
            value = this.tempId ?? '';
        } else if (value === '<this.clientId>') {
            value = this.clientId ?? '';
        }
        // Add more <this.*> cases as needed for new ScenarioState fields

        details[field as keyof MyEntityDetails] = value;
    }

    const entityName = details['Name'];
    if (entityName !== undefined) this.clientName = entityName; // capture for later steps

    await this.myEntityPage.navigateToNewEntity();
    await this.myEntityPage.createEntity(details as MyEntityDetails);
});
```

**Key rules for step code:**
- `dataTable.raw().slice(1)` — skip header row; each `row[0]` is field, `row[1]` is value.
- Resolve tokens inline with `if/else` chains — no shared helper function.
- `<this.*>` tokens: explicit per-field `else if` matching each `ScenarioState` property.
- `<Today>` / `<Today+N>` / `<Today-N>`: `value.includes('<Today')` guard + `ResolveDate(value)`.
- All `async` calls must be awaited — `@typescript-eslint/no-floating-promises` is enforced.
- No `@ts-nocheck` — write properly typed code.

### Step 5 — Add new API actions (if needed)

If the scenario calls a new API not yet in `API_METHOD_MAP`:

```typescript
// In features/stepDef/APItest.steps.ts
const API_METHOD_MAP: Record<string, HttpMethod> = {
    getTemps:   'GET',
    getClients: 'GET',
    getOrders:  'GET',  // ← ADD HERE
};
```

Add a `<this.*>` resolver branch in both the `Given` API call step and `Then` assertion step if the new token isn't already handled.

### Step 6 — Update CustomWorld (if new state needed)

If a new `ScenarioState` field is needed (e.g., `this.orderId`):

1. Add to `ScenarioState` interface in `utils/CustomWorld.ts`:
   ```typescript
   interface ScenarioState {
       // ... existing
       orderId?: string;
   }
   ```
2. Add to `CustomWorld` class body:
   ```typescript
   orderId?: string;
   ```
3. Capture in the step that produces the value.

### Step 7 — Honor every Note

Check the input spec's `Notes:` section and apply each rule before finalising.

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
| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Timeout waiting for element` | Locator doesn't match the live DOM | Snapshot the page, update the `getByRole`/`getByLabel` in the page class |
| `No temp ID found in URL` | Page didn't save / wrong URL pattern | Snapshot after save click; adjust `waitForTempId` regex |
| `Assertion failed: expected X to be Y` | Wrong field name in API DataTable | Check the actual API response key names |
| `Unknown API name` | API action not in `API_METHOD_MAP` | Add the action name to `API_METHOD_MAP` in `APItest.steps.ts` |

## Token Reference

| Feature Token | Resolved By | Example Output |
|---------------|-------------|----------------|
| `<RandomAlphabets>` | `RandomAlphabets()` | `HJKLDMQRST` |
| `<RandomNumbers>` | `RandomNumbers()` | `4829103847` |
| `<RandomEmail>` | `RandomEmail()` | `ABCDEFGHIJ@gmail.com` |
| `<RandomString>` | `RandomString()` | `A3F8M2K0PQ` |
| `<Today>` | `ResolveDate('<Today>')` | `06/04/2026` |
| `<Today+N>` | `ResolveDate('<Today+N>')` | `06/06/2026` |
| `<Today-N>` | `ResolveDate('<Today-N>')` | `06/02/2026` |
| `<this.tempId>` | `this.tempId ?? ''` | `12345` |
| `<this.tempFirstName>` | `this.tempFirstName ?? ''` | `ABCDEFGHIJ` |
| `<this.tempEmail>` | `this.tempEmail ?? ''` | `ABC@gmail.com` |
| `<this.clientId>` | `this.clientId ?? ''` | `67890` |
| `<this.clientName>` | `this.clientName ?? ''` | `ABCDEFGHIJ` |
| `<this.orderId>` | `this.orderId ?? ''` | `99001` |

All token resolvers are in [test-data/ResolveDynamicData.ts](../../test-data/ResolveDynamicData.ts).
All World state fields are in [utils/CustomWorld.ts](../../utils/CustomWorld.ts).

## Output

Report what was created vs reused: the feature file path, which steps were reused, which new
step definitions were added, and any CustomWorld/API_METHOD_MAP changes made.
