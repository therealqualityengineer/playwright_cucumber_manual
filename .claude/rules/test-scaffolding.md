---
description: Rules for scaffolding new test files from a scenario spec. Apply when asked to create a new .feature + .steps.ts pair, or generate test code from a written spec.
alwaysApply: false
---

# Test Scaffolding Rules

For the full step-by-step procedure, invoke `/test-generation`.

## Input Format

Always require or derive this before generating anything:

```
Feature file: features/feature/<domain>.feature
Steps file:   features/stepDef/<domain>.steps.ts
Tag: @<ticketId>
Scenario: <name>
  1. Step description
  2. ...
Notes:
  - <domain-specific overrides>
```

## Notes Field Is Mandatory

**Read `Notes:` before writing a single line of code.** Every rule in `Notes:` overrides the defaults in this procedure. Skipping or skimming `Notes:` is the most common source of incorrect output.

## Step 1: Read Before Writing

Run these before creating any file:

```bash
grep -r "Given\|When\|Then" features/stepDef --include="*.steps.ts"
grep -r "Given\|When\|Then\|And" features/feature --include="*.feature"
```

Also read `utils/CustomWorld.ts` and any relevant `pages/*Page.ts` to understand existing state fields.

## Step 2: Reuse Existing Steps

Canonical reusable steps (always prefer over writing new ones):

| Step | Purpose |
|------|---------|
| `Given the user login to the application {string} with {string} credentials` | Login — always in Background |
| `And the user create a new temp with the following details` | Create temp |
| `Then the temp id should be generated successfully in the url` | Capture temp ID |
| `And the user create a new client with the following details` | Create client |
| `Then the client id should be generated successfully in the url` | Capture client ID |
| `And the user create a new order with the following details` | Create order |
| `Then the order id should be generated successfully` | Capture order ID |

Only write a new step definition if no canonical or existing step matches.

## Step 3: File Placement

- Feature file: `features/feature/<domain>.feature` — no subdirectories
- Steps file: `features/stepDef/<domain>.steps.ts` — no subdirectories
- Page class (if new domain): `pages/<DomainName>Page.ts`

## Step 4: After Writing — Run and Verify

```bash
npm run name -- "<Scenario name here>"
```

- All steps green → done, report step count.
- Any step fails → use Playwright MCP (`mcp__playwright__browser_snapshot`) to inspect the live DOM, fix the locator, and re-run.

## Step 5: Report Output

State clearly: which files were created, which existing steps were reused, which new steps were added, any `CustomWorld` or `API_METHOD_MAP` changes.
