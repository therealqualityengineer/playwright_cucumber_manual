import { Page, expect } from '@playwright/test';

export class TempManagerPage {
    constructor(private page: Page) {}

    async navigateToNewTemp() {
        const base = new URL(this.page.url()).origin;
        await this.page.goto(`${base}/wfportal/tempview.cfm?newtemp=yes`);
    }

    async createTemp(details: Record<string, string>) {
        for (const [field, value] of Object.entries(details)) {
            await this.fillField(field, value);
        }
        await this.page.getByRole('button', { name: 'Save' }).first().click();
    }

    async waitForTempId(): Promise<string> {
        await this.page.waitForURL(url => !url.href.includes('newtemp=yes'));
        const url = this.page.url();
        const match = url.match(/[Tt]emp[Ii][Dd]=(\d+)/);
        if (!match) {
            throw new Error(`No temp ID found in URL after save: ${url}`);
        }
        return match[1]!;
    }

    private async fillField(field: string, value: string) {
        switch (field) {
            case 'First Name':
                await this.page.getByRole('row', { name: 'First Name' }).getByRole('textbox').fill(value);
                break;
            case 'Last Name':
                await this.page.getByRole('row', { name: 'Last Name' }).getByRole('textbox').fill(value);
                break;
            case 'Primary Email':
                await this.page.getByRole('row', { name: /Primary Email/ }).getByRole('textbox').fill(value);
                break;
            case 'Address':
                await this.page.getByRole('group', { name: 'Permanent Address' }).getByPlaceholder('Enter a location').fill(value);
                break;
            case 'City':
                await this.page.getByRole('group', { name: 'Permanent Address' }).getByRole('row', { name: 'City' }).getByRole('textbox').fill(value);
                break;
            case 'State':
                await this.page.getByRole('group', { name: 'Permanent Address' }).getByRole('row', { name: 'State' }).getByRole('combobox').selectOption(value);
                break;
            case 'ZipCode':
                await this.page.getByRole('group', { name: 'Permanent Address' }).getByRole('row', { name: 'Zip' }).getByRole('textbox').fill(value);
                break;
            case 'Status':
                await this.page.getByRole('row', { name: /^Status/ }).getByRole('combobox').selectOption(value);
                break;
            case 'Region':
                await this.page.getByRole('row', { name: /^Region/ }).getByRole('combobox').selectOption(value);
                break;
            case 'Contract (1099) / EE (W2)':
                await this.page.locator('select[name="contract_or_ee"]').selectOption(value);
                break;
            case 'Certification':
                await this.page.locator('#undefined_certsColumn').getByRole('listitem', { name: value, exact: true }).click();
                break;
            case 'Specialty':
                await this.page.locator('#undefined_specsColumn').getByRole('listitem', { name: value, exact: true }).click();
                break;
        }
    }

    async navigateTo(url : string) {
        const base = new URL(this.page.url()).origin;
        await this.page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded' });
    }

    async addFlatAmounts(pay : string, bill : string){
        await this.page.locator("[name='temppayedit']").first().click();
        await this.page.locator("[name='howpay'][value='flat']").click();
        await this.page.locator("[name='payflat']").fill(pay);
        await this.page.locator("[name='billflat']").fill(bill);
        await this.page.locator("[name='temppayupdate']").first().click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async verifyFlatPayEnabled() {
        const flatPayCell = this.page.getByRole('cell', { name: 'Flat Pay', exact: true });
        await expect(flatPayCell.locator('xpath=following-sibling::td').getByText('Enabled')).toBeVisible();
    }
}
