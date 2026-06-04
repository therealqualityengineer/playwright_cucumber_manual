import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../utils/CustomWorld';
import { InvoiceManagerDetails } from '../../../../pages/InvoiceManagerPage';
import { RandomNumbers, RandomEmail, RandomAlphabets, RandomString, ResolveDate } from '../../../../test-data/ResolveDynamicData';

When('the user create invoice with the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const details: Partial<InvoiceManagerDetails> = {};

    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        let value = row[1] ?? '';

        // Resolve dynamic tokens inline BEFORE assigning to details
        if (value === '<RandomAlphabets>') {
            value = RandomAlphabets();
        } else if (value === '<RandomEmail>') {
            value = RandomEmail();
        } else if (value === '<RandomNumbers>') {
            value = RandomNumbers();
        } else if (value === '<RandomString>') {
            value = RandomString();
        } else if (value.includes('<Today')) {
            value = ResolveDate(value);
        } else if (value === '<this.clientName>') {
            value = this.clientName ?? '';
        } else if (value === '<this.clientId>') {
            value = this.clientId ?? '';
        }

        details[field as keyof InvoiceManagerDetails] = value;
    }

    // Capture state for later steps
    const clientName = details['clientName' as keyof InvoiceManagerDetails];
    if (clientName !== undefined) this.clientName = clientName as string;

    await this.invoiceManagerPage.createInvoice(details as InvoiceManagerDetails);
    this.invoiceId = await this.invoiceManagerPage.waitForInvoiceId();
});

Then('the user should see invoice created successfully', async function (this: CustomWorld) {
    await this.invoiceManagerPage.waitForSuccessMessage();
});

Then('the invoice number should match {string}', async function (this: CustomWorld, pattern: string) {
    const invoiceNumber = await this.invoiceManagerPage.getDisplayedInvoiceNumber();
    expect(invoiceNumber).toMatch(new RegExp(pattern));
});

Then('the invoice status should be {string}', async function (this: CustomWorld, expectedStatus: string) {
    const status = await this.invoiceManagerPage.getInvoiceStatus();
    expect(status).toBe(expectedStatus);
});

When('the user navigate to invoice details page', async function (this: CustomWorld) {
    if (!this.invoiceId) {
        throw new Error('invoiceId not captured — create an invoice first');
    }
    await this.invoiceManagerPage.navigateToDetails(this.invoiceId);
});

Then('the invoice details should display', async function (this: CustomWorld, dataTable: DataTable) {
    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        let expectedValue = row[1] ?? '';

        // Resolve <this.*> tokens in expected values
        if (expectedValue === '<this.clientName>') {
            expectedValue = this.clientName ?? '';
        } else if (expectedValue === '<this.invoiceId>') {
            expectedValue = this.invoiceId ?? '';
        }

        const displayedValue = await this.invoiceManagerPage.getDetailValue(field as keyof InvoiceManagerDetails);
        expect(displayedValue).toBe(expectedValue);
    }
});
