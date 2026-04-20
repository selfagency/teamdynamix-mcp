---
title: Architecture
---

`teamdynamix-mcp` follows a layered design:

1. MCP transport bootstrap (`src/index.ts`)
2. Domain gateway handlers (`src/tools/teamdynamix.domain-gateways.tools.ts`)
3. TeamDynamix client/service logic (`src/services/teamdynamix/*.ts`)
4. Shared schemas and types (`src/schemas`, `src/types.ts`)

## Why this layering

- Keeps handlers thin and predictable
- Centralizes TeamDynamix HTTP/auth behavior in one client
- Keeps input contracts explicit and testable via Zod
- Reduces exposed MCP tool surface while retaining full capability via
  domain actions

## Operational consequence

Most documentation drift risk originates at the tool registration layer; docs should be updated immediately when a `registerTool` contract changes.

With the gateway model, documentation drift risk also includes action catalogs
inside each gateway domain. Keep action lists synchronized with
`teamdynamix://capabilities`.

For implementation-level details, see:

- [Development: Architecture](/development/architecture)
