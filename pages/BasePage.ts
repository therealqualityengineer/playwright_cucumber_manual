import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
    constructor(protected page: Page) {}

    async navigateTo(path: string): Promise<void> {
        const base = new URL(this.page.url()).origin;
        await this.page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    }

    async selectFromSearchPopup(triggerLocator: Locator, searchText: string): Promise<void> {
        const searchInput = this.page.getByRole('textbox', { name: 'Search for' });
        await triggerLocator.click();
        await searchInput.waitFor({ state: 'visible' });
        await searchInput.fill(searchText);
        await this.page.getByRole('button', { name: 'Search' }).click();
        await this.page.getByRole('listitem').filter({ hasText: searchText }).first().click();
        await this.page.getByRole('button', { name: 'Close' }).click();
        await searchInput.waitFor({ state: 'hidden' });
    }
}
