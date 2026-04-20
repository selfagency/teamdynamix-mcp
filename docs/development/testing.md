---
title: Testing
---

`mcp-server-template` uses [Vitest](https://vitest.dev/) for unit, integration, and e2e tests.

## Running Tests

```bash
pnpm test              # run all tests once
pnpm test:coverage     # run with coverage report
```

## Test Structure

Tests are organized by layer:

```text
src/services/__tests__/
└── utility.service.test.ts

test/
├── integration/
│   └── mcp.tools.integration.test.ts
└── e2e/
    └── mcp.e2e.test.ts
```

Service tests run without transport concerns. Integration tests validate tool registration and structured responses. E2E tests spawn the server and exercise JSON-RPC behavior.

## Writing a Test

### Service test example

```ts
import { describe, expect, it } from 'vitest';
import { transformText } from '../utility.service.js';

describe('transformText', () => {
  it('creates slug output', () => {
    const result = transformText('Hello MCP', 'slug');
    expect(result.transformed).toBe('hello-mcp');
  });
});
```

## What to Test

Cover these scenarios for every service function:

- Happy path: normal inputs with expected structured outputs.
- Boundary values: very short/long text and truncation behavior.
- Validation errors: invalid modes or missing required arguments.
- Error handling: service failures returned as tool-level errors.
- E2E behavior: server startup, initialize handshake, and tool calls.

## Coverage

Run `pnpm test:coverage` to generate a V8 coverage report. The report is written to `coverage/`. Aim for high branch coverage on safety-critical code paths (reset modes, force flags, confirmation checks).

## Integration Tests

Integration and e2e tests in `test/` verify transport-level behavior and tool contracts.
