import { Page } from '@playwright/test';
import apiConfig from '../test-data/apiConfig';

export class APItestPage {
    constructor(private page: Page) {}

    async callApi(method: string, params: Record<string, string>): Promise<unknown> {
        const { username, password } = apiConfig.credentials;
        const token = Buffer.from(`${username}:${password}`).toString('base64');

        const origin = new URL(this.page.url()).origin;
        const baseUrl =
            Object.values(apiConfig.baseUrl).find(url => url.startsWith(origin))
            ?? apiConfig.baseUrl.Env_QA;

        const apiUrl = new URL(baseUrl);
        const headers = { Authorization: `Basic ${token}` };

        for (const [key, value] of Object.entries(params)) {
            apiUrl.searchParams.set(key, value);
        }

        const response = method === 'POST'
            ? await this.page.request.post(apiUrl.toString(), { headers })
            : await this.page.request.get(apiUrl.toString(), { headers });

        return response.json() as unknown;
    }
}
