import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class ReportManagerPage {
    private TempProfileReportLink;

    constructor(private page: Page) {
        this.TempProfileReportLink = this.page.locator('#Profiles').getByRole('link', { name: 'Temp Profiles', exact: true });
    }

    async navigateToReport(ReportName: string) {
        if (ReportName === 'Temp Profiles') {
            await this.TempProfileReportLink.click();
            await this.page.waitForLoadState('networkidle');
        }
    }

    async generateTempProfilesReport(tempName: string): Promise<string> {
        if (tempName) {
            await this.page.locator('#tfobj_textItem0').click();
            await this.page.locator('#searchfor').fill(tempName);
            await this.page.locator('[name="search"]').click();
            await this.page.locator('ul.finderSelector li').filter({ hasText: tempName }).click();
            await this.page.locator('#PopupID [name="close"]').click();
            await this.page.locator('#PopupID').waitFor({ state: 'hidden' });
        }

        await this.page.locator('#format').check();

        const downloadPromise = this.page.waitForEvent('download');
        await this.page.locator('#btnSubmit1').click();
        const download = await downloadPromise;

        const filename = download.suggestedFilename();
        const downloadsDir = path.join(process.cwd(), 'downloads');
        fs.mkdirSync(downloadsDir, { recursive: true });
        await download.saveAs(path.join(downloadsDir, filename));

        return filename;
    }
}
