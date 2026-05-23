import { expect, Page } from '@playwright/test';

export class OrderManagerPage {
    constructor(private page: Page) {}

    async navigateToClassicOrderPage() {
        const base = new URL(this.page.url()).origin;
        await this.page.goto(`${base}/wfportal/ordermanager-legacy.cfm`);
    }

    async createOrder(details: Record<string, string>) {
        const [popup] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.page.getByRole('link', { name: 'New', exact: true }).click()
        ]);
        await popup.waitForLoadState();

        for (const [field, value] of Object.entries(details)) {
            await this.fillField(field, value, popup);
        }

        await popup.locator('input[name="createdone"]').first().click();
        await popup.getByText("Both").first().click();
        await Promise.all([
            popup.waitForEvent('close'),
            popup.locator('#confirmed1').click(),
        ]);
        await this.page.waitForLoadState();
    }

    async waitForOrderId(): Promise<string> {
        await expect(this.page.getByText("Your order has been created.")).toBeVisible();
        const orderId = (await this.page.locator("//td[contains(text(),'Your order has been created.')]/child::a").allTextContents()).toString().trim();
        return orderId;
    }

    private async fillField(field: string, value: string, popup: Page) {
        switch (field) {
            case 'Client':
                await popup.locator('input[name="clientname"]').fill(value);
                await popup.locator('input[name="clientname"]').press('Enter');
                await popup.waitForFunction(
                    () => (document.getElementById('clientid') as HTMLInputElement)?.value !== ''
                );
                break;
            case 'Temp':
                await popup.locator('input[name="tempSelector"]').fill(value);
                await popup.locator('input[name="tempSelector"]').press('Enter');
                await popup.waitForFunction(
                    () => (document.querySelector('input[name="filledby"]') as HTMLInputElement)?.value !== ''
                );
                break;
            case 'Job Date':
                await popup.locator('input[name="jobdatestart_display"]').fill(value);
                break;
            case 'shiftnum':
                await popup.locator('#shiftid').selectOption(value);
                break;
            case 'Order Cert':
                await popup.locator('input[name="certstxt"]').fill(value);
                await popup.getByRole('listitem', { name: value, exact: true }).first().click();
                break;
            case 'Specialty':
                await popup.locator('input[name="specstxt"]').fill(value);
                await popup.getByRole('listitem', { name: value, exact: true }).click();
                break;
        }
    }
}
