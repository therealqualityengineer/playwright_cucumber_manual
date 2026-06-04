// @ts-nocheck
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../utils/CustomWorld';
import { InvoiceManagerDetails } from '../../../../pages/InvoiceManagerPage';
import { RandomNumbers, RandomEmail, RandomAlphabets, RandomString, ResolveDate } from '../../../../test-data/ResolveDynamicData';

/**
 * Helper to resolve dynamic tokens in DataTable values.
 * Tokens are replaced in step code BEFORE passing to page layer.
 */
async function resolveDynamicValue(context: CustomWorld, value: string): Promise<string> {
  // Resolve <Today>, <Today+N>, <Today-N>
  if (value.includes('<Today')) {
    return ResolveDate(value);
  }

  // Resolve random generators
  if (value === '<RandomEmail>') {
    return RandomEmail();
  }
  if (value === '<RandomAlphabets>') {
    return RandomAlphabets();
  }
  if (value === '<RandomNumbers>') {
    return RandomNumbers();
  }
  if (value === '<RandomString>') {
    return RandomString();
  }

  // Resolve <this.fieldName> from CustomWorld
  if (value.startsWith('<this.')) {
    const fieldName = value.slice(6, -1); // Remove <this. and >
    const fieldValue = (context as any)[fieldName];
    if (fieldValue === undefined) {
      throw new Error(`CustomWorld field '${fieldName}' not found. Available: ${Object.keys(context).join(', ')}`);
    }
    return String(fieldValue);
  }

  // Return unchanged if no token
  return value;
}

/**
 * Build a Partial<T> from DataTable rows, resolving dynamic tokens.
 */
async function buildDetailsFromDataTable<T>(
  context: CustomWorld,
  dataTable: DataTable,
  fieldNames: (keyof T)[],
): Promise<Partial<T>> {
  const details: any = {};
  const rows = dataTable.hashes();

  for (const row of rows) {
    const field = row.Field as keyof T;
    let value = row.Value;

    // Validate field exists in the interface
    if (!fieldNames.includes(field)) {
      throw new Error(`Unknown field '${field}' for this entity. Allowed: ${fieldNames.map((f) => String(f)).join(', ')}`);
    }

    // Resolve dynamic tokens BEFORE adding to details
    value = await resolveDynamicValue(context, value);

    details[field] = value;
  }

  return details;
}

When('the user create invoice with the following details', async function (this: CustomWorld, dataTable: DataTable) {
  // Define valid fields for InvoiceManagerDetails
  const validFields: (keyof InvoiceManagerDetails)[] = [
    'invoiceNumber',
    'clientName',
    'amount',
    'dueDate',
    'description',
  ];

  // Build details from DataTable with dynamic resolution
  const details = await buildDetailsFromDataTable<InvoiceManagerDetails>(this, dataTable, validFields);

  // Pass to page — page merges with defaults
  const invoiceId = await this.invoiceManagerPage.createInvoice(details as InvoiceManagerDetails);

  // Capture state for later steps (e.g., <this.invoiceId>, <this.clientName>)
  this.invoiceId = invoiceId;
  if (details.clientName) {
    this.clientName = details.clientName;
  }
  if (details.amount) {
    this.amount = details.amount;
  }
});

Then('the user should see invoice created successfully', async function (this: CustomWorld) {
  // Wait for success notification or confirmation on page
  await this.invoiceManagerPage.waitForSuccessMessage();
});

Then('the invoice number should match {string}', async function (this: CustomWorld, pattern: string) {
  // Retrieve the invoice number from the page
  const invoiceNumber = await this.invoiceManagerPage.getDisplayedInvoiceNumber();

  // Convert pattern to regex (replace \d with [0-9], etc.)
  const regex = new RegExp(pattern);
  expect(invoiceNumber).toMatch(regex);
});

Then('the invoice status should be {string}', async function (this: CustomWorld, expectedStatus: string) {
  const status = await this.invoiceManagerPage.getInvoiceStatus();
  expect(status).toBe(expectedStatus);
});

When('the user navigate to invoice details page', async function (this: CustomWorld) {
  // Use captured state to navigate to the correct invoice
  if (!this.invoiceId) {
    throw new Error('invoiceId not captured. Create an invoice first.');
  }
  await this.invoiceManagerPage.navigateToDetails(this.invoiceId);
});

Then('the invoice details should display', async function (this: CustomWorld, dataTable: DataTable) {
  // Verify that the page displays expected invoice details
  const expectedRows = dataTable.hashes();

  for (const row of expectedRows) {
    const field = row.Field as keyof InvoiceManagerDetails;
    let expectedValue = row.Value;

    // Resolve tokens in expected values too
    expectedValue = await resolveDynamicValue(this, expectedValue);

    // Get displayed value from page
    const displayedValue = await this.invoiceManagerPage.getDetailValue(field);

    expect(displayedValue).toBe(expectedValue);
  }
});
