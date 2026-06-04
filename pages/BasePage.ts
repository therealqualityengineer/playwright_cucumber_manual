import { Page } from '@playwright/test';

export abstract class BasePage {
    constructor(protected page: Page) {}

    async navigateTo(path: string): Promise<void> {
        const base = new URL(this.page.url()).origin;
        await this.page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    }
}
