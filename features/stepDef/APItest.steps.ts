import { Given, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../utils/CustomWorld';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const API_METHOD_MAP: Record<string, HttpMethod> = {
    getTemps:   'GET',
    getClients: 'GET',
};

Given('the user perform {string} API call with the following details', async function (this: CustomWorld, apiName: string, dataTable: DataTable) {
    const method = API_METHOD_MAP[apiName];
    if (!method) {
        throw new Error(`Unknown API name: '${apiName}'. Add it to API_METHOD_MAP.`);
    }

    const params: Record<string, string> = { action: apiName };
    for (const row of dataTable.raw().slice(1)) {
        const key = row[0] ?? '';
        const value = row[1] ?? '';
        if (value === '<this.tempId>') {
            params[key] = this.tempId ?? '';
        } else if (value === '<this.tempFirstName>') {
            params[key] = this.tempFirstName ?? '';
        } else if (value === '<this.tempEmail>') {
            params[key] = this.tempEmail ?? '';
        } else if (value === '<this.clientId>') {
            params[key] = this.clientId ?? '';
        } else if (value === '<this.clientName>') {
            params[key] = this.clientName ?? '';
        } else {
            params[key] = value;
        }
    }

    this.apiResponse = await this.apiTestPage.callApi(method, params);
});

Then('the API response should contain the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const response = this.apiResponse;
    if (typeof response !== 'object' || response === null) {
        throw new Error('No API response stored — did the previous API step run?');
    }

    let record: Record<string, unknown>;
    if (Array.isArray(response)) {
        const first = response[0];
        record = first !== undefined && typeof first === 'object' && first !== null
            ? (first as Record<string, unknown>)
            : {};
    } else {
        const responseObj = response as Record<string, unknown>;
        const rows = responseObj['rows'];
        const firstRow = Array.isArray(rows) ? rows[0] : undefined;
        record = firstRow !== undefined && typeof firstRow === 'object' && firstRow !== null
            ? (firstRow as Record<string, unknown>)
            : responseObj;
    }

    for (const row of dataTable.raw().slice(1)) {
        const key = row[0] ?? '';
        let expected = row[1] ?? '';

        if (expected === '<this.tempId>') {
            expected = this.tempId ?? '';
        } else if (expected === '<this.tempFirstName>') {
            expected = this.tempFirstName ?? '';
        } else if (expected === '<this.tempEmail>') {
            expected = this.tempEmail ?? '';
        } else if (expected === '<this.clientId>') {
            expected = this.clientId ?? '';
        } else if (expected === '<this.clientName>') {
            expected = this.clientName ?? '';
        }

        const rawValue: unknown = record[key];
        const actual = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
        expect(actual).toBe(expected);
    }
});
