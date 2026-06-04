import { When, Then, DataTable } from '@cucumber/cucumber'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { expect } from '@playwright/test';
import * as path from 'path';
import { CustomWorld } from '../../utils/CustomWorld';

When('the user navigate to the {string} section', async function (this: CustomWorld, section: string) {
    await this.loginPage.navigateToSection(section);
})

Then('the user generate the {string} report with the following details', async function (this: CustomWorld, reportType: string, dataTable: DataTable) {
    const data = dataTable.rowsHash();
    const rawTempName = data['Temp Name'] ?? '';
    const tempName = rawTempName === '<tempFirstName>' ? (this.tempFirstName ?? '') : rawTempName;
    const certification = data['Certification'] ?? '';

    await this.reportManagerPage.navigateToReport(reportType);
    this.downloadedReportName = await this.reportManagerPage.generateReport({ tempName, certification });
})

Then('the report should be downloaded successfully and report name start with {string}', async function (this: CustomWorld, prefix: string) {
    expect(this.downloadedReportName).toBeDefined();
    expect(this.downloadedReportName!.toLowerCase()).toMatch(new RegExp(`^${prefix.toLowerCase()}`));
})

Then('the user open the downloaded report and verify the temp details in the report with the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const rawValues = dataTable.raw().slice(1).map(row => row[0] ?? '');
    const values = rawValues.map(v => {
        if (v === '<tempFirstName>') return this.tempFirstName ?? '';
        if (v === '<tempEmail>') return this.tempEmail ?? '';
        return v;
    });

    const filePath = path.join(process.cwd(), 'downloads', this.downloadedReportName!);
    await this.reportManagerPage.verifyDownloadedReport(filePath, values);
})
