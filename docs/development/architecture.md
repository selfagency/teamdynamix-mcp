---
title: Architecture
---

`mcp-server-template` is structured as a layered TypeScript application. Each layer has a single responsibility, and dependencies only flow downward.

```text
┌─────────────────────────────────────┐
│           MCP Transport             │  src/index.ts
│       (StdioServerTransport)        │
├─────────────────────────────────────┤
│           Tool Handlers             │  src/tools/*.tools.ts
│      (Zod validation, routing)      │
├─────────────────────────────────────┤
│           Services                  │  src/services/*.service.ts
│      (Domain logic, safety)         │
└─────────────────────────────────────┘
```

## Directory Structure

```text
src/
├── index.ts                  # MCP server entry point; registers tools and resources
├── config.ts                 # Environment variable and CLI parsing
├── constants.ts              # Shared constants (character limits, defaults)
├── types.ts                  # Shared TypeScript types and DTOs
├── schemas/                  # Shared Zod schemas
├── tools/
│   └── utility.tools.ts      # Starter utility tool registrations
├── services/
│   ├── utility.service.ts    # Domain/service helpers for starter tools
│   └── __tests__/            # Service unit tests
└── resources/
│   └── template.resources.ts # Starter read-only resources
```

## Layer Responsibilities

### Transport layer (`src/index.ts`)

- Creates the MCP server instance using `@modelcontextprotocol/sdk`
- Registers all tools by importing tool handler groups
- Registers all MCP resources
- Starts `StdioServerTransport`

### Tool handlers (`src/tools/*.tools.ts`)

- Accept raw MCP tool call inputs
- Validate parameters with Zod schemas
- Delegate to the corresponding service function
- Format and return the response
- Keep behavior thin and predictable

### Services (`src/services/*.service.ts`)

- Contain all domain logic
- Enforce safety constraints and truncation behavior
- Return typed DTOs or formatted strings
- **Never import MCP SDK types**

## Schemas

Shared Zod schemas live in `src/schemas/`. Common schemas (response format, path, pagination) are defined once and imported where needed.

## Configuration

`src/config.ts` parses environment variables at startup and exports typed values. Tools import from `config` rather than reading `process.env` directly.

## Response Formatting

All tool responses support two formats:

- `"markdown"` (default) — human-readable output
- `"json"` — a JSON object suitable for programmatic consumption

Formatting helpers are co-located with tool handlers.

## Character Limit

Large outputs are truncated to `CHARACTER_LIMIT` (defined in `src/constants.ts`) to avoid overwhelming MCP clients.

## Error Model

Errors should be returned as structured objects with:

- A human-readable message explaining what went wrong
- Where applicable, guidance on how to resolve the issue

No errors should be swallowed silently.

## Build

```bash
pnpm build       # tsup bundles src/ → dist/
pnpm start       # node dist/index.js
pnpm dev         # tsx watch src/index.ts (hot reload)
pnpm typecheck   # tsc --noEmit
```

`tsup` is configured to target Node.js, produce CJS output, and emit type declarations.
