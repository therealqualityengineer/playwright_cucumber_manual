---
description: Rules for creating or modifying page object classes in pages/. Apply when adding locators, implementing page methods, or creating a new *Page.ts file.
globs: pages/**/*.ts
alwaysApply: false
---

# Page Object Rules

For the full POM implementation template, invoke `/cucumber-patterns` and see `references/POM_IMPLEMENTATION.md`.

## Extending BasePage

Every page class must extend `BasePage` from `pages/BasePage.ts`:

```typescript
export class MyEntityPage extends BasePage {
  constructor(page: Page) { super(page); }
}
```

## Details Interface Pattern

Each page class exports a typed interface + defaults constant:

```typescript
export interface MyEntityDetails {
  name: string;          // Required — no default
  status?: string;       // Optional — has default
}

const DEFAULT_MY_ENTITY_DETAILS: Required<Omit<MyEntityDetails, 'name'>> = {
  status: 'Active',
};
```

Merge DataTable input with defaults inside the page method — never in the step definition.

## fillField Switch

Map DataTable field names → locators using a `switch` statement. Throw on unknown field names to catch typos early:

```typescript
private async fillField(field: string, value: string): Promise<void> {
  switch (field) {
    case 'Name': await this.nameInput.fill(value); break;
    case 'Status': await this.statusDropdown.selectOption(value); break;
    default: throw new Error(`Unknown field: ${field}`);
  }
}
```

## Search Popup Selection

**Never re-implement the popup flow inline.** Always delegate to `BasePage.selectFromSearchPopup`:

```typescript
async selectFromSearchPopup(triggerLocator: Locator, searchText: string): Promise<void>
```

This handles: open popup → fill search → click Search → pick first result → close → wait hidden.

```typescript
// In your page method:
if (filters.clientName) {
  await this.selectFromSearchPopup(this.clientFilterButton, filters.clientName);
}
```

Trigger locators are CSS-ID buttons (e.g., `#cfobj_textItem0`) or `getByText` locators.

## Registering a New Page

When creating a new `*Page.ts`:

1. Add to `PageObjects` interface in `utils/CustomWorld.ts`.
2. Add the class field to `CustomWorld` body.
3. Import the class in `CustomWorld.ts`.
4. Instantiate it in the `Before` hook in `hooks/hooks.ts`:
   ```typescript
   this.myEntityPage = new MyEntityPage(this.page);
   ```

## Locator Guidelines

- Prefer `getByRole`, `getByLabel`, `getByPlaceholder` over raw CSS selectors for stability.
- CSS ID selectors (`#someId`) are acceptable for search popup trigger buttons where IDs are stable.
- Declare all locators as `private readonly` class fields — no ad-hoc locators inside methods.
