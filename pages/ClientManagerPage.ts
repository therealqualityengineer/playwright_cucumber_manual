import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

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

const DEFAULT_CLIENT_DETAILS: Required<Omit<ClientDetails, 'ClientName'>> = {
    Address: '16801 Addison Road',
    City: 'Addison',
    State: 'TX',
    ZipCode: '75001',
    Status: 'Active',
    Region: 'JasonTest',
    QuickBooksID: '10001',
};

export class ClientManagerPage extends BasePage {
    private readonly saveButton = this.page.getByRole('button', { name: 'Save' }).first();
    private readonly clientNameInput = this.page.getByRole('row', { name: 'Name' }).getByRole('textbox');
    private readonly addressInput = this.page.getByRole('textbox', { name: 'Enter a location' });
    private readonly cityInput = this.page.getByRole('row', { name: 'City' }).getByRole('textbox');
    private readonly stateSelect = this.page.getByRole('row', { name: 'State' }).getByRole('combobox');
    private readonly zipInput = this.page.getByRole('row', { name: 'Zip' }).getByRole('textbox');
    private readonly statusSelect = this.page.getByRole('row', { name: /^Status/ }).getByRole('combobox');
    private readonly regionSelect = this.page.getByRole('row', { name: /^Region/ }).getByRole('combobox');
    private readonly quickbooksIdInput = this.page.getByRole('row', { name: 'Quickbooks ID *' }).getByRole('textbox');

    constructor(page: Page) {
        super(page);
    }

    async navigateToNewClient() {
        await this.navigateTo('/wfportal/clientview.cfm?newclient=yes');
    }

    async createClient(details: ClientDetails) {
        const resolved = { ...DEFAULT_CLIENT_DETAILS, ...details };
        for (const [field, value] of Object.entries(resolved)) {
            await this.fillField(field, value);
        }
        await this.saveButton.click();
    }

    async waitForClientId(): Promise<string> {
        await this.page.waitForURL(url => !url.href.includes('newclient=yes'));
        const url = this.page.url();
        const match = url.match(/[Cc]lient[Ii][Dd]=(\d+)/);
        if (!match) {
            throw new Error(`No client ID found in URL after save: ${url}`);
        }
        return match[1]!;
    }

    private async fillField(field: string, value: string) {
        switch (field) {
            case 'ClientName':
                await this.clientNameInput.fill(value);
                break;
            case 'Address':
                await this.addressInput.fill(value);
                break;
            case 'City':
                await this.cityInput.fill(value);
                break;
            case 'State':
                await this.stateSelect.selectOption(value);
                break;
            case 'ZipCode':
                await this.zipInput.fill(value);
                break;
            case 'Status':
                await this.statusSelect.selectOption(value);
                break;
            case 'Region':
                await this.regionSelect.selectOption(value);
                break;
            case 'QuickBooksID':
                await this.quickbooksIdInput.fill(value);
                break;
            default:
                throw new Error(`Unknown field: "${field}"`);
        }
    }
}
