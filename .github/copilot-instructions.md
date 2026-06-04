# Copilot Instructions — Playwright + Cucumber Test Framework

**Stack**: Playwright + Cucumber (Gherkin) + TypeScript

For detailed patterns and procedures see [CLAUDE.md](../CLAUDE.md) and [.instructions.md](../.instructions.md).

---

## Test Structure

Tests are organized as **feature + steps pairs** under `features/`:

```
features/feature/<name>.feature       # Gherkin scenarios
features/stepDef/<name>.steps.ts      # Step implementations (1 file per feature)
pages/<Name>Page.ts                   # Page Object class (1 per domain entity)
```

Each domain entity (e.g. `tempManager`) gets exactly one file in each directory. No subdirectories.

---

## Page Object Model

- All page classes extend `BasePage` (`pages/BasePage.ts`)
- Use **role-based locators only** — `getByRole`, `getByPlaceholder`, `getByLabel`. Never CSS selectors or XPath
- Each page exports a `*Details` interface (required identity fields + optional defaultable fields) and a `DEFAULT_*_DETAILS` constant covering all optional fields
- A private `fillField(field, value)` method maps DataTable field names to locators via a `switch`; it throws on unknown fields

See [pages/TempManagerPage.ts](../pages/TempManagerPage.ts) as the canonical example.

---

## Step Definition Mapping

**One Gherkin step text maps to exactly one step definition. Never duplicate a step.**

- One step file per feature file, accessing page objects via `CustomWorld` properties
- Resolve dynamic placeholders (`<RandomAlphabets>`, `<RandomEmail>`, `<Today+N>`, `<this.fieldName>`, etc.) **in step code** before passing values to page methods — the page layer only receives concrete values
- Capture scenario-level state on `CustomWorld` (`this.tempId`, `this.clientName`, etc.) to share values between steps

See [utils/CustomWorld.ts](../utils/CustomWorld.ts) for the `PageObjects` and `ScenarioState` interfaces.

---

## Credentials & Environments

- **Never hardcode credentials per scenario.** All credentials live in [test-data/users.json](../test-data/users.json); environment URLs in [test-data/env-Data.ts](../test-data/env-Data.ts)
- Every feature uses a parameterized `Background` login step:

  ```gherkin
  Background:
    Given the user login to the application 'Env_QA' with 'testuser_01' credentials
  ```

- The step resolves the URL and credentials from config — never embed them in scenario text

---

## Tags

Every scenario must carry at least one tag:

| Tag | Purpose |
|-----|---------|
| `@smoke` | Critical path, fast subset |
| `@regression` | Full regression suite |
| `@api` | API tests via ClearConnect |
| `@<ticketId>` | Ticket-level targeting (e.g. `@23455`) |
