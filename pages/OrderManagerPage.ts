import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrderManagerPage extends BasePage {
    private readonly newOrderLink = this.page.getByRole('link', { name: 'New', exact: true });
    private readonly orderCreatedText = this.page.getByText('Your order has been created.');
    private readonly orderIdLink = this.page.locator("//td[contains(text(),'Your order has been created.')]/child::a");

    constructor(page: Page) {
        super(page);
    }

    async navigateToClassicOrderPage() {
        await this.navigateTo('/wfportal/ordermanager-legacy.cfm');
    }

    async createOrder(details: Record<string, string>) {
        const [popup] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.newOrderLink.click()
        ]);
        await popup.waitForLoadState();

        for (const [field, value] of Object.entries(details)) {
            await this.fillField(field, value, popup);
        }

        await popup.locator('input[name="createdone"]').first().click();
        await popup.getByText('Both').first().click();
        await Promise.all([
            popup.waitForEvent('close'),
            popup.locator('#confirmed1').click(),
        ]);
        await this.page.waitForLoadState();
    }

    async waitForOrderId(): Promise<string> {
        await expect(this.orderCreatedText).toBeVisible();
        const orderId = (await this.orderIdLink.allTextContents()).toString().trim();
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
