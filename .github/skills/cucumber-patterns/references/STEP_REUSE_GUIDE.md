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
grep -ri "invoice" features/
```

#### Option 2: VS Code Find
1. Press `Ctrl+Shift+F` to open global Find
2. Use glob pattern: `features/**/*.feature,features/**/*.steps.ts`
3. Search term: e.g., `create invoice`

### Canonical Steps (Already Exist)

These steps are **already implemented** across the project. Always reuse:

| Step Text | Location | When to Use |
|-----------|----------|------------|
| `Given the user login to the application '...' with '...' credentials` | All Background sections | Every feature file — parameterizes env + credentials |
| `When the user create <entity> with the following details` | tempManager, clientManager steps | Creating any domain entity via form |
| `Then the user should see <entity> created successfully` | Multiple features | Confirmation after creation |
| `And the user navigate to <entity> details page` | Multiple features | Navigate to detail view after creation |
| `Given the user perform '...' API call with the following details` | APItest.steps.ts | API-level testing with DataTable params |
| `Then the API response should contain` | APItest.steps.ts | Assert API response fields |

## Matching Rules

### Exact Match → Reuse
If your step text is **identical** to an existing step, use the same wording:
```gherkin
# GOOD: Reuses existing "create invoice" step
When the user create invoice with the following details
  | invoiceNumber | INV-001 |

# BAD: Creates a duplicate step with different wording
When the user creates a new invoice using
  | invoiceNumber | INV-001 |
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
  const pageMap = {
    'temporary': this.tempManagerPage,
    'contractor': this.contractorPage,
  };
  const page = pageMap[entityType];
  if (!page) throw new Error(`Unknown entity type: ${entityType}`);
  // ... shared logic
});

// Now both features use the same step:
When the user create temporary with the following details
When the user create contractor with the following details
```

### Partial Match → Extend, Don't Duplicate
If an existing step is 90% what you need, extend it instead of creating a new one:

**Existing:**
```typescript
When('the user create temp with the following details', ...);
```

**New requirement**: Create a temp with a default status
- **BAD**: Write a separate `When the user create temp with status ...`
- **GOOD**: Make the existing step accept an optional `status` field in the DataTable; add it to `TempDetails` with a default

## Anti-Pattern Examples

### ❌ Creating Duplicate Steps

**Feature 1:**
```gherkin
When the user create invoice with the following details
  | invoiceNumber | INV-001 |
```

**Feature 2 (BAD):**
```gherkin
When the user creates a new invoice with these details
  | invoiceNumber | INV-001 |
```

→ This creates two step definitions that do the same thing. **WRONG!** Refactor to use identical wording.

### ❌ Hardcoding Values Instead of Using DataTable

**BAD:**
```gherkin
When the user create invoice number "INV-001" with amount 5000
```

**GOOD:**
```gherkin
When the user create invoice with the following details
  | invoiceNumber | INV-001 |
  | amount        | 5000    |
```

**Why**: The second approach is data-driven, reusable across scenarios, and maps cleanly to TypeScript interfaces.

### ❌ Ignoring Dynamic Tokens

**BAD:**
```typescript
// Hardcoded date in step definition
await this.page.fill('dueDate', '06/04/2026');
```

**GOOD:**
```typescript
// Resolve in step definition
const dueDate = await resolveDynamicValue(this, '<Today+30>');
await this.page.fill('dueDate', dueDate);
```

**Why**: Tests become date-independent, reusable, and maintainable.

## Step Definition Naming Convention

When you write a new step definition, follow the **step text to method name** mapping:

| Step Text | Step Definition (TypeScript) |
|-----------|------------------------------|
| `Given the user login to the application` | `Given('the user login to the application', async ...)` |
| `When the user create invoice with the following details` | `When('the user create invoice with the following details', async ...)` |
| `Then the invoice number should match {string}` | `Then('the invoice number should match {string}', async (pattern: string) ...)` |
| `And the invoice status should be {string}` | `Then('the invoice status should be {string}', async (status: string) ...)` |

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
