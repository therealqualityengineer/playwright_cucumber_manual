# Page Object Model (POM) Implementation Guide

All page classes extend `BasePage` and follow a strict pattern. See `pages/TempManagerPage.ts` as the canonical reference.

## Structure Template

```typescript
import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface EntityDetails {
  // Required — no defaults
  id: string;
  name: string;
  // Optional — have defaults
  email?: string;
  status?: string;
}

const DEFAULT_ENTITY_DETAILS: Required<Omit<EntityDetails, "id" | "name">> = {
  email: "",
  status: "Active",
};

export class EntityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToCreatePage(): Promise<void> {
    await this.navigateTo("/entity/create");
  }

  async createEntity(details: EntityDetails): Promise<void> {
    const merged = { ...DEFAULT_ENTITY_DETAILS, ...details };
    for (const [field, value] of Object.entries(merged)) {
      if (value) await this.fillField(field, String(value));
    }
    await this.page.getByRole("button", { name: /save/i }).click();
  }

  async waitForEntityId(): Promise<string> {
    await this.page.waitForURL(/\/entity\/\d+/);
    const match = this.page.url().match(/\/entity\/(\d+)/);
    return match?.[1] ?? "";
  }

  private async fillField(fieldName: string, value: string): Promise<void> {
    switch (fieldName) {
      case "id":
        await this.page.getByLabel("ID").fill(value);
        break;
      case "name":
        await this.page.getByLabel("Name").fill(value);
        break;
      case "email":
        await this.page.getByLabel("Email").fill(value);
        break;
      case "status":
        await this.page.getByLabel("Status").selectOption(value);
        break;
      default:
        throw new Error(`Unknown field '${fieldName}' for EntityPage`);
    }
  }
}
```

## Key Principles

1. **Extend BasePage** — provides `this.page` and `navigateTo(path)`
2. **Role-based locators only** — `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`; use `page.locator(css)` only for dynamically-generated IDs (e.g. `#tfobj_textItem0`)
3. **Export interface + defaults** — TypeScript errors if a new optional field has no default
4. **Accept full `*Details` object** — not individual parameters
5. **Private `fillField` switch** — maps DataTable field names → locators; always throws on unknown fields
6. **Wait-for methods** — always await success after form submission

## Search Popup Selection

**Never re-implement the popup flow inline.** All page methods that select an entity via a search popup must delegate to `BasePage.selectFromSearchPopup`:

```typescript
async selectFromSearchPopup(triggerLocator: Locator, searchText: string): Promise<void>
```

This covers the full 6-step flow: open popup → fill search → click Search → pick first result → close → wait hidden.

**Pattern — report/filter page:**

```typescript
private readonly tempFilterButton = this.page.locator('#tfobj_textItem0');
private readonly clientFilterButton = this.page.locator('#cfobj_textItem0');

async generateReport(filters: ReportFilters): Promise<string> {
  if (filters.tempName) {
    await this.selectFromSearchPopup(this.tempFilterButton, filters.tempName);
  }
  if (filters.clientName) {
    await this.selectFromSearchPopup(this.clientFilterButton, filters.clientName);
  }
  // ... download logic
}
```

**Pattern — facilities/filter tab:**

```typescript
async applyFacilitiesFilters(filters: Record<string, string>) {
  for (const [field, value] of Object.entries(filters)) {
    if (field === 'ClientName') {
      await this.selectFromSearchPopup(this.selectClientsItem, value);
    }
  }
}
```

Trigger locators are CSS-ID buttons (`#tfobj_textItem0`, `#cfobj_textItem0`) or `getByText` locators. Any `@ts-nocheck`-free page class that selects from a popup must use this pattern — no exceptions.

## Common Mistakes

### ❌ Hardcoding values in page class

```typescript
// BAD
async createDefaultEntity(): Promise<void> {
  await this.page.getByLabel('Name').fill('Default Entity');
}
// GOOD: accept details as parameter
```

### ❌ Not throwing on unknown fields

```typescript
// BAD — silently ignores typos
private async fillField(field: string, value: string) {
  if (field === 'id') { ... }
  // no default case
}
// GOOD: always add default: throw new Error(`Unknown field '${field}'`)
```

### ❌ CSS selectors over role locators

```typescript
// BAD
await this.page.locator(".submit-button").click();
// GOOD
await this.page.getByRole("button", { name: /submit/i }).click();
```
