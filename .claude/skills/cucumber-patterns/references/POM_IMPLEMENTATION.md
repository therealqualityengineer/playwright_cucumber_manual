# Page Object Model (POM) Implementation Guide

All page classes extend `BasePage` and follow a strict pattern. This document shows how to correctly implement a new page class.

## Overview

Each domain entity (e.g., `tempManager`, `clientManager`, `invoiceManager`) has:

1. **Page class** (`pages/XxxPage.ts`) — extends `BasePage`
2. **Interface** (`XxxDetails`) — typed entity fields
3. **Default constants** (`DEFAULT_XXX_DETAILS`) — default values for optional fields
4. **Private `fillField` method** — maps DataTable field names → locators

## Structure Template

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Interface for entity details.
 * - Required fields: no defaults
 * - Optional fields: have defaults in DEFAULT_ENTITY_DETAILS
 */
export interface EntityDetails {
  // REQUIRED — no defaults
  id: string;
  name: string;

  // OPTIONAL — defaults below
  email?: string;
  phone?: string;
  status?: string;
}

/**
 * Default values for optional fields.
 * TypeScript ensures: if a new optional field is added to EntityDetails,
 * a corresponding default MUST be added here or TypeScript errors.
 */
export const DEFAULT_ENTITY_DETAILS: Required<Omit<EntityDetails, 'id' | 'name'>> = {
  email: '',
  phone: '',
  status: 'Active',
};

/**
 * Page Object for Entity domain.
 * All interactions go through public methods that accept EntityDetails,
 * not individual field values.
 */
export class EntityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to entity creation or edit page.
   * Assumes you're already on the app (e.g., logged in).
   */
  async navigateToCreatePage(): Promise<void> {
    await this.navigateTo('/entity/create');
    await this.page.getByRole('heading', { name: /create/i }).isVisible();
  }

  /**
   * Create an entity with details.
   * Merges defaults with provided details.
   * Returns the entity ID (captured from success page or response).
   */
  async createEntity(details: EntityDetails): Promise<string> {
    const merged = { ...DEFAULT_ENTITY_DETAILS, ...details } as EntityDetails;
    await this.fillField('id', merged.id);
    await this.fillField('name', merged.name);
    if (merged.email) await this.fillField('email', merged.email);
    if (merged.phone) await this.fillField('phone', merged.phone);
    if (merged.status) await this.fillField('status', merged.status);

    await this.page.getByRole('button', { name: /create/i }).click();
    return await this.waitForEntityId();
  }

  /**
   * Wait for entity ID to be visible/available after creation.
   * Called after form submission; returns the newly created ID.
   */
  async waitForEntityId(): Promise<string> {
    // Method 1: Wait for success notification with ID
    const successMsg = await this.page.locator('[role="alert"]').textContent();
    const match = successMsg?.match(/Entity (\d+) created/);
    if (match) return match[1];

    // Method 2: Wait for redirect to detail page, extract ID from URL
    await this.page.waitForURL(/\/entity\/\d+/);
    const url = this.page.url();
    const match2 = url.match(/\/entity\/(\d+)/);
    return match2 ? match2[1] : '';
  }

  /**
   * Get entity details from the current detail page.
   */
  async getEntityDetails(): Promise<EntityDetails> {
    return {
      id: await this.page.getByLabel('ID').inputValue(),
      name: await this.page.getByLabel('Name').inputValue(),
      email: await this.page.getByLabel('Email').inputValue(),
      phone: await this.page.getByLabel('Phone').inputValue(),
      status: await this.page.getByLabel('Status').inputValue(),
    };
  }

  /**
   * Get a single detail field value.
   * Used in assertions.
   */
  async getDetailValue(field: keyof EntityDetails): Promise<string> {
    const fieldMap: Record<keyof EntityDetails, string> = {
      id: 'ID',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      status: 'Status',
    };
    const label = fieldMap[field];
    return await this.page.getByLabel(label).inputValue();
  }

  /**
   * PRIVATE: Map DataTable field names to locators and fill.
   * Throws if field name is unknown.
   * Called by public methods; never called from steps directly.
   */
  private async fillField(fieldName: string, value: string): Promise<void> {
    switch (fieldName) {
      case 'id':
        await this.page.getByLabel('ID').fill(value);
        break;
      case 'name':
        await this.page.getByLabel('Name').fill(value);
        break;
      case 'email':
        await this.page.getByLabel('Email').fill(value);
        break;
      case 'phone':
        await this.page.getByLabel('Phone').fill(value);
        break;
      case 'status':
        await this.page.getByLabel('Status').selectOption(value);
        break;
      default:
        throw new Error(`Unknown field '${fieldName}' for EntityPage. Allowed: ${Object.keys(fieldMap).join(', ')}`);
    }
  }
}
```

## Key Principles

### 1. Extend BasePage
```typescript
export class EntityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
}
```

`BasePage` provides:
- `this.page` — the Playwright Page object
- `navigateTo(path)` — derives origin from current URL and appends path

### 2. Use Role-Based Locators Only
```typescript
// ✅ GOOD: Role-based
await this.page.getByRole('button', { name: /save/i }).click();
await this.page.getByLabel('Email').fill('user@example.com');
await this.page.getByPlaceholder('Enter name').fill('John');

// ❌ BAD: CSS selectors or XPath
await this.page.locator('#submitBtn').click();
await this.page.locator('//input[@name="email"]').fill('user@example.com');
```

**Why**: Role-based locators are:
- Resilient to UI changes (IDs/classes change, roles don't)
- Accessible-first (tests what users actually interact with)
- Self-documenting

### 3. Export Entity Interface + Defaults
```typescript
export interface EntityDetails {
  id: string;           // Required
  name: string;         // Required
  email?: string;       // Optional
  status?: string;      // Optional
}

export const DEFAULT_ENTITY_DETAILS: Required<Omit<EntityDetails, 'id' | 'name'>> = {
  email: '',
  status: 'Active',
};
```

**TypeScript ensures**: If you add a new optional field to the interface, you **must** add a default to the constant, or TypeScript will error. This prevents accidental undefined values.

### 4. Accept Full Details, Not Individual Fields
```typescript
// ✅ GOOD: Public method accepts full EntityDetails
async createEntity(details: EntityDetails): Promise<string> { ... }

// ❌ BAD: Multiple parameters
async createEntity(id: string, name: string, email?: string) { ... }

// ❌ BAD: Arbitrary parameters
async createEntity(args: any) { ... }
```

**Why**: One method signature, type-safe, maps cleanly to DataTable.

### 5. Private fillField Method
```typescript
private async fillField(fieldName: string, value: string): Promise<void> {
  switch (fieldName) {
    case 'id':
      await this.page.getByLabel('ID').fill(value);
      break;
    case 'name':
      await this.page.getByLabel('Name').fill(value);
      break;
    // ... more cases
    default:
      throw new Error(`Unknown field '${fieldName}'`);
  }
}
```

**Purpose**:
- Maps DataTable field names → page locators
- Throws on unknown fields (catches typos in scenarios)
- Encapsulates locators (if HTML changes, only update here)
- Called only by public methods in the same class

### 6. Wait-For Methods
After an action, always wait for the expected outcome:

```typescript
async createEntity(details: EntityDetails): Promise<string> {
  // ... fill fields and submit
  await this.page.getByRole('button', { name: /create/i }).click();
  return await this.waitForEntityId(); // Wait for success, capture ID
}

async waitForEntityId(): Promise<string> {
  // Wait for redirect or success message
  await this.page.waitForURL(/\/entity\/\d+/);
  const url = this.page.url();
  const match = url.match(/\/entity\/(\d+)/);
  return match ? match[1] : '';
}
```

## Integration with CustomWorld

1. **Add page class property to `PageObjects` interface** in `utils/CustomWorld.ts`:
   ```typescript
   export interface PageObjects {
     // ... existing pages
     entityPage: EntityPage;
   }
   ```

2. **Declare on CustomWorld class**:
   ```typescript
   export class CustomWorld extends World implements PageObjects, ScenarioState {
     // ... existing declarations
     entityPage!: EntityPage; // Non-null assertion (instantiated in Before hook)
   }
   ```

3. **Import the class**:
   ```typescript
   import { EntityPage } from '../pages/EntityPage';
   ```

4. **Instantiate in `hooks.ts` Before hook**:
   ```typescript
   Before(async function (this: CustomWorld) {
     // ... browser/page setup
     this.entityPage = new EntityPage(this.page);
   });
   ```

5. **Add new scenario state fields to `ScenarioState` interface**:
   ```typescript
   export interface ScenarioState {
     // ... existing fields
     entityId?: string;
     entityName?: string;
   }
   ```

6. **Capture state in step definition**:
   ```typescript
   const entityId = await this.entityPage.createEntity(details);
   this.entityId = entityId; // Store for later steps
   ```

## Example: TempManagerPage

See `pages/TempManagerPage.ts` as the canonical reference implementation.

Key features:
- Exports `TempDetails` interface with required + optional fields
- Exports `DEFAULT_TEMP_DETAILS` with defaults for all optional fields
- Private `fillField` switch maps DataTable field names → locators
- Public methods: `navigateTo*`, `create*`, `waitFor*Id`, detail getters
- Uses only role-based locators

## Common Mistakes

### ❌ Mistake 1: Hardcoding field values in page class

```typescript
// BAD: Values hardcoded
async createDefaultEntity(): Promise<void> {
  await this.page.getByLabel('Name').fill('Default Entity');
  await this.page.getByLabel('Email').fill('default@test.com');
}
```

**Fix**: Accept details as parameters, let the step or test decide values.

### ❌ Mistake 2: Mixing optional and required in constructor

```typescript
// BAD: Optional fields passed to constructor
constructor(page: Page, defaultName?: string) { ... }
```

**Fix**: Keep constructor simple, accept details in method calls.

### ❌ Mistake 3: Not throwing on unknown fields

```typescript
// BAD: Silently ignores unknown fields
private async fillField(fieldName: string, value: string): Promise<void> {
  if (fieldName === 'id') { ... }
  // No else/default case — typos go unnoticed!
}
```

**Fix**: Always throw on unknown fields.

### ❌ Mistake 4: CSS selectors instead of role locators

```typescript
// BAD: Breaks if HTML class changes
await this.page.locator('.submit-button').click();

// GOOD: Resilient to HTML changes
await this.page.getByRole('button', { name: /submit/i }).click();
```

## Testing Your Page Class

Create a simple test to verify the page works:

```typescript
import { test, expect } from '@playwright/test';
import { EntityPage } from './EntityPage';

test('EntityPage.createEntity', async ({ page }) => {
  const entityPage = new EntityPage(page);
  await page.goto('http://localhost:3000/entity/create');

  const entityId = await entityPage.createEntity({
    id: 'ENT-001',
    name: 'Test Entity',
    email: 'test@example.com',
  });

  expect(entityId).toBeTruthy();
  expect(page.url()).toContain(`/entity/${entityId}`);
});
```

Run: `npx playwright test --grep EntityPage`
