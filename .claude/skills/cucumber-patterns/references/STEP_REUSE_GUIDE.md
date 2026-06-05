# Step Reuse & Discovery Guide

This document explains how to find and reuse existing steps, avoiding duplication.

## Why Reuse Matters

- **Single source of truth**: If step logic changes, update one place, not five
- **Easier maintenance**: New collaborators can find and understand the canonical step
- **Reliable scenarios**: Same step behaves the same way across all features
- **Type safety**: Reused steps share the same TypeScript signature and page method

## How to Search for Existing Steps

### Search Scope

Always search **both** locations:
1. **Feature files**: `features/feature/**/*.feature` — the step *text*
2. **Step definitions**: `features/stepDef/**/*.steps.ts` — the implementation

### Search Strategy

#### Option 1: Grep (Command Line)
```bash
# Search for step containing "create"
grep -r "create" features/feature features/stepDef

# Search feature files only
grep -r "create" features/feature

# Case-insensitive search
grep -ri "report" features/
```

#### Option 2: VS Code Find
1. Press `Ctrl+Shift+F` to open global Find
2. Use glob pattern: `features/**/*.feature,features/**/*.steps.ts`
3. Search term: e.g., `create temp`

### Canonical Steps (Already Exist)

These steps are **already implemented**. Always reuse the exact text.

#### Core Entity Steps

| Step Text | Location | Captures |
|-----------|----------|---------|
| `Given the user login to the application {string} with {string} credentials` | login.steps.ts | — |
| `And the user create a new temp with the following details` | tempManager.steps.ts | `this.tempFirstName`, `this.tempEmail` |
| `Then the temp id should be generated successfully in the url` | tempManager.steps.ts | `this.tempId` |
| `And the user create a new client with the following details` | clientManager.steps.ts | `this.clientName` |
| `Then the client id should be generated successfully in the url` | clientManager.steps.ts | `this.clientId` |
| `And the user create a new order with the following details` | orderManager.steps.ts | — |
| `Then the order id should be generated successfully` | orderManager.steps.ts | `this.orderId` |

#### Temp-Specific Steps

| Step Text | Location | Notes |
|-----------|----------|-------|
| `And the user added the Flat pay of {string} and {string} to Pay and Bill amounts` | tempManager.steps.ts | Uses `this.tempId` |
| `Then the user verifies Flat Pay enabled` | tempManager.steps.ts | Asserts flat pay cell |
| `When the user opens the {string} profile page` | tempManager.steps.ts | Supports `'temp'` |
| `And the user opens the {string} tab and applies the following filters` | tempManager.steps.ts | Supports `'Facilities'` tab + DataTable |
| `And the user sets the following status on the Facilities page` | tempManager.steps.ts | Fields: Oriented/Check, Preferred/Select |
| `Then the user verifies the {string} message` | tempManager.steps.ts | Checks visible message text |
| `Then the user verifies that the following status is set on the {string} page` | tempManager.steps.ts | Fields: Oriented→Checked, Preferred→Selected |

#### Report Steps

| Step Text | Location | Captures |
|-----------|----------|---------|
| `And the user navigate to the {string} section` | reportManager.steps.ts | — (e.g., `'Report Manager'`) |
| `Then the user generate the {string} report with the following details` | reportManager.steps.ts | `this.downloadedReportName` |
| `Then the report should be downloaded successfully and report name start with {string}` | reportManager.steps.ts | — |
| `Then the user open the downloaded report and verify the temp details in the report with the following details` | reportManager.steps.ts | Reads downloaded file, asserts content |

#### API Steps

| Step Text | Location | Notes |
|-----------|----------|-------|
| `Given the user perform {string} API call with the following details` | APItest.steps.ts | `action` auto-injected; params via DataTable |
| `Then the API response should contain the following details` | APItest.steps.ts | Checks `record[key] == expected` |

**Registered API actions in `API_METHOD_MAP`:**
- `getTemps` → GET
- `getClients` → GET

## Matching Rules

### Exact Match → Reuse
If your step text is **identical** to an existing step, use the same wording:
```gherkin
# GOOD: Reuses existing "create temp" step
And the user create a new temp with the following details
  | Field         | Value             |
  | First Name    | <RandomAlphabets> |
  | Last Name     | <RandomAlphabets> |
  | Primary Email | <RandomEmail>     |

# BAD: Creates a duplicate step with different wording
When the user creates a new temporary worker with these details
```

### Semantic Match → Generalize Existing Step
If two steps do the same thing but use different wording, refactor the step definition to **accept parameters** and make the step text generic:

**Old (two separate steps):**
```typescript
When('the user create temporary employee with the following details', ...);
When('the user create contractor with the following details', ...);
```

**New (one parameterized step):**
```typescript
When('the user create {word} with the following details', async function (entityType: string, dataTable: DataTable) {
  const pageMap: Record<string, unknown> = {
    'temporary': this.tempManagerPage,
    'contractor': this.contractorPage,
  };
  // ... shared logic
});
```

### Partial Match → Extend, Don't Duplicate
If an existing step is 90% what you need, extend it instead of creating a new one:

**Existing:**
```typescript
Given('the user create a new temp with the following details', ...);
```

**New requirement**: Create a temp with a non-default Specialty.
- **BAD**: Write a separate step for it.
- **GOOD**: Add `Specialty` as a row in the DataTable — the page's `fillField` switch already handles it, and `DEFAULT_TEMP_DETAILS` provides the fallback.

## Anti-Pattern Examples

### ❌ Creating Duplicate Steps

**Feature 1:**
```gherkin
And the user create a new temp with the following details
  | Field      | Value             |
  | First Name | <RandomAlphabets> |
```

**Feature 2 (BAD):**
```gherkin
When the user creates a brand-new temp using
  | Field      | Value             |
  | First Name | <RandomAlphabets> |
```

→ This creates two step definitions that do the same thing. **WRONG!** Reuse the canonical wording.

### ❌ Hardcoding Values Instead of Using DataTable

**BAD:**
```gherkin
When the user creates a temp named "ABCDE" with email "test@gmail.com"
```

**GOOD:**
```gherkin
And the user create a new temp with the following details
  | Field         | Value             |
  | First Name    | <RandomAlphabets> |
  | Primary Email | <RandomEmail>     |
```

**Why**: DataTable approach is data-driven, reusable across scenarios, maps cleanly to TypeScript interfaces, and tokens ensure unique values per run.

### ❌ Ignoring Dynamic Tokens

**BAD:**
```typescript
// Hardcoded date in step definition
await this.page.fill('#dueDate', '06/04/2026');
```

**GOOD:**
```typescript
// Resolve inline in the DataTable loop — no shared helper, just if/else
for (const row of dataTable.raw().slice(1)) {
    const field = row[0] ?? '';
    let value = row[1] ?? '';

    if (value.includes('<Today')) {
        value = ResolveDate(value);   // resolves <Today>, <Today+N>, <Today-N>
    } else if (value === '<RandomAlphabets>') {
        value = RandomAlphabets();
    } else if (value === '<this.clientName>') {
        value = this.clientName ?? '';
    }
    details[field as keyof MyDetails] = value;
}
```

### ❌ Re-implementing search popup inline

**BAD:**
```typescript
// DON'T manually open/search/pick/close in a step
await this.page.locator('#tfobj_textItem0').click();
await this.page.getByRole('textbox', { name: 'Search for' }).fill(tempName);
await this.page.getByRole('button', { name: 'Search' }).click();
await this.page.getByRole('listitem').filter({ hasText: tempName }).first().click();
await this.page.getByRole('button', { name: 'Close' }).click();
```

**GOOD:**
```typescript
// In the page class, delegate to BasePage:
await this.selectFromSearchPopup(this.tempFilterButton, tempName);
```

**Why**: `BasePage.selectFromSearchPopup` is the single shared implementation. Changes apply everywhere.

## Step Definition Naming Convention

When you write a new step definition, follow the **step text to method name** mapping:

| Step Text | Step Definition (TypeScript) |
|-----------|------------------------------|
| `Given the user login to the application` | `Given('the user login to the application...', async ...)` |
| `And the user create a new temp with the following details` | `Given('the user create a new temp with the following details', async ...)` |
| `Then the temp id should be generated successfully in the url` | `Then('the temp id should be generated successfully in the url', async ...)` |

**Parameterized steps** use `{word}`, `{string}`, `{int}`, `{float}` placeholders:
- `{word}` → single alphanumeric word (no spaces)
- `{string}` → quoted string with spaces allowed
- `{int}` → integer
- `{float}` → decimal number

## Before Writing: Discovery Checklist

- [ ] I searched `features/feature/**/*.feature` for matching step text
- [ ] I searched `features/stepDef/**/*.steps.ts` for the implementation
- [ ] No exact match exists
- [ ] No semantic overlap exists
- [ ] New step is truly unique to this scenario

If any checkbox fails, **reuse the existing step** or generalize it instead of creating a duplicate.
