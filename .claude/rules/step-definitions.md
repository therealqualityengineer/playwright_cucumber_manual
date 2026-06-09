---
description: Rules for writing or editing step definition files (.steps.ts). Apply when implementing Given/When/Then handlers, resolving tokens, or working with DataTables.
globs: features/stepDef/**/*.steps.ts
alwaysApply: false
---

# Step Definition Rules

For full authoring procedure, invoke `/cucumber-patterns`.

## File Location

- One `.steps.ts` file per domain entity, in `features/stepDef/` — no subdirectories.
- Name must match the corresponding `.feature` file (e.g., `tempManager.steps.ts`).

## No Duplicate Steps

**Always search before writing a new step:**

```bash
grep -r "Given\|When\|Then" features/stepDef --include="*.steps.ts"
```

If a semantically matching step exists, reuse it — do not create a new one.

## DataTable Pattern

Always use `.raw().slice(1)` to skip the header row:

```typescript
for (const row of dataTable.raw().slice(1)) {
  const field = row[0] ?? '';
  let value = row[1] ?? '';
  // resolve tokens, then assign
}
```

## Token Resolution

Resolve dynamic tokens inline with `if/else` chains — no shared helper. Resolve **before** passing to the page method:

```typescript
if (value === '<RandomEmail>')        value = RandomEmail();
else if (value === '<RandomAlphabets>') value = RandomAlphabets();
else if (value === '<RandomNumbers>')   value = RandomNumbers();
else if (value === '<RandomString>')    value = RandomString();
else if (value.includes('<Today'))      value = ResolveDate(value);
else if (value.startsWith('<this.')) {
  const fieldName = value.slice(6, -1);
  value = String((this as unknown as Record<string, unknown>)[fieldName] ?? '');
}
```

All resolvers are in `test-data/ResolveDynamicData.ts`.

## Type Safety

- `this: CustomWorld` annotation on every step function.
- No `@ts-nocheck`.
- TypeScript strict mode — all optional chaining must handle `undefined`.

## Async Rules

- All `async` calls must be `await`ed — `@typescript-eslint/no-floating-promises` is enforced and will fail lint.
- Do not fire-and-forget page method calls.

## Imports

Standard import block for a new step file:

```typescript
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { CustomWorld } from '../../utils/CustomWorld';
import { MyEntityDetails } from '../../pages/MyEntityPage';
import {
  RandomAlphabets, RandomEmail, RandomNumbers, RandomString, ResolveDate
} from '../../test-data/ResolveDynamicData';
```

## CustomWorld State

Capture IDs and names into `CustomWorld` after entity creation steps so downstream steps can reference them via `<this.*>` tokens. Current state fields: `tempId`, `tempFirstName`, `tempEmail`, `clientId`, `clientName`, `orderId`, `downloadedReportName`, `apiResponse`.

Add new fields to `utils/CustomWorld.ts` if a new entity type is introduced — update both the `ScenarioState` interface and the class body.
