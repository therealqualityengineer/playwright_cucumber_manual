---
name: api-test
description: 'Verify test outcomes via API instead of UI. Use when: writing Then/And assertion steps; querying state after actions; avoiding slow UI element waits; combining API verification with UI flows. Replaces UI assertions with Playwright APIRequestContext calls to the ClearConnect backend.'
---

# API-Based Test Assertions

Verify test outcomes using direct API calls instead of UI inspection. This approach is **faster**, **more reliable**, and **cleaner** for state verification—especially in Then/And assertion steps.

## When to Use API Assertions

### ✅ Use API for Verification

- **After creating resources** → Query the API to confirm the resource exists with expected fields
- **Checking state changes** → Verify database/backend state without relying on UI rendering
- **Avoiding waits** → No need to wait for UI elements; API returns immediately
- **Complex assertions** → Multiple fields, nested structures, computed values
- **Speed-critical tests** → API calls are typically 10× faster than UI interactions

### Example Scenarios

| UI Assertion | API Assertion |
|---|---|
| Wait for "Invoice created" toast → read invoice number from page | Call `/api/getInvoices` → assert `invoiceId` in response |
| Fill form, submit, wait for redirect, read details from form fields | Call `/api/createInvoice`, then `/api/getInvoiceDetails` → assert response fields |
| Navigate to report page, wait for table to load, count rows | Call `/api/getReports` → assert `rows.length` |

## Architecture Overview

### API Layer Components

The framework provides:

1. **[APItestPage.ts](../../pages/APItestPage.ts)** — Generic API client using Playwright's `page.request`
2. **[APItest.steps.ts](../../features/stepDef/APItest.steps.ts)** — Step definitions for API calls and assertions
3. **[apiConfig.ts](../../test-data/apiConfig.ts)** — API base URLs and credentials per environment
4. **[APItest.feature](../../features/feature/APItest.feature)** — Example API test scenarios

### Authentication & Base URL

- **Auth**: Basic HTTP auth (username:password in `apiConfig.credentials`)
- **Base URL**: Resolved from current page origin + environment mapping in `apiConfig.baseUrl`
- **API path**: Always `/wfportal/clearConnect/2_0/`
- **Action parameter**: Auto-injected from API method name in `API_METHOD_MAP`

## Step-by-Step: Writing API Assertions

### 1. Register the API Action

In [APItest.steps.ts](../../features/stepDef/APItest.steps.ts), add to `API_METHOD_MAP`:

```typescript
const API_METHOD_MAP: Record<string, HttpMethod> = {
    getTemps:        'GET',
    getClients:      'GET',
    getInvoices:     'GET',      // ← NEW: register your API method
    createInvoice:   'POST',
    deleteInvoice:   'POST',
};
```

**Rules**:
- Key must match the API action name (e.g., `getInvoices`)
- Value is the HTTP method (`GET`, `POST`, `PUT`, `DELETE`)
- When you call `Given the user perform 'getInvoices' API call`, the framework auto-injects `action=getInvoices` as a query param

### 2. Call the API from a Step

In your step definition or feature, use the generic API step:

```gherkin
# Feature example
Given the user perform 'getInvoices' API call with the following details
  | Key             | Value          |
  | clientId        | <this.clientId> |
  | status          | Active         |
  | includeArchived | false          |
```

**Resolves to**: 
```
GET /wfportal/clearConnect/2_0/?action=getInvoices&clientId=<ID>&status=Active&includeArchived=false
Authorization: Basic <base64(username:password)>
```

### 3. Capture the Response

The step stores the JSON response in `CustomWorld.apiResponse`:

```typescript
// In step code
const response = this.apiResponse; // { rows: [{ invoiceId: '123', amount: 5000 }, ...] }
```

Response formats vary:
- **Array**: `[{ id: '1', name: 'Item A' }, ...]` → use `response[0]`
- **Paginated**: `{ rows: [{ id: '1', ... }] }` → use `response.rows[0]`
- **Wrapped**: `{ data: { id: '1', ... } }` → unwrap accordingly
- **Plain object**: `{ id: '1', name: 'Item A' }` → use as-is

### 4. Assert the Response

Use the generic assertion step:

```gherkin
Then the API response should contain the following details
  | Key       | Value              |
  | invoiceId | <this.invoiceId>   |
  | clientId  | <this.clientId>    |
  | status    | Active             |
  | amount    | 5000               |
```

The step:
1. Extracts the first record from the response (array, paginated, or plain object)
2. Resolves `<this.*>` tokens from `CustomWorld` state
3. Asserts each field with `expect(actual).toBe(expected)`

Failures are clear:
```
Error: Assertion failed: expected 'Draft' to be 'Active'
```

## Common Patterns

### Pattern 1: Create via UI, Verify via API

```gherkin
Scenario: Create invoice and verify backend state
  When the user create invoice with the following details
    | Field      | Value       |
    | clientName | Acme Corp   |
    | amount     | 5000        |
  Then the user should see invoice created successfully

  # Now verify the invoice exists in backend
  Given the user perform 'getInvoices' API call with the following details
    | Key      | Value           |
    | clientId | <this.clientId> |
  Then the API response should contain the following details
    | Key    | Value           |
    | amount | 5000            |
```

**Why**: UI says it's created; API confirms backend persisted it.

### Pattern 2: Multi-field Assertions

```gherkin
Then the API response should contain the following details
  | Key           | Value                |
  | invoiceId     | <this.invoiceId>     |
  | invoiceNumber | <this.invoiceNumber> |
  | clientId      | <this.clientId>      |
  | amount        | 5000.00              |
  | status        | Draft                |
  | createdAt     | <this.createdAt>     |
```

Each row is asserted independently:
```typescript
expect(response.invoiceId).toBe(this.invoiceId);
expect(response.invoiceNumber).toBe(this.invoiceNumber);
// ... etc
```

### Pattern 3: Dynamic Token Replacement

In the API call step, resolve `<this.*>` tokens before hitting the API:

```gherkin
Given the user perform 'getInvoiceDetails' API call with the following details
  | Key       | Value           |
  | invoiceId | <this.invoiceId> |
```

The step definition resolves `<this.invoiceId>` → actual ID from `CustomWorld`, then calls:
```
GET /wfportal/clearConnect/2_0/?action=getInvoiceDetails&invoiceId=INV-12345
```

See [APItest.steps.ts](../../features/stepDef/APItest.steps.ts) lines 20–33 for token resolution logic.

## Example: Invoice API Assertions

### Feature

```gherkin
@api @regression
Scenario: Create invoice via UI and verify with API
  When the user create invoice with the following details
    | Field      | Value     |
    | clientName | Acme Corp |
    | amount     | 5000      |
  Then the user should see invoice created successfully
  And the invoice id should be generated successfully in the url

  # Verify backend state via API
  Given the user perform 'getInvoiceDetails' API call with the following details
    | Key       | Value           |
    | invoiceId | <this.invoiceId> |
  Then the API response should contain the following details
    | Key       | Value           |
    | invoiceId | <this.invoiceId> |
    | clientId  | <this.clientId>  |
    | amount    | 5000            |
    | status    | Draft           |
```

### Step Definition (Already Exists)

The generic steps in [APItest.steps.ts](../../features/stepDef/APItest.steps.ts) handle this:

```typescript
Given('the user perform {string} API call with the following details', async function (apiName, dataTable) {
  const method = API_METHOD_MAP[apiName];
  if (!method) throw new Error(`Unknown API: ${apiName}`);
  
  const params = { action: apiName };
  // Resolve <this.*> tokens and build params...
  
  this.apiResponse = await this.apiTestPage.callApi(method, params);
});

Then('the API response should contain the following details', async function (dataTable) {
  const response = this.apiResponse;

  // Extract first record from array, paginated rows, or plain object
  let record: Record<string, unknown>;
  if (Array.isArray(response)) {
    record = (response[0] as Record<string, unknown>) ?? {};
  } else {
    const obj = response as Record<string, unknown>;
    const rows = obj['rows'];
    record = (Array.isArray(rows) ? rows[0] : undefined) ?? obj;
  }

  // Assert each field — skip header row via .raw().slice(1)
  for (const row of dataTable.raw().slice(1)) {
    const key = row[0] ?? '';
    const expected = row[1] ?? '';
    const actual = String(record[key] ?? '');
    expect(actual).toBe(expected);
  }
});
```

### To Use

1. **Add your API to the registry**:
   ```typescript
   API_METHOD_MAP: {
     getInvoiceDetails: 'GET',
   }
   ```

2. **Write the scenario** — use the generic API steps (no new step definition needed!)

3. **Capture and assert** — the framework handles token resolution and field matching

## Custom API Assertions

If the generic steps don't fit, write custom assertions:

```typescript
Then('the invoice should have a future due date', async function (this: CustomWorld) {
  if (!this.apiResponse || typeof this.apiResponse !== 'object') {
    throw new Error('No API response');
  }
  
  const response = Array.isArray(this.apiResponse) 
    ? this.apiResponse[0] 
    : this.apiResponse;
  
  const dueDate = new Date(response.dueDate as string);
  const today = new Date();
  expect(dueDate.getTime()).toBeGreaterThan(today.getTime());
});
```

Store the response in `CustomWorld.apiResponse` so it persists across steps:

```typescript
this.apiResponse = await this.apiTestPage.callApi(method, params);
```

## Checklist

- [ ] API method registered in `API_METHOD_MAP`
- [ ] Feature uses `Given the user perform '...' API call`
- [ ] DataTable rows: `| Key | Value |` format
- [ ] Dynamic tokens resolved in step (e.g., `<this.invoiceId>`)
- [ ] Assertion step uses `Then the API response should contain`
- [ ] Response structure handled (array vs paginated vs plain object)
- [ ] Assertion failures are clear and actionable

## Related Documentation

- [APItestPage.ts](../../pages/APItestPage.ts) — HTTP client using `page.request`, auth, base URL resolution
- [APItest.steps.ts](../../features/stepDef/APItest.steps.ts) — Generic Given/Then steps for API calls and assertions
- [APItest.feature](../../features/feature/APItest.feature) — Real examples: temp creation/verification, client creation/verification
- [apiConfig.ts](../../test-data/apiConfig.ts) — Environment URLs, credentials, API base paths
- [CLAUDE.md](../../CLAUDE.md) — Full architecture overview, adding new API actions
