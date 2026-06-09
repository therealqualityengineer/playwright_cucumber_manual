# Step Reuse & Discovery Guide

Find and reuse existing steps before writing new ones. The canonical step registry lives in the [test-generation skill](../../test-generation/SKILL.md) — check its "Step 2 — Reuse existing steps" table first.

## How to Search for Existing Steps

Always search **both** locations:

```bash
# Search feature files and step definitions
grep -r "create" features/feature features/stepDef

# Case-insensitive
grep -ri "report" features/

# Specific keyword
grep -r "the user.*navigate" features/feature features/stepDef
```

## Matching Rules

### Exact Match → Reuse
Use the identical wording:
```gherkin
# GOOD
And the user create a new temp with the following details

# BAD — creates a duplicate with different wording
When the user creates a brand-new temp using
```

### Semantic Match → Generalize Existing Step
Refactor the existing step to accept a parameter instead of creating a new one.

### Partial Match → Extend via DataTable
Add a new field row to the existing DataTable — the page's `fillField` switch handles it, and `DEFAULT_*_DETAILS` provides the fallback. Never write a separate step for a new field value.

## Anti-Patterns

### ❌ Duplicate step text
```gherkin
# Feature 1 — canonical
And the user create a new temp with the following details

# Feature 2 — BAD: different wording, same action
When the user creates a brand-new temp using
```

### ❌ Hardcoding values instead of DataTable
```gherkin
# BAD
When the user creates a temp named "ABCDE" with email "test@gmail.com"

# GOOD
And the user create a new temp with the following details
  | Field         | Value             |
  | First Name    | <RandomAlphabets> |
  | Primary Email | <RandomEmail>     |
```

### ❌ Ignoring dynamic tokens
```typescript
// BAD — hardcoded date
await this.page.fill('#dueDate', '06/04/2026');

// GOOD — resolved inline in DataTable loop
if (value.includes('<Today')) value = ResolveDate(value);
```

### ❌ Re-implementing search popup inline
```typescript
// BAD — manual 6-step popup flow in a step or page method
await this.page.locator('#tfobj_textItem0').click();
await this.page.getByRole('textbox').fill(tempName);
await this.page.getByRole('button', { name: 'Search' }).click();
await this.page.getByRole('listitem').filter({ hasText: tempName }).first().click();
await this.page.getByRole('button', { name: 'Close' }).click();

// GOOD — delegate to BasePage
await this.selectFromSearchPopup(this.tempFilterButton, tempName);
```

## Discovery Checklist

- [ ] Searched `features/feature/**/*.feature` for matching step text
- [ ] Searched `features/stepDef/**/*.steps.ts` for the implementation
- [ ] No exact match exists
- [ ] No semantic overlap exists
- [ ] New step is truly unique to this scenario
