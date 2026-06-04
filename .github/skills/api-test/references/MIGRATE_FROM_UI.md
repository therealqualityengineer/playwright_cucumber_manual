# Migrating from UI Assertions to API Assertions

This guide shows how to convert UI-based assertions to faster, more reliable API assertions.

## Why Migrate to API Assertions?

| Aspect | UI Assertion | API Assertion |
|--------|--------------|---------------|
| **Speed** | 500ms–2s per element | <50ms API call |
| **Reliability** | Flaky (DOM timing, rendering) | Stable (no DOM dependencies) |
| **Maintenance** | Breaks if UI changes | Unaffected by UI changes |
| **Clarity** | Read page content | Query backend state directly |
| **Data Access** | Limited to visible fields | Access all fields returned by API |

## Migration Patterns

### Pattern 1: Simple Field Verification

#### Before (UI-based)

```gherkin
Scenario: Create invoice and verify amount
  When the user create invoice with the following details
    | Field  | Value |
    | amount | 5000  |
  Then the user should see invoice created successfully
  And the invoice amount on the page should be "5000"     # ← UI-based
```

Step definition:
```typescript
Then('the invoice amount on the page should be {string}', async function (this: CustomWorld, expected: string) {
  // Navigate to detail page, wait for load, read from UI
  const amount = await this.invoiceManagerPage.getAmountFromUI();
  expect(amount).toBe(expected);
});
```

**Problems**:
- Depends on page navigation (adds time)
- UI element might not render immediately (flaky)
- Only works if amount is displayed on the page

#### After (API-based)

```gherkin
Scenario: Create invoice and verify amount
  When the user create invoice with the following details
    | Field  | Value |
    | amount | 5000  |
  Then the user should see invoice created successfully

  # Verify backend state directly via API
  Given the user perform 'getInvoiceDetails' API call with the following details
    | Key       | Value           |
    | invoiceId | <this.invoiceId> |
  Then the API response should contain the following details
    | Key    | Value |
    | amount | 5000  |
```

**Benefits**:
- No page navigation needed
- Immediate API response (no rendering waits)
- Verifies backend state, not just UI display

### Pattern 2: State Change Verification

#### Before (UI-based)

```gherkin
Scenario: Update invoice status and verify
  When the user update invoice status to "Active"
  Then the user should wait for the notification
  And the page should display status "Active"  # ← UI-based, flaky
```

Step definition:
```typescript
Then('the page should display status {string}', async function (this: CustomWorld, expected: string) {
  // Wait for element, with timeout
  await this.page.getByText(expected).waitFor({ timeout: 5000 });
  const status = await this.page.locator('[data-testid="status"]').textContent();
  expect(status).toBe(expected);
});
```

**Problems**:
- Waits for DOM element (slow, flaky)
- UI might display "Updating..." between states
- Timeout failures are hard to diagnose

#### After (API-based)

```gherkin
Scenario: Update invoice status and verify
  When the user update invoice status to "Active"
  Then the user should wait for the notification

  # Verify backend state immediately
  Given the user perform 'getInvoiceDetails' API call with the following details
    | Key       | Value           |
    | invoiceId | <this.invoiceId> |
  Then the API response should contain the following details
    | Key    | Value  |
    | status | Active |
```

**Benefits**:
- No DOM waits
- API confirms backend persisted the change
- Clear, immediate result

### Pattern 3: List/Count Verification

#### Before (UI-based)

```gherkin
Scenario: Create multiple invoices and verify list
  When the user create 3 invoices
  And the user navigate to invoice list page
  Then the page should display 3 invoices  # ← UI-based
```

Step definition:
```typescript
Then('the page should display {int} invoices', async function (this: CustomWorld, expectedCount: number) {
  // Wait for table to load, count rows
  const rows = await this.page.locator('[data-testid="invoice-row"]').all();
  expect(rows.length).toBe(expectedCount);
});
```

**Problems**:
- Depends on page navigation and rendering
- Pagination might not show all items
- Table might be partially loaded when count happens

#### After (API-based)

```gherkin
Scenario: Create multiple invoices and verify count
  When the user create 3 invoices

  # Query API for invoice list
  Given the user perform 'getInvoiceList' API call with the following details
    | Key    | Value |
    | status | Draft |
  Then the API should return at least 3 invoices
```

Custom step definition:
```typescript
Then('the API should return at least {int} invoices', async function (this: CustomWorld, expectedCount: number) {
  const response = this.apiResponse;
  let items: unknown[] = [];

  if (Array.isArray(response)) {
    items = response;
  } else if (response && typeof response === 'object') {
    const rows = (response as any).rows;
    if (Array.isArray(rows)) {
      items = rows;
    }
  }

  expect(items.length).toBeGreaterThanOrEqual(expectedCount);
});
```

**Benefits**:
- No page navigation
- Count from authoritative backend source
- Handles pagination automatically

### Pattern 4: Multi-Field Verification

#### Before (UI-based)

```gherkin
Scenario: Verify invoice details on page
  When the user create invoice with details
    | clientName | Acme Corp |
    | amount     | 5000      |
  Then the invoice detail page should display
    | Field      | Value     |
    | clientName | Acme Corp |
    | amount     | 5000      |
    | status     | Draft     |
```

Step definition:
```typescript
Then('the invoice detail page should display', async function (this: CustomWorld, dataTable: DataTable) {
  // Navigate to detail page
  await this.invoiceManagerPage.navigateToDetails(this.invoiceId);
  
  // Wait for each field and read
  for (const [field, expected] of dataTable.rowsHash()) {
    const element = this.page.locator(`[data-testid="${field}"]`);
    await element.waitFor({ timeout: 5000 });
    const actual = await element.textContent();
    expect(actual).toBe(expected);
  }
});
```

**Problems**:
- Multiple waits (slow)
- Navigation adds overhead
- Fields might not all be visible initially

#### After (API-based)

```gherkin
Scenario: Verify invoice details via API
  When the user create invoice with details
    | clientName | Acme Corp |
    | amount     | 5000      |

  # Verify all fields from API response
  Given the user perform 'getInvoiceDetails' API call with the following details
    | Key       | Value           |
    | invoiceId | <this.invoiceId> |
  Then the API response should contain the following details
    | Key        | Value     |
    | clientName | Acme Corp |
    | amount     | 5000      |
    | status     | Draft     |
```

**Benefits**:
- Single API call
- No navigation
- All fields verified in parallel
- Easier to read and maintain

## Decision Guide: UI vs API

| Question | Answer | Use |
|----------|--------|-----|
| Am I verifying state was persisted? | Yes | API |
| Am I testing UI rendering/layout? | Yes | UI |
| Am I checking a notification message? | Yes | UI |
| Am I verifying form field values after creation? | Yes | API |
| Am I testing button click behavior? | Yes | UI |
| Am I verifying data in a list/table? | Yes | API |
| Am I testing error handling/validation? | Depends | Mixed |
| Am I verifying a calculation result? | Yes | API |

## Migration Strategy

### Step 1: Identify UI Assertion Candidates

Look for Then/And steps that:
- Read values from the page (field amounts, IDs, statuses)
- Count items in lists
- Verify presence/absence of elements
- Navigate to detail pages to verify data

**Mark these as candidates for API migration.**

### Step 2: Check API Coverage

Ensure the API has an endpoint that:
- Returns the entity/list you're trying to verify
- Has the fields you need to assert
- Is stable and reliable (not in flux)

### Step 3: Register the API Action

If not already registered, add to `API_METHOD_MAP` in [APItest.steps.ts](../../features/stepDef/APItest.steps.ts):

```typescript
const API_METHOD_MAP: Record<string, HttpMethod> = {
  // ... existing entries
  getInvoiceDetails: 'GET',  // ← NEW
  getInvoiceList: 'GET',     // ← NEW
};
```

### Step 4: Replace UI Step with API Step

**Remove**:
```gherkin
Then the invoice amount on the page should be "5000"
```

**Add**:
```gherkin
Given the user perform 'getInvoiceDetails' API call with the following details
  | Key       | Value           |
  | invoiceId | <this.invoiceId> |
Then the API response should contain the following details
  | Key    | Value |
  | amount | 5000  |
```

### Step 5: Test and Validate

Run the feature with the new API assertions. Verify:
- API calls succeed (no auth/URL issues)
- Response contains expected fields
- Assertions match the API response format

## Hybrid Approach: UI + API

Some scenarios benefit from **both** UI and API assertions:

```gherkin
Scenario: Create invoice and verify full workflow
  # UI: User sees success notification
  When the user create invoice with the following details
    | clientName | Acme Corp |
    | amount     | 5000      |
  Then the user should see invoice created successfully  # ← UI check

  # API: Backend persisted the data correctly
  Given the user perform 'getInvoiceDetails' API call with the following details
    | Key       | Value           |
    | invoiceId | <this.invoiceId> |
  Then the API response should contain the following details
    | Key        | Value     |
    | clientName | Acme Corp |
    | amount     | 5000      |  # ← API check

  # UI: User navigates and sees the details on page
  When the user navigate to invoice details page
  Then the invoice details should match the API data  # ← Custom comparison
```

This approach:
- Verifies the complete user journey (UI + backend)
- Catches issues in both layers
- Maintains reasonable test speed

## Checklist for Migration

- [ ] Identified UI assertions to migrate
- [ ] Confirmed API endpoints exist and are stable
- [ ] Registered new API actions in `API_METHOD_MAP`
- [ ] Updated feature files with generic API steps
- [ ] Tested API calls and response format
- [ ] Verified assertions pass with real data
- [ ] Removed redundant UI navigation
- [ ] Documented any hybrid (UI + API) approaches
- [ ] Verified test speed improvements

## Performance Comparison

### Before (All UI Assertions)
```
Create invoice (UI):          1.5s
Navigate to detail page:      0.8s
Wait for page load:           1.2s
Read and verify 5 fields:     2.0s
Total: ~5.5s
```

### After (API Assertions)
```
Create invoice (UI):          1.5s
API call + assertion:         0.2s
Total: ~1.7s
```

**Improvement**: 3.8s saved per scenario (~70% faster)

With multiple scenarios/assertions, API migration significantly improves suite performance.
