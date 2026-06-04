---
name: cucumber-patterns
description: 'Author Cucumber feature files and step definitions for Playwright+Cucumber framework. Use when: creating or editing .feature or .steps.ts files; implementing new test scenarios; integrating new UI pages or API actions. Ensures step reuse, proper type safety, dynamic date handling, and POM compliance.'
argument-hint: 'Describe the feature to author (e.g., "Login workflow", "API client creation")'
---

# Cucumber Test Authoring

Author Gherkin features and TypeScript step definitions following the Playwright + Cucumber framework patterns. This skill ensures step reuse, type safety, date resolution, and consistency with the Page Object Model architecture.

## When to Use

- Creating a new feature file (`.feature`)
- Writing step definitions (`.steps.ts`)
- Adding steps to existing features
- Implementing scenarios for a new domain entity (new `*Page.ts`)
- Integrating new API actions via the ClearConnect API

## Before You Begin: Key Principles

1. **Always search first**: Before writing ANY step text (Given/When/Then), search `features/feature/**/*.feature` and `features/stepDef/**/*.steps.ts` for matching step text. **Reuse existing steps** — do not duplicate step definitions.

2. **One file pair per domain entity**: Each domain (e.g., `tempManager`, `clientManager`, API actions) has exactly one `.feature` file and one `.steps.ts` file. No subdirectories in `features/feature/` or `features/stepDef/`.

3. **Type-safe DataTables**: All scenario data flows through typed `*Details` interfaces. Omit DataTable rows for fields with defaults — the page class merges `DEFAULT_*_DETAILS` with the partial DataTable. See [Type-Safe Details](#type-safe-details).

4. **Dynamic tokens are resolved in step code**: Placeholders like `<Today+2>`, `<RandomEmail>` are replaced **in the step definition**, never hardcoded in scenario text or page classes. See [Dynamic Token Resolution](#dynamic-token-resolution).

5. **Credentials and URLs come from config**: Never hardcode usernames, passwords, or environment URLs. Use the parameterized Background login step and resolve endpoints via [env-Data.ts](../../test-data/env-Data.ts) and [users.json](../../test-data/users.json).

## Step-by-Step Procedure

### 1. Check for Existing Steps

**Before writing a single step**, search the project:

```bash
# Search for step text matching your intent
grep -r "the user.*login\|the user.*create\|the user.*navigate" features/feature features/stepDef
```

If an exact or semantically matching step exists, **reuse it**. If similar but not identical, refactor the existing step to accept a parameter or DataTable row, then reuse. Only create a new step if no match exists.

#### Step Matching Rules
- **Exact text match**: Always reuse (e.g., "Given the user login to the application" appears in multiple features).
- **Semantic overlap**: If two steps do the same action with different wording, harmonize them to one canonical wording.
- **Generic steps**: Steps with DataTable values are preferred over multiple hardcoded variants.

### 2. Define or Extend the Page Class

If implementing a **new domain entity** (e.g., `InvoiceManager`):

1. Create `pages/InvoiceManagerPage.ts` extending `BasePage` with:
   - A `InvoiceManagerDetails` interface with required identity fields and optional defaultable fields
   - A `DEFAULT_INVOICE_MANAGER_DETAILS` constant covering all optional fields
   - A private `fillField(field: string, value: string)` method that maps DataTable field names → locators via `switch`; throw if field is unknown
   - Public methods: `navigateTo*`, `create*Details`, `waitFor*Id`, form interaction helpers

2. Add the page to `CustomWorld.ts`:
   - Declare property on the `PageObjects` interface: `invoiceManagerPage: InvoiceManagerPage`
   - Declare property on the class with `!`: `invoiceManagerPage!: InvoiceManagerPage`
   - Import the class

3. Instantiate in `hooks.ts` `Before`:
   ```typescript
   this.invoiceManagerPage = new InvoiceManagerPage(this.page);
   ```

4. Declare any new `ScenarioState` fields on `CustomWorld` (e.g., `this.invoiceId`, `this.invoiceName`)

See [pages/TempManagerPage.ts](../../pages/TempManagerPage.ts) as the canonical example.

### 3. Write the Feature File

**File location**: `features/feature/<domain>.feature` (e.g., `features/feature/invoiceManager.feature`)

#### Structure
```gherkin
@smoke @regression
Feature: Invoice Manager - CRUD operations

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  @23455
  Scenario: Create a new invoice with all fields
    When the user create invoice with the following details
      | Field           | Value                    |
      | invoiceNumber   | INV-<RandomNumbers>      |
      | clientName      | Acme Corp                |
      | amount          | 5000.00                  |
      | dueDate         | <Today+30>               |
    Then the user should see invoice with invoiceNumber "INV-*"
    And the user navigate to invoice details page

  @regression
  Scenario Outline: Create invoice for different clients
    When the user create invoice with the following details
      | Field        | Value         |
      | clientName   | <clientName>  |
      | amount       | <amount>      |
      | dueDate      | <dueDate>     |
    Then the user should see invoice created successfully

    Examples:
      | clientName | amount | dueDate     |
      | Client A   | 1000   | <Today+15>  |
      | Client B   | 2500   | <Today+30>  |
```

#### Rules
- **Tags above Scenario line**: At least one tag per scenario (`@smoke`, `@regression`, `@api`, or `@<ticketId>`).
- **Background login**: Every feature uses the parameterized Background login step — **never hardcode credentials or URLs in scenarios**.
- **DataTable over hardcoding**: Use `| Field | Value |` rows instead of inline values; matches the `*Details` interface.
- **Dynamic placeholders in scenario text**: `<Today+N>`, `<Today-N>`, `<RandomEmail>`, `<RandomAlphabets>`, `<RandomNumbers>`, `<this.fieldName>` — resolved in step code.
- **One-to-one step text mapping**: Each step text maps to exactly one step definition. Never duplicate.
- **Scenario Outline for data-driven**: Use `Scenario Outline` + `Examples` for multi-row test data.

### 4. Write the Step Definition File

**File location**: `features/stepDef/<domain>.steps.ts` (e.g., `features/stepDef/invoiceManager.steps.ts`)

#### Access Page Objects
```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../utils/CustomWorld';
import { InvoiceManagerDetails } from '../../pages/InvoiceManagerPage';

Given('the user create invoice with the following details', async function (this: CustomWorld, dataTable: DataTable) {
  const details: Partial<InvoiceManagerDetails> = {};

  // Use .raw().slice(1) to skip the header row; columns are [Field, Value]
  for (const row of dataTable.raw().slice(1)) {
    const field = (row[0] ?? '') as keyof InvoiceManagerDetails;
    let value = row[1] ?? '';

    // Resolve dynamic tokens inline BEFORE passing to page
    if (value === '<RandomEmail>') value = RandomEmail();
    else if (value === '<RandomAlphabets>') value = RandomAlphabets();
    else if (value === '<RandomNumbers>') value = RandomNumbers();
    else if (value === '<RandomString>') value = RandomString();
    else if (value.includes('<Today')) value = ResolveDate(value);

    details[field] = value;
  }

  // Cast to full InvoiceManagerDetails (page merge handles defaults)
  await this.invoiceManagerPage.createInvoice(details as InvoiceManagerDetails);

  // Capture state for later steps
  this.invoiceId = await this.invoiceManagerPage.waitForInvoiceId();
});

Then('the user should see invoice with invoiceNumber {string}', async function (this: CustomWorld, pattern: string) {
  // Use captured state
  const invoiceNumber = await this.invoiceManagerPage.getInvoiceNumber();
  expect(invoiceNumber).toMatch(new RegExp(pattern.replace('*', '.*')));
});
```

#### Dynamic Token Resolution
Resolve **before** passing to the page layer using inline `if/else` checks in the step definition (no shared helper — each step handles its own tokens inline):

```typescript
// In the step definition, iterate DataTable rows with .raw().slice(1) to skip header
for (const row of dataTable.raw().slice(1)) {
  const field = row[0] ?? '';
  let value = row[1] ?? '';

  // Resolve dynamic tokens inline
  if (value === '<RandomEmail>') value = RandomEmail();
  else if (value === '<RandomAlphabets>') value = RandomAlphabets();
  else if (value === '<RandomNumbers>') value = RandomNumbers();
  else if (value === '<RandomString>') value = RandomString();
  else if (value.includes('<Today')) value = ResolveDate(value);
  else if (value.startsWith('<this.')) {
    const fieldName = value.slice(6, -1); // strip <this. and >
    value = String((this as unknown as Record<string, unknown>)[fieldName] ?? '');
  }

  details[field as keyof MyDetails] = value;
}
```

**Dynamic Token Reference**:
| Token | Output | Module |
|-------|--------|--------|
| `<Today>` | `MM/DD/YYYY` | `ResolveDate` |
| `<Today+N>` | Today + N days | `ResolveDate` |
| `<Today-N>` | Today - N days | `ResolveDate` |
| `<RandomEmail>` | user+timestamp@test.com | `RandomEmail` |
| `<RandomAlphabets>` | 10 random letters | `RandomAlphabets` |
| `<RandomNumbers>` | 10 random digits | `RandomNumbers` |
| `<RandomString>` | 10 random alphanumeric | `RandomString` |
| `<this.fieldName>` | Value from CustomWorld | Capture in step code |

All resolvers are in [test-data/ResolveDynamicData.ts](../../test-data/ResolveDynamicData.ts).

### 5. Type-Safe Details

Each domain entity page exports a `*Details` interface and `DEFAULT_*_DETAILS` constant.

```typescript
// In pages/InvoiceManagerPage.ts

export interface InvoiceManagerDetails {
  // Required fields — no defaults
  invoiceNumber: string;
  clientName: string;

  // Optional fields — have defaults
  amount?: number;
  dueDate?: string;
  description?: string;
}

export const DEFAULT_INVOICE_MANAGER_DETAILS: Required<Omit<InvoiceManagerDetails, 'invoiceNumber' | 'clientName'>> = {
  amount: 0,
  dueDate: '',
  description: '',
};

// In step code: merge defaults with DataTable partial
const details: Partial<InvoiceManagerDetails> = { invoiceNumber: 'INV-001', clientName: 'Acme' };
const full = { ...DEFAULT_INVOICE_MANAGER_DETAILS, ...details } as InvoiceManagerDetails;
```

TypeScript error checking ensures: if a new optional field is added to the interface, a default **must** be added to the constant.

### 6. API Testing (If Applicable)

For API actions, update [API_METHOD_MAP](../../features/stepDef/APItest.steps.ts):

```typescript
// In APItest.steps.ts
const API_METHOD_MAP: Record<string, 'GET' | 'POST'> = {
  'getInvoiceList': 'GET',
  'createInvoice': 'POST',
  'deleteInvoice': 'POST',
  // ... existing entries
};
```

Then write the scenario:
```gherkin
Given the user perform 'createInvoice' API call with the following details
  | Field       | Value              |
  | clientName  | <this.clientName>  |
  | amount      | 5000               |
```

Response assertions use field names as returned by the API — extract via `response[0]` (array) or `response.rows[0]` (paginated) or use the object directly.

## Example Feature + Step Definition

See [references/example-invoiceManager.feature](./references/example-invoiceManager.feature) and [references/example-invoiceManager.steps.ts](./references/example-invoiceManager.steps.ts).

## Checklist

- [ ] Searched existing `.feature` and `.steps.ts` files for matching step text
- [ ] New steps are NOT duplicates
- [ ] Feature file in `features/feature/` with no subdirectories
- [ ] Step definition in `features/stepDef/` with matching name
- [ ] All tags (`@smoke`, `@regression`, `@<ticketId>`) present
- [ ] Background login step uses parameterized environment and credential
- [ ] DataTable rows map to `*Details` interface fields
- [ ] Dynamic tokens resolved in step code before passing to page
- [ ] Page class extends `BasePage` and exports `*Details` interface + `DEFAULT_*_DETAILS`
- [ ] `CustomWorld` updated with new page object + any new state fields
- [ ] TypeScript strict mode — all async calls awaited
- [ ] No hardcoded URLs, credentials, or static test data

## Architecture Overview

See [CLAUDE.md](../../CLAUDE.md) for full context on:
- Browser lifecycle and hooks
- Page Object Model structure
- Step definition mapping
- API testing patterns

## Related Documentation

- [copilot-instructions.md](../../.github/copilot-instructions.md) — test framework principles and tags
- [pages/BasePage.ts](../../pages/BasePage.ts) — base class all pages extend
- [utils/CustomWorld.ts](../../utils/CustomWorld.ts) — shared World state and page objects
- [test-data/ResolveDynamicData.ts](../../test-data/ResolveDynamicData.ts) — dynamic token resolvers
