---
name: fix-pipeline-failedtest
description: Fix failing tests identified in pipeline-report/Pipeline_Bug_Analysis_Report.md. Applies targeted fixes per issue classification, re-runs impacted scenarios, and produces Pipeline_Fix_Report.md.
allowed-tools: Read, Edit, Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_fill_form, mcp__playwright__browser_take_screenshot
---

# Fix Pipeline Failed Tests

Read the pipeline analysis report, apply the smallest safe fix for each issue, re-run impacted scenarios, and document results.

---

## Step 1 — Read the analysis report

```bash
cat pipeline-report/Pipeline_Bug_Analysis_Report.md
```

If the file does not exist, stop and display:

```
Pipeline_Bug_Analysis_Report.md not found.
Run /pipeline-bug-analysis first to generate it.
```

Parse every **Unique Issue** section. For each issue note:

- Classification
- Affected Scenario names and feature file paths (including line numbers where given)
- Root Cause and Recommendation

Process issues in **Priority Order** as listed in the report (highest affected-scenario count first, then lowest effort).

---

## Step 2 — Apply fixes by classification

Work through each issue one at a time. Use the procedure matching its classification.

---

### 2a — Test Automation Issue

These are mistakes in test code (typos, wrong strings, incorrect assertions) — **not** application bugs.

1. Read the exact file and line from the report (e.g., `features/feature/reportManager.feature:75`).
2. Make the smallest change that matches the recommendation — one line where possible.
3. Do not alter surrounding steps, tags, or unrelated scenarios.
4. Proceed to Step 3 (re-run) immediately after the edit.

**Example** — fixing a typo in a step string:

```gherkin
# Before
Then the report should be downloaded successfully and report name start with 'terofiles'

# After
Then the report should be downloaded successfully and report name start with 'tempprofiles'
```

---

### 2b — Locator Issue

The page object has a selector that no longer matches the live DOM.

1. Note the page class and method identified in the report.
2. Navigate to the relevant app page using Playwright MCP:
   ```
   mcp__playwright__browser_navigate → <app URL for the affected page>
   ```
3. Take a snapshot to inspect the live DOM:
   ```
   mcp__playwright__browser_snapshot
   ```
4. Find the stable selector — prefer `getByRole`, `getByLabel`, `getByPlaceholder` over raw CSS.
5. Update the `private readonly` locator field in the relevant `pages/*Page.ts`.
6. Proceed to Step 3 (re-run).

---

### 2c — Application Defect

The application itself is not behaving as expected (missing toast, wrong text, broken save flow).

1. Reproduce the scenario manually using Playwright MCP:
   - Navigate to the relevant page.
   - Perform the UI action described in the scenario.
   - Take a screenshot and snapshot after the action.
2. Observe what actually happens (e.g., toast text differs, element never appears).
3. Decide:

   | Observation                                                    | Action                                                                                                          |
   | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
   | Toast/message text changed but feature still works             | Update the expected string in the feature file step                                                             |
   | Feature genuinely broken (no feedback, wrong state)            | **Do not change the assertion.** Document the defect in the fix report and mark as "Requires App Team Action"   |
   | Timing issue — element appears but after the assertion timeout | Increase `timeout` in the page method assertion only (e.g., `{ timeout: 10000 }`) — do not remove the assertion |

4. **Never weaken assertions** (removing `.toBeVisible()`, lowering `expect` counts, adding blanket catches) just to make a test pass.

---

### 2d — Synchronization Issue

The test asserts too early — the element eventually appears but the default 5000ms timeout is too short.

1. Read the page method that contains the assertion.
2. Increase the timeout on that specific `expect` call:
   ```typescript
   await expect(this.page.getByText("Success")).toBeVisible({ timeout: 10000 });
   ```
3. Do not add `page.waitForTimeout()` sleeps — use explicit locator waits only.
4. Proceed to Step 3 (re-run).

---

### 2e — Environment Issue / Data Issue / Unknown

1. Do not modify test code.
2. Document the issue in the fix report as "Requires Manual Investigation".
3. Include the error output, screenshot path (if available), and recommended manual steps.
4. Continue to the next issue.

---

## Step 3 — Re-run impacted scenarios

After each fix, run only the affected scenario(s) using the project commands:

```bash
# By scenario name (preferred — most targeted)
npm run name -- "<Scenario name from the report>"

# By file and line number (use when the report includes a line reference)
npm run line -- features/feature/<file>.feature:<line>

# By tag (use when multiple scenarios share a tag and all are affected)
npm run tag -- @<ticketId>
```

Interpret the result:

- **All steps green** → fix is confirmed. Record "Fixed" in the fix report.
- **Same failure** → the fix did not address the root cause. Re-read the report recommendation and re-attempt once. If still failing, mark as "Unresolved — requires human review" and move on.
- **New failure introduced** → the edit had unintended side-effects. Revert the change, mark as "Unresolved", and stop editing that file.

---

## Step 4 — Generate the fix report

Create or overwrite:

```
pipeline-report/Pipeline_Fix_Report.md
```

Use this template:

```markdown
# Pipeline Fix Report

**Analysis Report:** pipeline-report/Pipeline_Bug_Analysis_Report.md
**Generated:** <today's date>
**Branch:** <current branch>

---

## Issue Summary

| #   | Classification | Affected Scenario | Status                          | Notes           |
| --- | -------------- | ----------------- | ------------------------------- | --------------- |
| 1   | <type>         | <scenario name>   | Fixed / Unresolved / App Defect | <one-line note> |

---

## Files Modified

| File                                     | Change                                                        |
| ---------------------------------------- | ------------------------------------------------------------- |
| `features/feature/reportManager.feature` | Line 75: corrected prefix string `terofiles` → `tempprofiles` |

---

## Tests Executed

| Scenario        | Command Used            | Result          |
| --------------- | ----------------------- | --------------- |
| <scenario name> | `npm run name -- "..."` | Passed / Failed |

---

## Execution Results

<Paste the relevant portion of the test runner output for each scenario re-run.>

---

## Remaining Defects

List any issues marked "Unresolved" or "App Defect — requires app team action":

- **<Issue name>** — <reason it was not fixed> — <recommended next step>

---

## Recommended Next Steps

- <action item 1>
- <action item 2>
```

---

## Safety rules

- **Never modify unrelated tests.** Only edit files referenced in the analysis report for the issue being fixed.
- **Never weaken assertions** to force a pass — tightening timeouts is allowed, removing assertions is not.
- **Never fix an Application Defect by changing expected values** unless the recommendation explicitly confirms the new value is correct app behaviour.
- **Stop and request human review** if the root cause is unclear, the fix attempt fails twice, or the recommendation conflicts with project rules.
- **One issue at a time** — complete Step 2 → Step 3 → update fix report before moving to the next issue.
