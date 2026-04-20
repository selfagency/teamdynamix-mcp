---
title: Architecture
---

`teamdynamix-mcp` follows a layered design:

1. MCP transport bootstrap (`src/index.ts`)
2. Tool handlers (`src/tools/*.tools.ts`)
3. TeamDynamix client/service logic (`src/services/teamdynamix/*.ts`)
4. Shared schemas and types (`src/schemas`, `src/types.ts`)

## Why this layering

- Keeps handlers thin and predictable
- Centralizes TeamDynamix HTTP/auth behavior in one client
- Keeps input contracts explicit and testable via Zod
- Improves maintainability as tool surface expands

## Operational consequence

Most documentation drift risk originates at the tool registration layer; docs should be updated immediately when a `registerTool` contract changes.

For implementation-level details, see:

- [Development: Architecture](/development/architecture)
