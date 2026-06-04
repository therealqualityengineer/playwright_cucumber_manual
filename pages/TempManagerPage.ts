import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface TempDetails {
    'First Name': string;
    'Last Name': string;
    'Primary Email': string;
    Address?: string;
    City?: string;
    State?: string;
    ZipCode?: string;
    Status?: string;
    Region?: string;
    'Contract (1099) / EE (W2)'?: string;
    Certification?: string;
    Specialty?: string;
}

const DEFAULT_TEMP_DETAILS: Required<Omit<TempDetails, 'First Name' | 'Last Name' | 'Primary Email'>> = {
    Address: '345 Park Avenue',
    City: 'New York',
    State: 'NY',
    ZipCode: '10154',
    Status: 'Active',
    Region: 'JasonTest',
    'Contract (1099) / EE (W2)': 'EE',
    Certification: 'RN',
    Specialty: 'ER',
};

export class TempManagerPage extends BasePage {
    private readonly firstNameInput = this.page.getByRole('row', { name: 'First Name' }).getByRole('textbox');
    private readonly lastNameInput = this.page.getByRole('row', { name: 'Last Name' }).getByRole('textbox');
    private readonly primaryEmailInput = this.page.getByRole('row', { name: /Primary Email/ }).getByRole('textbox');
    private readonly permanentAddressGroup = this.page.getByRole('group', { name: 'Permanent Address' });
    private readonly permanentAddressInput = this.permanentAddressGroup.getByPlaceholder('Enter a location');
    private readonly permanentCityInput = this.permanentAddressGroup.getByRole('row', { name: 'City' }).getByRole('textbox');
    private readonly permanentStateSelect = this.permanentAddressGroup.getByRole('row', { name: 'State' }).getByRole('combobox');
    private readonly permanentZipInput = this.permanentAddressGroup.getByRole('row', { name: 'Zip' }).getByRole('textbox');
    private readonly statusSelect = this.page.getByRole('row', { name: /^Status/ }).getByRole('combobox');
    private readonly regionSelect = this.page.getByRole('row', { name: /^Region/ }).getByRole('combobox');
    private readonly contractOrEeSelect = this.page.locator('select[name="contract_or_ee"]');
    private readonly certificationColumn = this.page.locator('#undefined_certsColumn');
    private readonly specialtyColumn = this.page.locator('#undefined_specsColumn');
    private readonly tempPayEditButton = this.page.locator("[name='temppayedit']").first();
    private readonly flatPayRadio = this.page.locator("[name='howpay'][value='flat']");
    private readonly payFlatInput = this.page.locator("[name='payflat']");
    private readonly billFlatInput = this.page.locator("[name='billflat']");
    private readonly tempPayUpdateButton = this.page.locator("[name='temppayupdate']").first();
    private readonly flatPayCell = this.page.getByRole('cell', { name: 'Flat Pay', exact: true });

    constructor(page: Page) {
        super(page);
    }

    async navigateToNewTemp() {
        await this.navigateTo('/wfportal/tempview.cfm?newtemp=yes');
    }

    async createTemp(details: TempDetails) {
        const resolved = { ...DEFAULT_TEMP_DETAILS, ...details };
        for (const [field, value] of Object.entries(resolved)) {
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
                await this.firstNameInput.fill(value);
                break;
            case 'Last Name':
                await this.lastNameInput.fill(value);
                break;
            case 'Primary Email':
                await this.primaryEmailInput.fill(value);
                break;
            case 'Address':
                await this.permanentAddressInput.fill(value);
                break;
            case 'City':
                await this.permanentCityInput.fill(value);
                break;
            case 'State':
                await this.permanentStateSelect.selectOption(value);
                break;
            case 'ZipCode':
                await this.permanentZipInput.fill(value);
                break;
            case 'Status':
                await this.statusSelect.selectOption(value);
                break;
            case 'Region':
                await this.regionSelect.selectOption(value);
                break;
            case 'Contract (1099) / EE (W2)':
                await this.contractOrEeSelect.selectOption(value);
                break;
            case 'Certification':
                await this.certificationColumn.getByRole('listitem', { name: value, exact: true }).click();
                break;
            case 'Specialty':
                await this.specialtyColumn.getByRole('listitem', { name: value, exact: true }).click();
                break;
        }
    }

    async addFlatAmounts(pay: string, bill: string) {
        await this.tempPayEditButton.click();
        await this.flatPayRadio.click();
        await this.payFlatInput.fill(pay);
        await this.billFlatInput.fill(bill);
        await this.tempPayUpdateButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async verifyFlatPayEnabled() {
        await expect(this.flatPayCell.locator('xpath=following-sibling::td').getByText('Enabled')).toBeVisible();
    }
}
