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

    // Facilities tab locators
    private readonly facilitiesTabLink = this.page.getByRole('link', { name: 'Facilities' });
    private readonly selectClientsItem = this.page.getByText('Select Clients', { exact: true });
    private readonly facilitiesRegionSelect = this.page.locator('select[name="search_region"]');
    private readonly facilitiesFilterButton = this.page.locator('#btnSubmit');
    private readonly orientedCheckbox = this.page.locator('input[name="Oriented"]').first();
    private readonly preferredRadio = this.page.locator('input[name^="status_"][value="1"]').first();
    private readonly facilitiesSaveButton = this.page.getByRole('button', { name: 'save' }).first();

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

    async navigateToProfile(tempId: string) {
        await this.navigateTo(`/wfportal/tempview.cfm?tempid=${tempId}`);
    }

    async openFacilitiesTab() {
        await this.facilitiesTabLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async applyFacilitiesFilters(filters: Record<string, string>) {
        for (const [field, value] of Object.entries(filters)) {
            if (field === 'ClientName') {
                await this.selectFromSearchPopup(this.selectClientsItem, value);
            } else if (field === 'Region') {
                await this.facilitiesRegionSelect.selectOption(value);
            }
        }
        await this.facilitiesFilterButton.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async setFacilitiesStatus(field: string, value: string) {
        if (field === 'Oriented' && value === 'Check') {
            await this.orientedCheckbox.check();
        } else if (field === 'Preferred' && value === 'Select') {
            await this.preferredRadio.click();
        }
        await this.facilitiesSaveButton.click();
        await this.page.waitForLoadState('networkidle');
    }

    async verifyMessage(message: string) {
        await expect(this.page.getByText(message)).toBeVisible();
    }

    async verifyFacilitiesStatus(field: string, status: string) {
        if (field === 'Oriented' && status === 'Checked') {
            await expect(this.orientedCheckbox).toBeChecked();
        } else if (field === 'Preferred' && status === 'Selected') {
            await expect(this.preferredRadio).toBeChecked();
        }
    }

    async verifyDrivingDistanceBetween(type: string, minMiles: number, maxMiles: number): Promise<void> {
        if (type === 'Permanent') {
            const getLink = this.page.locator('a[id^="getDrivingDistance_"]').first();
            await getLink.click();
            const distanceCell = this.page.locator('td').filter({ hasText: /Distance:\s*\d+\s*miles/ }).first();
            await distanceCell.waitFor({ state: 'visible' });
            const text = await distanceCell.textContent() ?? '';
            const match = text.match(/Distance:\s*(\d+)\s*miles/);
            if (!match?.[1]) throw new Error(`Could not parse driving distance from cell: "${text}"`);
            const miles = parseInt(match[1], 10);
            expect(miles).toBeGreaterThanOrEqual(minMiles);
            expect(miles).toBeLessThanOrEqual(maxMiles);
        }
    }
}
