# Pipeline Bug Analysis

When invoked, perform the following steps.

## Step 1 – Refresh artifacts

Execute:

```bash
./scripts/download-pipeline-report.sh
```

If execution fails:

- If the error contains `not authenticated` → stop and display: `gh CLI is not authenticated. Run 'gh auth login' and retry.`
- If the error contains `No completed workflow runs` → stop and display the reason.
- For any other error → stop and display the full error output.

---

## Step 2 – Validate artifacts

Verify that `pipeline-report/` exists and contains at least one subdirectory or file.

If the folder is empty or missing, display:

```text
No artifacts were found for the latest GitHub Actions workflow run.
Please verify artifact upload configuration in the workflow.
```

Then stop.

---

## Step 3 – Analyze failures

Search recursively within `pipeline-report/` for:

- `allure-results/` — JSON result files per step
- `allure-report/` — generated HTML report
- `screenshots/` — PNG captures on failure
- `logs/` — console or runner log files
- cucumber JSON/HTML reports
- `traces/` — Playwright `.zip` trace files
- `videos/` — `.webm` recordings

Determine:

- Total executed tests
- Passed tests
- Failed tests
- Skipped tests

---

## Step 4 – Root cause analysis

For each failed scenario:

- Determine failure reason from allure result JSON or cucumber report.
- Review any matching screenshot.
- Review any matching log output.
- Review any matching trace file name.

Group failures that share the same underlying issue. Each group becomes one **Unique Issue** (used in Step 6 summary count).

Classify each issue as one of:

- Application Defect
- Locator Issue
- Synchronization Issue
- Environment Issue
- Data Issue
- Test Automation Issue
- Unknown

---

## Step 5 – Generate report

Create:

```text
pipeline-report/Pipeline_Bug_Analysis_Report.md
```

The report must contain:

- **Execution Summary** — total, passed, failed, skipped counts
- **Failure Statistics** — failure rate percentage
- **Unique Issues** — one section per group from Step 4, each with:
  - Classification
  - Affected Scenarios (list)
  - Evidence (screenshot path, log excerpt, or trace filename)
  - Root Cause
  - Recommendation
- **Priority Order** — issues ranked by number of affected scenarios (highest first)

---

## Step 6 – Display summary

Display:

```text
Pipeline Bug Analysis completed.

Report generated:
pipeline-report/Pipeline_Bug_Analysis_Report.md
```

Include:

- Total Executed
- Passed
- Failed
- Unique Issues (count of groups identified in Step 4)
