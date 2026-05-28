import { Given, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../utils/CustomWorld';

Given('the user perform a API call with the following details', async function (this: CustomWorld, dataTable: DataTable) {
    const raw: Record<string, string> = {};

    for (const row of dataTable.raw().slice(1)) {
        const key = row[0] ?? '';
        const value = row[1] ?? '';
        if (value === '<this.tempId>') {
            raw[key] = this.tempId ?? '';
        } else if (value === '<this.tempFirstName>') {
            raw[key] = this.tempFirstName ?? '';
        } else if (value === '<this.tempEmail>') {
            raw[key] = this.tempEmail ?? '';
        } else {
            raw[key] = value;
        }
    }

    const method = raw['Method'] ?? 'GET';
    const action = raw['action'];

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (key !== 'Method') {
            params[key] = value;
        }
    }

    if (method === 'GET' && action === 'getTemps') {
        this.apiResponse = await this.apiTestPage.getTemps(params);
    } else {
        throw new Error(`Unsupported API call: ${method} ${action}`);
    }
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
        }

        const rawValue: unknown = record[key];
        const actual = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
        expect(actual).toBe(expected);
    }
});
