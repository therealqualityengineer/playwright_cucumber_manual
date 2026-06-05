import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from './BasePage';

export interface ReportFilters {
    tempName?: string;
    certification?: string;
    clientName?: string;
}

export class ReportManagerPage extends BasePage {
    private readonly tempFilterButton = this.page.locator('#tfobj_textItem0');
    private readonly clientFilterButton = this.page.locator('#cfobj_textItem0');

    // Certification popup — scoped by its unique cert search input
    private readonly certificationFilterButton = this.page.locator('#csf_cert_list li').first();
    private readonly certSearchInput = this.page.locator('#certstxt');
    private readonly certFinderList = this.page.locator('#undefined_certsColumn ul li.zuiBtn');
    private readonly certPopupCloseButton = this.page.locator('#PopupID').filter({ has: this.page.locator('#certstxt') }).locator('.CloseBtn');

    private readonly pdfFormatRadio = this.page.locator('#format');
    private readonly submitButton = this.page.locator('#btnSubmit1');
    private readonly runReportButton = this.page.getByRole('button', { name: 'Run Report' });

    constructor(page: Page) {
        super(page);
    }

    async navigateToReport(reportName: string): Promise<void> {
        await this.page.locator('#Profiles').getByRole('link', { name: reportName, exact: true }).click();
        await this.page.waitForLoadState('networkidle');
    }

    async generateReport(filters: ReportFilters): Promise<string> {
        if (filters.tempName) {
            await this.selectFromSearchPopup(this.tempFilterButton, filters.tempName);
        }
        if (filters.certification) {
            await this.selectCertificationFilter(filters.certification);
        }
        if (filters.clientName) {
            await this.selectFromSearchPopup(this.clientFilterButton, filters.clientName);
            return this.downloadClientReport();
        }
        return this.downloadReport();
    }

    private async selectCertificationFilter(certification: string): Promise<void> {
        await this.certificationFilterButton.click();
        await this.certSearchInput.waitFor({ state: 'visible' });
        await this.certSearchInput.pressSequentially(certification);
        await this.certFinderList.getByText(certification, { exact: true }).first().click();
        await this.certPopupCloseButton.click();
        await this.certSearchInput.waitFor({ state: 'hidden' });
    }

    private async downloadClientReport(): Promise<string> {
        const newPagePromise = this.page.context().waitForEvent('page');
        await this.runReportButton.last().click();
        const newPage = await newPagePromise;
        await newPage.waitForLoadState('networkidle');
        const downloadPromise = newPage.waitForEvent('download');
        await newPage.getByRole('link', { name: 'Export to Excel' }).click();
        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        const downloadsDir = path.join(process.cwd(), 'downloads');
        fs.mkdirSync(downloadsDir, { recursive: true });
        await download.saveAs(path.join(downloadsDir, filename));
        return filename;
    }

    private async downloadReport(): Promise<string> {
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
