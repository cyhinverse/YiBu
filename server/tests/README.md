# Test Structure

This folder is organized by test scope first, then by domain.

## Layout

- `shared/`: reusable test utilities for both unit and integration tests.
- `unit/`: isolated tests for single modules/functions.
- `integration/`: cross-module and router flow tests.

## Unit Convention

- Keep non-module tests by technical area:
  - `unit/helpers`
  - `unit/middlewares`
  - `unit/utils`
  - `unit/validations`
- Keep module tests by feature:
  - `unit/modules/<module>/controller.unit.test.js`
  - `unit/modules/<module>/service.unit.test.js`
  - `unit/modules/<module>/repositories.unit.test.js` (if needed)

## Integration Convention

- Keep entry and end-to-end router flows in `integration/`.
- Put module-focused integration flows in `integration/modules/`.

## Naming

- Use `*.test.js` for all test files.
- Keep suffixes (`unit`, `integration`) in filename when they add clarity.
