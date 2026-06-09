#!/bin/bash

set -e

WORKFLOW_NAME="Scheduled Playwright Cucumber Tests"
REPORT_DIR="pipeline-report"

echo "Checking gh authentication..."
if ! gh auth status > /dev/null 2>&1; then
  echo "ERROR: gh CLI is not authenticated. Run 'gh auth login' first."
  exit 1
fi

echo "Removing existing pipeline report folder..."
rm -rf "$REPORT_DIR"

echo "Creating pipeline report folder..."
mkdir -p "$REPORT_DIR"

echo "Finding latest completed workflow run..."

RUN_ID=$(gh run list \
  --workflow="$WORKFLOW_NAME" \
  --status completed \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
  echo "ERROR: No completed workflow runs found for '$WORKFLOW_NAME'."
  exit 1
fi

echo "Latest Run ID: $RUN_ID"

echo "Downloading artifacts..."

if ! gh run download "$RUN_ID" --dir "$REPORT_DIR" 2>&1; then
  echo "WARNING: gh run download reported an error. The run may have no artifacts."
fi

echo "Downloaded artifacts:"
ls -1 "$REPORT_DIR" 2>/dev/null || echo "(none)"

echo "Artifacts download step completed."
