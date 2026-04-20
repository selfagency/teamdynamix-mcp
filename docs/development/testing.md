---
title: Testing
---

`teamdynamix-mcp` uses [Vitest](https://vitest.dev/) for unit, integration, and e2e tests.

## Running Tests

```bash
pnpm test              # run all tests once
pnpm test:coverage     # run with coverage report
```

## Test Structure

Tests are organized by layer:

```text
src/
├── services/__tests__/
│   ├── config.validation.test.ts              # Config parsing and validation
│   ├── schemas.test.ts                        # Zod schema contracts
│   ├── teamdynamix.client.service.test.ts     # HTTP client, auth, retry behavior
│   ├── teamdynamix.client.service.extensions.test.ts  # Client extensions and edge cases
│   └── teamdynamix.core.service.test.ts       # Date helpers, patch builder, rate limit parser
└── tools/__tests__/
    ├── teamdynamix.kb.tools.test.ts           # KB tool handlers
    ├── teamdynamix.services.tools.test.ts     # Service catalog tool handlers
    └── teamdynamix.ticket-tasks.tools.test.ts # Ticket task/contact/asset tool handlers

test/
├── integration/
│   ├── teamdynamix.safety.integration.test.ts # Write/admin gate enforcement
│   └── teamdynamix.tools.integration.test.ts  # Tool registration and contract validation
└── e2e/
    └── mcp.e2e.test.ts                        # Full MCP transport smoke test
```

Service tests run without transport concerns. Integration tests validate tool registration and safety gate enforcement. The E2E test spawns the full server and exercises JSON-RPC behavior.

## Writing a Test

### Service test example

```ts
import { describe, expect, it } from 'vitest';
import { toTeamDynamixDateTime } from '../../services/teamdynamix/core.service.js';

describe('toTeamDynamixDateTime', () => {
  it('formats ISO 8601 to TeamDynamix wire format', () => {
    const result = toTeamDynamixDateTime('2026-04-20T12:00:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
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
