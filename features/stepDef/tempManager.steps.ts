import { Given, Then, When, DataTable } from '@cucumber/cucumber';
import { CustomWorld } from '../../utils/CustomWorld';
import { RandomAlphabets, RandomNumbers, RandomEmail } from '../../test-data/ResolveDynamicData';
import { TempDetails } from '../../pages/TempManagerPage';

Given('the user create a new temp with the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const details: Partial<TempDetails> = {};

    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        const value = row[1] ?? '';
        if (value === '<RandomAlphabets>') {
            details[field as keyof TempDetails] = RandomAlphabets();
        } else if (value === '<RandomNumbers>') {
            details[field as keyof TempDetails] = RandomNumbers();
        } else if (value === '<RandomEmail>') {
            details[field as keyof TempDetails] = RandomEmail();
        } else {
            details[field as keyof TempDetails] = value;
        }
    }

    const tempFirstName = details['First Name'];
    if (tempFirstName !== undefined) this.tempFirstName = tempFirstName;

    const tempEmail = details['Primary Email'];
    if (tempEmail !== undefined) this.tempEmail = tempEmail;

    console.log("Temp First Name:", this.tempFirstName)
    await this.tempManagerPage.navigateToNewTemp();
    await this.tempManagerPage.createTemp(details as TempDetails);
});

Then('the temp id should be generated successfully in the url', async function (this: CustomWorld) {
    this.tempId = await this.tempManagerPage.waitForTempId();
    console.log("Temp ID:", this.tempId)
});

Given('the user added the Flat pay of {string} and {string} to Pay and Bill amounts', async function (this: CustomWorld, pay : string, bill : string) {
    await this.tempManagerPage.navigateTo(`/wfportal/temppay.cfm?tempid=${this.tempId}`);
    await this.tempManagerPage.addFlatAmounts(pay,bill);
})

Then('the user verifies Flat Pay enabled', async function (this: CustomWorld) {
    await this.tempManagerPage.verifyFlatPayEnabled();
})

When('the user opens the {string} profile page', async function (this: CustomWorld, profileType: string) {
    if (profileType === 'temp') {
        await this.tempManagerPage.navigateToProfile(this.tempId ?? '');
    }
})

Given('the user opens the {string} tab and applies the following filters', async function (this: CustomWorld, tab: string, dataTable: DataTable) {
    if (tab === 'Facilities') {
        await this.tempManagerPage.openFacilitiesTab();
    }
    const filters: Record<string, string> = {};
    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        let value = row[1] ?? '';
        if (value === '<this.clientName>') {
            value = this.clientName ?? '';
        }
        filters[field] = value;
    }
    await this.tempManagerPage.applyFacilitiesFilters(filters);
})

Given('the user sets the following status on the Facilities page', async function (this: CustomWorld, dataTable: DataTable) {
    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        const value = row[1] ?? '';
        await this.tempManagerPage.setFacilitiesStatus(field, value);
    }
})

Then('the user verifies the {string} message', async function (this: CustomWorld, message: string) {
    await this.tempManagerPage.verifyMessage(message);
})

Then('the user verifies that the following status is set on the {string} page', async function (this: CustomWorld, _page: string, dataTable: DataTable) {
    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        const status = row[1] ?? '';
        await this.tempManagerPage.verifyFacilitiesStatus(field, status);
    }
})
