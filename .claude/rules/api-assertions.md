---
description: Rules for writing API-based assertions against the ClearConnect backend. Apply when adding Then/And assertion steps, verifying backend state after UI actions, or writing @api-tagged scenarios.
globs: features/stepDef/APItest.steps.ts, features/feature/APItest.feature
alwaysApply: false
---

# API Assertion Rules

For full patterns and examples, invoke `/api-test`.

## When to Use API Assertions

Prefer API assertions over UI checks for:
- Verifying a resource was persisted after UI creation
- Checking multiple fields at once (no need to wait for UI elements)
- `@api`-tagged scenarios that bypass the UI entirely

## Register the API Action First

Before writing a scenario, add the action to `API_METHOD_MAP` in `features/stepDef/APItest.steps.ts`:

```typescript
const API_METHOD_MAP: Record<string, HttpMethod> = {
  getTemps:   'GET',
  getClients: 'GET',
  myNewAction: 'GET',   // ← add here
};
```

The action key must match the API `action` parameter exactly.

## Use Generic Steps — No New Step Definitions Needed

```gherkin
Given the user perform 'getInvoices' API call with the following details
  | Key      | Value           |
  | clientId | <this.clientId> |

Then the API response should contain the following details
  | Key    | Value |
  | status | Active |
```

The generic steps handle token resolution and field assertion. Only write a custom step if the generic ones cannot express the assertion.

## DataTable Format for API Steps

- Header row: `| Key | Value |`
- `<this.*>` tokens are resolved from `CustomWorld` state at step execution time.
- Always include `slice(1)` in any custom step to skip the header.

## Response Structure

The assertion step handles three shapes automatically:
- **Array**: `[{ ... }, ...]` — asserts against `[0]`
- **Paginated**: `{ rows: [{ ... }] }` — asserts against `rows[0]`
- **Plain object**: `{ key: value }` — asserts directly

If a custom response shape is needed, write a bespoke `Then` step that reads `this.apiResponse`.

## Auth & Base URL

Configured in `test-data/apiConfig.ts` — never hardcode credentials or API base URLs in step files.
Path template: `/wfportal/clearConnect/2_0/?action=<actionName>&<params>`

## Checklist

- [ ] API action registered in `API_METHOD_MAP`
- [ ] Scenario tagged `@api`
- [ ] DataTable uses `| Key | Value |` header
- [ ] `<this.*>` tokens match declared `CustomWorld` state fields
- [ ] No hardcoded credentials or URLs
