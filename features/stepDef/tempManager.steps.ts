import { Given, Then, DataTable } from '@cucumber/cucumber';
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
