// @ts-nocheck
import { Given, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../utils/CustomWorld';

/**
 * EXAMPLE: Custom API assertion step definitions
 *
 * These examples show patterns for writing custom assertions beyond the generic
 * "the API response should contain" step. They demonstrate:
 * - Response structure handling (arrays, paginated, plain objects)
 * - Dynamic token resolution
 * - Complex assertions (counts, nested fields, conditional logic)
 * - Storing response data for later verification
 */

/**
 * Example 1: Assert count of returned items
 * 
 * Scenario: 
 *   Given the user perform 'getInvoiceList' API call with the following details
 *     | Key    | Value |
 *     | status | Draft |
 *   Then the API should return at least 5 invoices
 */
Then('the API should return at least {int} invoices', async function (this: CustomWorld, expectedCount: number) {
  if (!this.apiResponse) {
    throw new Error('No API response stored — did the API call step run?');
  }

  const response = this.apiResponse;
  let items: unknown[] = [];

  // Handle different response structures
  if (Array.isArray(response)) {
    items = response;
  } else if (typeof response === 'object' && response !== null) {
    const responseObj = response as Record<string, unknown>;
    if (Array.isArray(responseObj.rows)) {
      items = responseObj.rows;
    } else if (Array.isArray(responseObj.data)) {
      items = responseObj.data;
    }
  }

  expect(items.length).toBeGreaterThanOrEqual(expectedCount);
});

/**
 * Example 2: Assert specific field in all returned items
 * 
 * Scenario:
 *   Given the user perform 'getInvoiceList' API call with the following details
 *     | Key    | Value |
 *     | status | Draft |
 *   Then all invoices should have status "Draft"
 */
Then('all invoices should have status {string}', async function (this: CustomWorld, expectedStatus: string) {
  if (!this.apiResponse) {
    throw new Error('No API response stored');
  }

  const response = this.apiResponse;
  let items: Record<string, unknown>[] = [];

  // Extract items array from various response formats
  if (Array.isArray(response)) {
    items = response.filter(item => typeof item === 'object' && item !== null) as Record<string, unknown>[];
  } else if (typeof response === 'object' && response !== null) {
    const responseObj = response as Record<string, unknown>;
    if (Array.isArray(responseObj.rows)) {
      items = responseObj.rows.filter(item => typeof item === 'object' && item !== null) as Record<string, unknown>[];
    }
  }

  if (items.length === 0) {
    throw new Error('No items found in API response');
  }

  // Assert all items match
  for (const item of items) {
    const status = String(item.status || '');
    expect(status).toBe(expectedStatus);
  }
});

/**
 * Example 3: Assert nested/complex field
 * 
 * Scenario:
 *   Given the user perform 'getInvoiceDetails' API call with the following details
 *     | Key       | Value           |
 *     | invoiceId | <this.invoiceId> |
 *   Then the invoice due date should be in the future
 */
Then('the invoice due date should be in the future', async function (this: CustomWorld) {
  if (!this.apiResponse || typeof this.apiResponse !== 'object') {
    throw new Error('No API response');
  }

  const response = this.apiResponse;
  
  // Extract the response record (handle array/paginated/plain)
  let record: Record<string, unknown>;
  if (Array.isArray(response)) {
    const first = response[0];
    record = first && typeof first === 'object' ? (first as Record<string, unknown>) : {};
  } else {
    const responseObj = response as Record<string, unknown>;
    record = responseObj;
  }

  const dueDateStr = record.dueDate;
  if (!dueDateStr) {
    throw new Error('dueDate field not found in API response');
  }

  const dueDate = new Date(String(dueDateStr));
  const today = new Date();

  // Clear time for date comparison
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  expect(dueDate.getTime()).toBeGreaterThan(today.getTime());
});

/**
 * Example 4: Assert with custom error message for clarity
 * 
 * Scenario:
 *   Given the user perform 'getInvoiceDetails' API call with the following details
 *     | Key       | Value           |
 *     | invoiceId | <this.invoiceId> |
 *   Then the invoice total should match the sum of line items
 */
Then('the invoice total should match the sum of line items', async function (this: CustomWorld) {
  if (!this.apiResponse) {
    throw new Error('No API response stored');
  }

  const response = this.apiResponse;
  const record = Array.isArray(response) ? response[0] : response;
  
  if (!record || typeof record !== 'object') {
    throw new Error('API response is not an object or array');
  }

  const recordObj = record as Record<string, unknown>;
  const invoiceTotal = parseFloat(String(recordObj.total || 0));
  const lineItems = recordObj.lineItems;

  if (!Array.isArray(lineItems)) {
    throw new Error('lineItems field not found or is not an array');
  }

  const sumLineItems = lineItems.reduce((sum, item) => {
    const amount = typeof item === 'object' && item !== null
      ? parseFloat(String((item as Record<string, unknown>).amount || 0))
      : 0;
    return sum + amount;
  }, 0);

  expect(invoiceTotal).toBeCloseTo(sumLineItems, 2); // Allow 2 decimal places
});

/**
 * Example 5: Store response data for use in later steps
 * 
 * Scenario:
 *   Given the user perform 'getInvoiceDetails' API call with the following details
 *     | Key       | Value           |
 *     | invoiceId | <this.invoiceId> |
 *   And the user store the API response for later verification
 *   When the user navigate to invoice details page
 *   Then the UI should display the stored invoice data
 */
Given('the user store the API response for later verification', async function (this: CustomWorld) {
  if (!this.apiResponse) {
    throw new Error('No API response to store');
  }

  const response = this.apiResponse;
  let record: Record<string, unknown>;

  if (Array.isArray(response)) {
    const first = response[0];
    record = first && typeof first === 'object' ? (first as Record<string, unknown>) : {};
  } else {
    record = (response as Record<string, unknown>);
  }

  // Store key fields on CustomWorld for later assertion
  this.storedInvoiceId = String(record.invoiceId || '');
  this.storedInvoiceAmount = String(record.amount || '');
  this.storedInvoiceStatus = String(record.status || '');
  this.storedInvoiceCreatedAt = String(record.createdAt || '');
});

/**
 * Example 6: Assert response matches DataTable with custom logic
 * 
 * Scenario:
 *   Given the user perform 'getInvoiceDetails' API call with the following details
 *     | Key       | Value           |
 *     | invoiceId | <this.invoiceId> |
 *   Then the API response should match the following with tolerance
 *     | Field  | Value | Tolerance |
 *     | amount | 5000  | 0.01      |
 *     | tax    | 500   | 1         |
 *
 * Note: This is a custom pattern beyond the generic step.
 */
Then('the API response should match the following with tolerance', async function (this: CustomWorld, dataTable: DataTable) {
  if (!this.apiResponse || typeof this.apiResponse !== 'object') {
    throw new Error('No valid API response');
  }

  const response = this.apiResponse;
  let record: Record<string, unknown> = {};

  if (Array.isArray(response)) {
    const first = response[0];
    record = first && typeof first === 'object' ? (first as Record<string, unknown>) : {};
  } else {
    record = (response as Record<string, unknown>);
  }

  const rows = dataTable.hashes();
  for (const row of rows) {
    const field = row.Field || '';
    const expectedStr = row.Value || '';
    const toleranceStr = row.Tolerance || '0';

    const actual = parseFloat(String(record[field] || 0));
    const expected = parseFloat(expectedStr);
    const tolerance = parseFloat(toleranceStr);

    const difference = Math.abs(actual - expected);
    expect(difference).toBeLessThanOrEqual(tolerance);
  }
});

/**
 * REFERENCE: Using the Generic API Steps (Already Implemented)
 *
 * These are built-in and reusable across all API test scenarios:
 *
 * 1. API Call:
 *    Given the user perform '<apiName>' API call with the following details
 *      | Key   | Value |
 *      | key1  | val1  |
 *    → Calls: GET/POST /wfportal/clearConnect/2_0/?action=<apiName>&key1=val1&...
 *    → Stores: response in this.apiResponse
 *
 * 2. Generic Assertion:
 *    Then the API response should contain the following details
 *      | Key   | Value |
 *      | key1  | val1  |
 *    → Extracts first record from array/paginated/plain object
 *    → Asserts: record.key1 === 'val1'
 *    → Dynamic tokens: <this.fieldName> resolved from CustomWorld
 *
 * For most scenarios, these two generic steps handle everything.
 * Only write custom assertions if you need complex logic or custom error messages.
 */
