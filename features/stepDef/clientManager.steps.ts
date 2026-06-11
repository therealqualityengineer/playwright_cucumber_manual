import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { CustomWorld } from "../../utils/CustomWorld";
import { resolvePlaceholder } from "../../utils/resolvePlaceholder";
import { ClientDetails } from "../../pages/ClientManagerPage";

Given(
  "the user create a new client with the following details",
  async function (this: CustomWorld, dataTable: DataTable) {
    const details: Partial<ClientDetails> = {};

    for (const row of dataTable.raw().slice(1)) {
      const field = row[0] ?? "";
      details[field as keyof ClientDetails] = resolvePlaceholder(
        row[1] ?? "",
        this,
      );
    }

    const clientName = details["ClientName"];
    if (clientName !== undefined) this.clientName = clientName;

    console.log("Client Name:", this.clientName);
    await this.clientManagerPage.navigateToNewClient();
    await this.clientManagerPage.createClient(details as ClientDetails);
  },
);

Then(
  "the client id should be generated successfully in the url",
  async function (this: CustomWorld) {
    this.clientId = await this.clientManagerPage.waitForClientId();
    console.log("Client Name:", this.clientId);
  },
);

Then(
  "the user verifies the client {string} message",
  async function (this: CustomWorld, message: string) {
    this.clientManagerPage.verifyTimeEntrySaveMessage(message);
  },
);

When(
  "the user set following values in {string} page",
  async function (this: CustomWorld, pageName: string, dataTable: DataTable) {
    if (pageName === "Settings") {
      await this.clientManagerPage.openSettingsTab(this.clientId ?? "");
    } else if (pageName === "Time Entry and Approval") {
      await this.clientManagerPage.openTimeEntryTab(this.clientId ?? "");
    }
    for (const row of dataTable.raw().slice(1)) {
      const field = row[0] ?? "";
      const value = row[1] ?? "";
      if (!field) continue;
      if (pageName === "Settings") {
        await this.clientManagerPage.setSettingsField(field, value);
      } else if (pageName === "Time Entry and Approval") {
        await this.clientManagerPage.setTimeEntryField(field, value);
      }
    }
    if (pageName === "Settings") {
      await this.clientManagerPage.saveSettings();
    } else if (pageName === "Time Entry and Approval") {
      await this.clientManagerPage.saveTimeEntrySettings();
    }
  },
);

Then(
  "the user verifies following values in {string} page",
  async function (this: CustomWorld, pageName: string, dataTable: DataTable) {
    if (pageName === "Settings") {
      await this.clientManagerPage.openSettingsTab(this.clientId ?? "");
    } else if (pageName === "Time Entry and Approval") {
      await this.clientManagerPage.openTimeEntryTab(this.clientId ?? "");
    }
    for (const row of dataTable.raw().slice(1)) {
      const field = row[0] ?? "";
      const value = row[1] ?? "";
      if (!field) continue;
      if (pageName === "Settings") {
        await this.clientManagerPage.verifySettingsField(field, value);
      } else if (pageName === "Time Entry and Approval") {
        await this.clientManagerPage.verifyTimeEntryField(field, value);
      }
    }
  },
);
