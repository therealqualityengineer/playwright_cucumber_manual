import { Given, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../utils/CustomWorld";
import { resolvePlaceholder } from "../../utils/resolvePlaceholder";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const API_METHOD_MAP: Record<string, HttpMethod> = {
  getTemps: "GET",
  getClients: "GET",
};

Given(
  "the user perform {string} API call with the following details",
  async function (this: CustomWorld, apiName: string, dataTable: DataTable) {
    const method = API_METHOD_MAP[apiName];
    if (!method) {
      throw new Error(
        `Unknown API name: '${apiName}'. Add it to API_METHOD_MAP.`,
      );
    }

    const params: Record<string, string> = { action: apiName };
    for (const row of dataTable.raw().slice(1)) {
      params[row[0] ?? ""] = resolvePlaceholder(row[1] ?? "", this);
    }

    this.apiResponse = await this.apiTestPage.callApi(method, params);
  },
);

Then(
  "the API response should contain the following details",
  async function (this: CustomWorld, dataTable: DataTable) {
    const response = this.apiResponse;
    if (typeof response !== "object" || response === null) {
      throw new Error(
        "No API response stored — did the previous API step run?",
      );
    }

    let record: Record<string, unknown>;
    if (Array.isArray(response)) {
      const first = response[0];
      record =
        first !== undefined && typeof first === "object" && first !== null
          ? (first as Record<string, unknown>)
          : {};
    } else {
      const responseObj = response as Record<string, unknown>;
      const rows = responseObj["rows"];
      const firstRow = Array.isArray(rows) ? rows[0] : undefined;
      record =
        firstRow !== undefined &&
        typeof firstRow === "object" &&
        firstRow !== null
          ? (firstRow as Record<string, unknown>)
          : responseObj;
    }

    for (const row of dataTable.raw().slice(1)) {
      const key = row[0] ?? "";
      const expected = resolvePlaceholder(row[1] ?? "", this);

      const rawValue: unknown = record[key];
      const actual =
        rawValue !== null && rawValue !== undefined ? String(rawValue) : "";
      expect(actual).toBe(expected);
    }
  },
);
