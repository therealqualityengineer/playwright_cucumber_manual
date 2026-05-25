import { When, Then, DataTable } from '@cucumber/cucumber'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { expect } from '@playwright/test';
import { CustomWorld } from '../../utils/CustomWorld';

When('the user navigate to the {string} section', async function (this: CustomWorld, section: string) {
    await this.loginPage.navigateToSection(section);
})

Then('the user generate the {string} report with the following details', async function (this: CustomWorld, reportType: string, dataTable: DataTable) {
    const data = dataTable.rowsHash();
    const rawTempName = data['Temp Name'] ?? '';
    const tempName = rawTempName === '<tempFirstName>' ? (this.tempFirstName ?? '') : rawTempName;

    await this.reportManagerPage.navigateToReport(reportType);
    this.downloadedReportName = await this.reportManagerPage.generateTempProfilesReport(tempName);
})

Then('the report should be downloaded successfully and report name start with {string}', async function (this: CustomWorld, prefix: string) {
    expect(this.downloadedReportName).toBeDefined();
    expect(this.downloadedReportName!.toLowerCase()).toMatch(new RegExp(`^${prefix.toLowerCase()}`));
})
