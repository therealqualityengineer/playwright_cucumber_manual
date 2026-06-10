import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface ClientDetails {
  ClientName: string;
  Address?: string;
  City?: string;
  State?: string;
  ZipCode?: string;
  Status?: string;
  Region?: string;
  QuickBooksID?: string;
}

const DEFAULT_CLIENT_DETAILS: Required<Omit<ClientDetails, "ClientName">> = {
  Address: "16801 Addison Road",
  City: "Addison",
  State: "TX",
  ZipCode: "75001",
  Status: "Active",
  Region: "JasonTest",
  QuickBooksID: "10001",
};

export class ClientManagerPage extends BasePage {
  private readonly saveButton = this.page
    .getByRole("button", { name: "Save" })
    .first();
  private readonly clientNameInput = this.page
    .getByRole("row", { name: "Name" })
    .getByRole("textbox");
  private readonly addressInput = this.page.getByRole("textbox", {
    name: "Enter a location",
  });
  private readonly cityInput = this.page
    .getByRole("row", { name: "City" })
    .getByRole("textbox");
  private readonly stateSelect = this.page
    .getByRole("row", { name: "State" })
    .getByRole("combobox");
  private readonly zipInput = this.page
    .getByRole("row", { name: "Zip" })
    .getByRole("textbox");
  private readonly statusSelect = this.page
    .getByRole("row", { name: /^Status/ })
    .getByRole("combobox");
  private readonly regionSelect = this.page
    .getByRole("row", { name: /^Region/ })
    .getByRole("combobox");
  private readonly quickbooksIdInput = this.page
    .getByRole("row", { name: "Quickbooks ID *" })
    .getByRole("textbox");

  // Settings page locators
  private readonly orientationYesRadio = this.page.locator(
    'input[name="RequiresOrientation"][value="1"]',
  );
  private readonly orientationNoRadio = this.page.locator(
    'input[name="RequiresOrientation"][value="0"]',
  );
  private readonly orientWarnRadio = this.page.locator(
    'input[name="OrientWarnRefuse"][value="Warn"]',
  );
  private readonly orientRefuseRadio = this.page.locator(
    'input[name="OrientWarnRefuse"][value="Refuse"]',
  );
  private readonly settingsSaveButton = this.page
    .getByRole("button", { name: "save" })
    .first();

  constructor(page: Page) {
    super(page);
  }

  async navigateToNewClient() {
    await this.navigateTo("/wfportal/clientview.cfm?newclient=yes");
  }

  async createClient(details: ClientDetails) {
    const resolved = { ...DEFAULT_CLIENT_DETAILS, ...details };
    for (const [field, value] of Object.entries(resolved)) {
      await this.fillField(field, value);
    }
    await this.saveButton.click();
  }

  async waitForClientId(): Promise<string> {
    await this.page.waitForURL((url) => !url.href.includes("newclient=yes"));
    const url = this.page.url();
    const match = url.match(/[Cc]lient[Ii][Dd]=(\d+)/);
    if (!match) {
      throw new Error(`No client ID found in URL after save: ${url}`);
    }
    return match[1]!;
  }

  async navigateToProfile(clientId: string): Promise<void> {
    await this.navigateTo(`/wfportal/clientview.cfm?clientid=${clientId}`);
  }

  async openSettingsTab(clientId: string): Promise<void> {
    await this.navigateTo(
      `/wfportal/index2.cfm?action=Clients.ClientSettings&clientid=${clientId}`,
    );
  }

  async setSettingsField(field: string, value: string): Promise<void> {
    switch (field) {
      case "Client Requires Orientation":
        if (value === "Yes") {
          await this.orientationYesRadio.click();
        } else if (value === "No") {
          await this.orientationNoRadio.click();
        }
        break;
      case "On order fill":
        if (value === "Warn") {
          await this.orientWarnRadio.click();
        } else if (value === "Refuse") {
          await this.orientRefuseRadio.click();
        }
        break;
      default:
        throw new Error(`Unknown settings field: "${field}"`);
    }
  }

  async saveSettings(): Promise<void> {
    await this.settingsSaveButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async verifySettingsField(field: string, value: string): Promise<void> {
    switch (field) {
      case "Client Requires Orientation":
        if (value === "Yes") {
          await expect(this.orientationYesRadio).toBeChecked();
        } else if (value === "No") {
          await expect(this.orientationNoRadio).toBeChecked();
        }
        break;
      case "On order fill":
        if (value === "Warn") {
          await expect(this.orientWarnRadio).toBeChecked();
        } else if (value === "Refuse") {
          await expect(this.orientRefuseRadio).toBeChecked();
        }
        break;
      default:
        throw new Error(`Unknown settings field: "${field}"`);
    }
  }

  private async fillField(field: string, value: string) {
    switch (field) {
      case "ClientName":
        await this.clientNameInput.fill(value);
        break;
      case "Address":
        await this.addressInput.fill(value);
        break;
      case "City":
        await this.cityInput.fill(value);
        break;
      case "State":
        await this.stateSelect.selectOption(value);
        break;
      case "ZipCode":
        await this.zipInput.fill(value);
        break;
      case "Status":
        await this.statusSelect.selectOption(value);
        break;
      case "Region":
        await this.regionSelect.selectOption(value);
        break;
      case "QuickBooksID":
        await this.quickbooksIdInput.fill(value);
        break;
      default:
        throw new Error(`Unknown field: "${field}"`);
    }
  }
}
