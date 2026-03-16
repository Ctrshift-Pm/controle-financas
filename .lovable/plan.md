

## Problem: Massive Duplication of Recurring Expenses

The `syncRecurringToExpenses` runs inside a `useEffect` that depends on `[reminders, allExpenses]`. Every time it creates a new expense, the realtime subscription refreshes `allExpenses`, which re-triggers the effect. This creates an infinite loop where the same "Imposto Nota Fiscal" entry gets inserted hundreds of times (visible in the network logs).

The duplicate check (`expenses.some(...)`) uses the stale `allExpenses` from the previous render, so newly created items aren't seen yet when the next iteration runs.

## Root Cause

- **Race condition**: Effect fires -> inserts expense -> realtime triggers refresh -> `allExpenses` updates -> effect fires again -> the freshly inserted item may not yet be in the new `allExpenses` snapshot -> inserts again.
- The `description` check compares `r.label` against `e.description`, but the recurring reminders use labels like "Contador" while descriptions like "Imposto Nota Fiscal" differ -- so the match fails and duplicates are created.

## Plan

### Step 1: Clean up duplicate expenses from the database
- Run a SQL migration to delete all duplicate `recorrente-auto` expenses, keeping only one per `description` per month.

### Step 2: Fix the sync logic in `RecurringReminders.tsx`
- Add a `useRef` flag (`syncingRef`) to prevent concurrent/repeated syncs within the same render cycle.
- Add a `localStorage` key (`recurring-sync-month`) to ensure sync only runs **once per month**, not on every render.
- Move the duplicate check to query the DB directly inside `syncRecurringToExpenses` (fresh query per reminder) instead of relying on the stale `allExpenses` prop.
- Remove `allExpenses` from the `useEffect` dependency array to break the infinite loop.
- Ensure the `description` field matches `r.label` exactly so the existence check works.

### Step 3: Ensure the DEFAULT_RECURRING labels match what gets stored
- Verify that the `description` field stored in expenses matches `r.label` from the recurring reminders (e.g., "Contador", "Imposto da Nota (6%)", etc.) so the dedup check works correctly.

### Files to modify:
1. **New migration** -- DELETE duplicate `recorrente-auto` rows
2. **`src/components/RecurringReminders.tsx`** -- Fix the sync logic with ref guard + localStorage month check + direct DB query for existence

