# API Response Handling Guide

When writing API assertions, you need to understand how different API endpoints return data. This guide covers the common response patterns and how to extract and assert on them.

## Response Structure Patterns

### Pattern 1: Array of Objects

**API returns**: A direct array

```json
[
  { "invoiceId": "INV-001", "amount": 5000, "status": "Draft" },
  { "invoiceId": "INV-002", "amount": 7500, "status": "Active" }
]
```

**Extraction in code**:
```typescript
let record: Record<string, unknown>;
if (Array.isArray(response)) {
  record = response[0]; // Take first item
}
```

**Assertion**:
```gherkin
Then the API response should contain the following details
  | Key       | Value           |
  | invoiceId | INV-001         |
  | amount    | 5000            |
```

### Pattern 2: Paginated Response

**API returns**: Object with `rows` array (common in backend pagination)

```json
{
  "rows": [
    { "invoiceId": "INV-001", "amount": 5000, "status": "Draft" },
    { "invoiceId": "INV-002", "amount": 7500, "status": "Active" }
  ],
  "totalCount": 2,
  "pageNumber": 1,
  "pageSize": 50
}
```

**Extraction in code**:
```typescript
let record: Record<string, unknown> = {};
if (Array.isArray(response.rows)) {
  record = response.rows[0]; // Take first row
}
```

**Assertion**:
```gherkin
Then the API response should contain the following details
  | Key    | Value |
  | amount | 5000  |
```

### Pattern 3: Nested Data Object

**API returns**: Object with `data` or specific entity fields

```json
{
  "success": true,
  "data": {
    "invoiceId": "INV-001",
    "amount": 5000,
    "status": "Draft",
    "details": {
      "clientId": "C-123",
      "createdAt": "2026-06-04"
    }
  }
}
```

**Extraction in code**:
```typescript
let record: Record<string, unknown> = {};
if (response && typeof response === 'object') {
  const responseObj = response as Record<string, unknown>;
  
  // Try common patterns
  if (responseObj.data && typeof responseObj.data === 'object') {
    record = responseObj.data as Record<string, unknown>;
  } else {
    record = responseObj; // Use root object if no 'data' wrapper
  }
}
```

**Assertion**:
```gherkin
Then the API response should contain the following details
  | Key    | Value |
  | amount | 5000  |
```

**For nested fields** (if not flattened):
```typescript
const nestedValue = (record.details as Record<string, unknown>)?.clientId;
```

### Pattern 4: Plain Object (Single Record)

**API returns**: Direct object without array or wrapper

```json
{
  "invoiceId": "INV-001",
  "amount": 5000,
  "status": "Draft",
  "clientId": "C-123"
}
```

**Extraction in code**:
```typescript
let record = response as Record<string, unknown>;
```

**Assertion**:
```gherkin
Then the API response should contain the following details
  | Key    | Value |
  | amount | 5000  |
```

## Generic Helper for Response Extraction

The framework's built-in assertion step handles all patterns automatically:

```typescript
let record: Record<string, unknown>;

if (Array.isArray(response)) {
  // Pattern 1: Array
  const first = response[0];
  record = first !== undefined && typeof first === 'object' && first !== null
    ? (first as Record<string, unknown>)
    : {};
} else {
  // Patterns 2–4: Objects
  const responseObj = response as Record<string, unknown>;
  
  // Try 'rows' array (paginated)
  const rows = responseObj['rows'];
  const firstRow = Array.isArray(rows) ? rows[0] : undefined;
  record = firstRow !== undefined && typeof firstRow === 'object' && firstRow !== null
    ? (firstRow as Record<string, unknown>)
    : responseObj; // Fall back to root object
}
```

## Decision Tree: Which Pattern Does Your API Use?

```
Does the API return an array directly?
├─ YES → Pattern 1 (Array of Objects)
└─ NO → Is it wrapped in { rows: [...] }?
   ├─ YES → Pattern 2 (Paginated)
   └─ NO → Is it wrapped in { data: {...} }?
      ├─ YES → Pattern 3 (Nested Data)
      └─ NO → Pattern 4 (Plain Object)
```

## Testing Response Structure

Before writing assertions, **test the response structure**:

### In a Feature (Manual Verification)

```gherkin
Scenario: Print API response structure
  Given the user perform 'getInvoices' API call with the following details
    | Key    | Value |
    | status | Draft |
  Then print the API response for debugging
```

### Custom Debug Step

```typescript
Then('print the API response for debugging', async function (this: CustomWorld) {
  console.log('API Response Structure:');
  console.log(JSON.stringify(this.apiResponse, null, 2));
  
  // Also print type info
  if (Array.isArray(this.apiResponse)) {
    console.log('✓ Is an array');
    console.log(`  Length: ${this.apiResponse.length}`);
    if (this.apiResponse.length > 0) {
      console.log(`  First item keys: ${Object.keys(this.apiResponse[0]).join(', ')}`);
    }
  } else if (this.apiResponse && typeof this.apiResponse === 'object') {
    const responseObj = this.apiResponse as Record<string, unknown>;
    console.log('✓ Is an object');
    console.log(`  Top-level keys: ${Object.keys(responseObj).join(', ')}`);
    
    if (responseObj.rows) {
      console.log('  → Has "rows" array (paginated)');
    }
    if (responseObj.data) {
      console.log('  → Has "data" field (nested)');
    }
  }
});
```

Run the test, capture the output, and determine the pattern.

## Common Mistakes

### ❌ Mistake 1: Forgetting to Extract from Array

```gherkin
# This fails because response is an array, not an object
Then the API response should contain the following details
  | Key    | Value |
  | amount | 5000  |
```

**Why**: The assertion step tries to read `response.amount`, but response is `[{...}, {...}]`.

**Fix**: The framework's built-in step handles this automatically.

### ❌ Mistake 2: Not Handling Null/Undefined in Nested Fields

```typescript
const clientId = record.details.clientId; // Crashes if details is null
```

**Fix**: Use optional chaining:
```typescript
const clientId = (record.details as any)?.clientId ?? '';
```

### ❌ Mistake 3: Comparing Numeric Strings

```gherkin
Then the API response should contain the following details
  | Key    | Value |
  | amount | 5000  |
```

If the API returns `"amount": 5000` (number) but the assertion expects `"5000"` (string), they won't match.

**Fix**: The framework converts both to strings, so `5000` (number) becomes `"5000"` (string) → matches.

### ❌ Mistake 4: Assuming Consistent Response Format Across Endpoints

Different API endpoints may return different structures:
- `/getInvoices` → paginated: `{ rows: [...] }`
- `/getInvoiceDetails` → plain object: `{ invoiceId: '...', ... }`
- `/listInvoices` → array: `[...]`

**Fix**: Always check the API documentation and test the response structure first.

## Field Extraction Examples

### Example 1: Top-Level Field
```typescript
const amount = String(record.amount || '');
```

### Example 2: Nested Field (Flattened in Response)
```json
{
  "invoiceId": "INV-001",
  "clientDetails.name": "Acme Corp" // Already flattened by API
}
```
```typescript
const clientName = String(record['clientDetails.name'] || '');
```

### Example 3: Nested Object (Need to Descend)
```json
{
  "invoiceId": "INV-001",
  "client": {
    "name": "Acme Corp",
    "id": "C-123"
  }
}
```
```typescript
const client = record.client as Record<string, unknown>;
const clientName = String(client.name || '');
```

### Example 4: Array Field (Get First Item)
```json
{
  "invoiceId": "INV-001",
  "lineItems": [
    { "description": "Service A", "amount": 3000 },
    { "description": "Service B", "amount": 2000 }
  ]
}
```
```typescript
const lineItems = record.lineItems as any[];
const firstLineItem = lineItems?.[0];
const firstDescription = String(firstLineItem?.description || '');
```

## Debugging Response Issues

### When Assertion Fails

```
Error: Assertion failed: expected 'Draft' to be 'Active'
```

**Debug steps**:
1. Add a custom debug step before the assertion:
   ```gherkin
   Then print the API response for debugging
   Then the API response should contain the following details
   ```

2. Review the structure in console output

3. Check if the field name is correct (case-sensitive)

4. Verify the field exists in the response (may be missing in some cases)

### When Response is Empty or Null

```gherkin
Then the API response should contain the following details
  | Key    | Value |
  | amount | 5000  |
```

**Fails with**: `Cannot read property 'amount' of null`

**Causes**:
- API call step didn't run or failed silently
- Response wasn't stored in `this.apiResponse`
- API returned an error object instead of data

**Fix**:
```gherkin
# Verify response exists first
Given the user perform 'getInvoices' API call with the following details
  | Key | Value |
Then the API should have returned a valid response # Custom check
And the API response should contain the following details
```

## Response Structure Checklist

- [ ] Know if your API returns: array, paginated object, nested object, or plain object
- [ ] Test the response structure manually (curl, Postman, or custom debug step)
- [ ] Use the framework's automatic extraction (handles all patterns)
- [ ] For custom assertions, write extraction logic that handles your specific structure
- [ ] Test with real API responses, not just mock data
- [ ] Handle null/undefined gracefully with optional chaining or defaults
