import { When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../../../utils/CustomWorld";
import { InvoiceManagerDetails } from "../../../../pages/InvoiceManagerPage";
import { resolvePlaceholder } from "../../../../utils/resolvePlaceholder";

When(
  "the user create invoice with the following details",
  async function (this: CustomWorld, dataTable: DataTable) {
    const details: Partial<InvoiceManagerDetails> = {};

    for (const row of dataTable.raw().slice(1)) {
      const field = row[0] ?? "";
      details[field as keyof InvoiceManagerDetails] = resolvePlaceholder(
        row[1] ?? "",
        this,
      );
    }

    const clientName = details["clientName" as keyof InvoiceManagerDetails];
    if (clientName !== undefined) this.clientName = clientName as string;

    await this.invoiceManagerPage.createInvoice(
      details as InvoiceManagerDetails,
    );
    this.invoiceId = await this.invoiceManagerPage.waitForInvoiceId();
  },
);

Then(
  "the user should see invoice created successfully",
  async function (this: CustomWorld) {
    await this.invoiceManagerPage.waitForSuccessMessage();
  },
);

Then(
  "the invoice number should match {string}",
  async function (this: CustomWorld, pattern: string) {
    const invoiceNumber =
      await this.invoiceManagerPage.getDisplayedInvoiceNumber();
    expect(invoiceNumber).toMatch(new RegExp(pattern));
  },
);

Then(
  "the invoice status should be {string}",
  async function (this: CustomWorld, expectedStatus: string) {
    const status = await this.invoiceManagerPage.getInvoiceStatus();
    expect(status).toBe(expectedStatus);
  },
);

When(
  "the user navigate to invoice details page",
  async function (this: CustomWorld) {
    if (!this.invoiceId) {
      throw new Error("invoiceId not captured — create an invoice first");
    }
    await this.invoiceManagerPage.navigateToDetails(this.invoiceId);
  },
);

Then(
  "the invoice details should display",
  async function (this: CustomWorld, dataTable: DataTable) {
    for (const row of dataTable.raw().slice(1)) {
      const field = row[0] ?? "";
      const expectedValue = resolvePlaceholder(row[1] ?? "", this);
      const displayedValue = await this.invoiceManagerPage.getDetailValue(
        field as keyof InvoiceManagerDetails,
      );
      expect(displayedValue).toBe(expectedValue);
    }
  },
);
