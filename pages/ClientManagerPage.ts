import { Page } from '@playwright/test';

export class ClientManagerPage {
    constructor(private page: Page) {}

    async navigateToNewClient() {
        const base = new URL(this.page.url()).origin;
        await this.page.goto(`${base}/wfportal/clientview.cfm?newclient=yes`);
    }

    async createClient(details: Record<string, string>) {
        for (const [field, value] of Object.entries(details)) {
            await this.fillField(field, value);
        }
        await this.page.getByRole('button', { name: 'Save' }).first().click();
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
                await this.page.getByRole('row', { name: 'Name' }).getByRole('textbox').fill(value);
                break;
            case 'Address':
                await this.page.getByRole('textbox', { name: 'Enter a location' }).fill(value);
                break;
            case 'City':
                await this.page.getByRole('row', { name: 'City' }).getByRole('textbox').fill(value);
                break;
            case 'State':
                await this.page.getByRole('row', { name: 'State' }).getByRole('combobox').selectOption(value);
                break;
            case 'ZipCode':
                await this.page.getByRole('row', { name: 'Zip' }).getByRole('textbox').fill(value);
                break;
            case 'Status':
                await this.page.getByRole('row', { name: /^Status/ }).getByRole('combobox').selectOption(value);
                break;
            case 'Region':
                await this.page.getByRole('row', { name: /^Region/ }).getByRole('combobox').selectOption(value);
                break;
            case 'QuickBooksID':
                await this.page.getByRole('row', { name: /Quickbooks ID/ }).getByRole('textbox').fill(value);
                break;
        }
    }
}
