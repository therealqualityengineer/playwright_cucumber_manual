import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from './BasePage';

export class ReportManagerPage extends BasePage {
    private readonly tempProfileReportLink = this.page.locator('#Profiles').getByRole('link', { name: 'Temp Profiles', exact: true });
    private readonly tempNameFilterButton = this.page.locator('#tfobj_textItem0');
    private readonly searchInput = this.page.locator('#searchfor');
    private readonly searchButton = this.page.locator('[name="search"]');
    private readonly finderList = this.page.locator('ul.finderSelector li');
    private readonly popupCloseButton = this.page.locator('#PopupID [name="close"]');
    private readonly popupOverlay = this.page.locator('#PopupID');
    private readonly pdfFormatRadio = this.page.locator('#format');
    private readonly submitButton = this.page.locator('#btnSubmit1');

    constructor(page: Page) {
        super(page);
    }

    async navigateToReport(ReportName: string) {
        if (ReportName === 'Temp Profiles') {
            await this.tempProfileReportLink.click();
            await this.page.waitForLoadState('networkidle');
        }
    }

    async generateTempProfilesReport(tempName: string): Promise<string> {
        if (tempName) {
            await this.tempNameFilterButton.click();
            await this.searchInput.fill(tempName);
            await this.searchButton.click();
            await this.finderList.filter({ hasText: tempName }).click();
            await this.popupCloseButton.click();
            await this.popupOverlay.waitFor({ state: 'hidden' });
        }

        await this.pdfFormatRadio.check();

        const downloadPromise = this.page.waitForEvent('download');
        await this.submitButton.click();
        const download = await downloadPromise;

        const filename = download.suggestedFilename();
        const downloadsDir = path.join(process.cwd(), 'downloads');
        fs.mkdirSync(downloadsDir, { recursive: true });
        await download.saveAs(path.join(downloadsDir, filename));

        return filename;
    }

    async verifyDownloadedReport(filePath: string, values: string[]): Promise<void> {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const value of values) {
            if (value) {
                expect(content).toContain(value);
            }
        }
    }
}
