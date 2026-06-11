---
name: cucumber-patterns
description: "Author Cucumber feature files and step definitions for Playwright+Cucumber framework. Use when: creating or editing .feature or .steps.ts files; implementing new test scenarios; integrating new UI pages or API actions. Ensures step reuse, proper type safety, dynamic date handling, and POM compliance."
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

2. **One file pair per domain entity**: Each domain (e.g., `tempManager`, `clientManager`) has exactly one `.feature` file and one `.steps.ts` file. No subdirectories in `features/feature/` or `features/stepDef/`.

3. **Type-safe DataTables**: All scenario data flows through typed `*Details` interfaces. Omit DataTable rows for fields with defaults — the page class merges `DEFAULT_*_DETAILS` with the partial DataTable.

4. **Dynamic tokens are resolved in step code**: Placeholders like `<Today+2>`, `<RandomEmail>` are replaced **in the step definition**, never hardcoded in scenario text or page classes.

5. **Credentials and URLs come from config**: Never hardcode usernames, passwords, or environment URLs. Use the parameterized Background login step.

## Step-by-Step Procedure

### 1. Check for Existing Steps

**Before writing a single step**, search the project:

```bash
grep -r "the user.*login\|the user.*create\|the user.*navigate" features/feature features/stepDef
```

If an exact or semantically matching step exists, **reuse it**. See [references/STEP_REUSE_GUIDE.md](./references/STEP_REUSE_GUIDE.md) for the canonical step registry, matching rules, and anti-patterns.

### 2. Define or Extend the Page Class

#### Search Popup Selection (`BasePage.selectFromSearchPopup`)

Any page method that selects an entity via a search popup **must** delegate to `BasePage.selectFromSearchPopup` — never inline the popup flow. See [references/POM_IMPLEMENTATION.md](./references/POM_IMPLEMENTATION.md#search-popup-selection) for the full pattern and code examples.

---

If implementing a **new domain entity** (e.g., `InvoiceManager`):

1. Create `pages/InvoiceManagerPage.ts` extending `BasePage` with:
   - A `InvoiceManagerDetails` interface (required identity fields + optional defaultable fields)
   - A `DEFAULT_INVOICE_MANAGER_DETAILS` constant covering all optional fields
   - A private `fillField(field, value)` that maps DataTable field names → locators via `switch`; throw if unknown
   - Public methods: `navigateTo*`, `create*`, `waitFor*Id`

2. Add to `CustomWorld.ts`:
   - `invoiceManagerPage: InvoiceManagerPage` on the `PageObjects` interface
   - `invoiceManagerPage!: InvoiceManagerPage` on the class body
   - Import the class

3. Instantiate in `hooks.ts` `Before`:

   ```typescript
   this.invoiceManagerPage = new InvoiceManagerPage(this.page);
   ```

4. Declare any new `ScenarioState` fields on `CustomWorld` (e.g., `this.invoiceId`)

See [references/POM_IMPLEMENTATION.md](./references/POM_IMPLEMENTATION.md) for the full template and common mistakes. See `pages/TempManagerPage.ts` as the canonical example.

### 3. Write the Feature File

**File location**: `features/feature/<domain>.feature`

```gherkin
@smoke @regression
Feature: Invoice Manager - CRUD operations

  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials

  @23455
  Scenario: Create a new invoice with all fields
    When the user create invoice with the following details
      | Field         | Value               |
      | invoiceNumber | INV-<RandomNumbers> |
      | clientName    | Acme Corp           |
      | amount        | 5000.00             |
      | dueDate       | <Today+30>          |
    Then the user should see invoice created successfully
```

**Rules:**

- Tags on the `Scenario:` line: at least `@regression` or `@smoke` plus an optional `@<ticketId>`.
- Steps after Background use `And` (not `Given`/`When`) — match the existing style in the project.
- Dynamic tokens: `<RandomAlphabets>`, `<RandomEmail>`, `<RandomNumbers>`, `<Today+N>`, `<this.fieldName>` — resolved in step code.
- Use `Scenario Outline` + `Examples` only for data-driven multi-row cases.

### 4. Write the Step Definition File

**File location**: `features/stepDef/<domain>.steps.ts`

```typescript
import { Given, When, Then } from "@cucumber/cucumber";
import { CustomWorld } from "../../utils/CustomWorld";
import { resolvePlaceholder } from "../../utils/resolvePlaceholder";
import { InvoiceManagerDetails } from "../../pages/InvoiceManagerPage";

Given(
  "the user create invoice with the following details",
  async function (this: CustomWorld, dataTable: DataTable) {
    const details: Partial<InvoiceManagerDetails> = {};

    for (const row of dataTable.raw().slice(1)) {
      const field = (row[0] ?? "") as keyof InvoiceManagerDetails;
      details[field] = resolvePlaceholder(row[1] ?? "", this);
    }

    await this.invoiceManagerPage.createInvoice(
      details as InvoiceManagerDetails,
    );
    this.invoiceId = await this.invoiceManagerPage.waitForInvoiceId();
  },
);
```

**Key rules:**

- `dataTable.raw().slice(1)` — skip header row.
- Resolve all tokens with `resolvePlaceholder(row[1] ?? '', this)` — handles `<Random*>`, `<Today[±N]>`, and `<this.*>`. Never re-implement inline chains.
- All `async` calls must be awaited — `@typescript-eslint/no-floating-promises` is enforced.
- No `@ts-nocheck`.

For the full token reference table, see [test-generation skill](../test-generation/SKILL.md).

### 5. Type-Safe Details

```typescript
// In pages/InvoiceManagerPage.ts
export interface InvoiceManagerDetails {
  invoiceNumber: string; // Required
  clientName: string; // Required
  amount?: number; // Optional — has default
  dueDate?: string; // Optional — has default
}

const DEFAULT_INVOICE_MANAGER_DETAILS: Required<
  Omit<InvoiceManagerDetails, "invoiceNumber" | "clientName">
> = {
  amount: 0,
  dueDate: "",
};
```

TypeScript errors if a new optional field is added without a corresponding default.

### 6. API Testing

For API actions, use the `/api-test` skill. Register new actions in `API_METHOD_MAP` in `features/stepDef/APItest.steps.ts` and write scenarios using the generic `Given the user perform '...' API call` step.

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
- [ ] Any search popup uses `BasePage.selectFromSearchPopup` — no inline open/search/pick/close block
