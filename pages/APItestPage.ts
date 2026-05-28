import { Page } from '@playwright/test';
import apiConfig from '../test-data/apiConfig';

export class APItestPage {
    constructor(private page: Page) {}

    async getTemps(params: Record<string, string>): Promise<unknown> {
        const { username, password } = apiConfig.credentials;
        const token = Buffer.from(`${username}:${password}`).toString('base64');

        const origin = new URL(this.page.url()).origin;
        const baseUrl =
            Object.values(apiConfig.baseUrl).find(url => url.startsWith(origin))
            ?? apiConfig.baseUrl.Env_QA;

        const apiUrl = new URL(baseUrl);
        for (const [key, value] of Object.entries(params)) {
            apiUrl.searchParams.set(key, value);
        }

        const response = await this.page.request.get(apiUrl.toString(), {
            headers: { Authorization: `Basic ${token}` }
        });

        return response.json() as unknown;
    }
}
