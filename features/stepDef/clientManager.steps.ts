import { Given, Then, DataTable } from '@cucumber/cucumber';
import { CustomWorld } from '../../utils/CustomWorld';
import { RandomAlphabets, RandomNumbers } from '../../test-data/ResolveDynamicData';

Given('the user create a new client with the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const details: Record<string, string> = {};

    for (const row of dataTable.raw().slice(1)) {
        const field = row[0] ?? '';
        const value = row[1] ?? '';
        if (value === '<RandomAlphabets>') {
            details[field] = RandomAlphabets();
        } else if (value === '<RandomNumbers>') {
            details[field] = RandomNumbers();
        } else {
            details[field] = value;
        }
    }

    await this.clientManagerPage.navigateToNewClient();
    await this.clientManagerPage.createClient(details);
});

Then('the client id should be generated successfully in the url', async function (this: CustomWorld) {
    await this.clientManagerPage.waitForClientId();
});
