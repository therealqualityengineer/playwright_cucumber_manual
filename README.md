# Playwright Cucumber Manual

End-to-end test automation framework built with [Playwright](https://playwright.dev/) and [Cucumber](https://cucumber.io/) (BDD), written in TypeScript.

## Tech Stack

- **Playwright** — browser automation
- **Cucumber.js** — BDD test runner with Gherkin feature files
- **TypeScript** — type-safe step definitions and page objects
- **ts-node** — runs TypeScript directly without a build step

## Project Structure

```
features/
  feature/          # Gherkin .feature files
  stepDef/          # Cucumber step definitions
hooks/              # Cucumber hooks (Before/After)
pages/              # Page Object Model classes
test-data/          # Environment URLs and user credentials
utils/              # Shared test utilities
reports/            # Generated HTML test reports
cucumber.js         # Cucumber configuration
tsconfig.json       # TypeScript configuration
```

## Setup

```bash
npm install
```

Install Playwright browsers (first time only):

```bash
npx playwright install
```

## Running Tests

```bash
npm run test
```

## Viewing the Report

After a test run, open the HTML report:

```bash
npm run report
```

## Configuration

### Environments

URLs for each environment are defined in `test-data/env-Data.ts`:

| Key      | Environment |
|----------|-------------|
| Env_QA   | QA          |
| Env_Dev  | Development |
| Env_HF   | Hotfix      |

### Credentials

User accounts are stored in `test-data/users.json`. The `default` key is used when a scenario specifies `'default' credentials`.

## Writing Tests

Feature files go in `features/feature/` using Gherkin syntax. Step definitions go in `features/stepDef/` and use the `CustomWorld` class which exposes a `browser`, `page`, and page object instances.
