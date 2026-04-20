---
title: Architecture
---

`teamdynamix-mcp` is a layered TypeScript MCP server. Each layer has a single responsibility; dependencies only flow downward.

```text
┌──────────────────────────────────────────────────────────────┐
│                     MCP Transport                            │  src/index.ts
│               (StdioServerTransport)                         │
├──────────────────────────────────────────────────────────────┤
│                    Tool Handlers                             │  src/tools/*.tools.ts
│      (Gateway action validation, safety guards, routing)     │
├──────────────────────────────────────────────────────────────┤
│             TeamDynamixClient (HTTP + auth)                  │  src/services/teamdynamix/client.service.ts
│          Core helpers (dates, patch, rate limit)             │  src/services/teamdynamix/core.service.ts
└──────────────────────────────────────────────────────────────┘
```

## Directory Structure

```text
src/
├── index.ts                         # MCP entry point — registers all gateway tool families
├── config.ts                        # TeamDynamix + MCP env var parsing
├── constants.ts                     # Shared constants (tool prefix, character limits)
├── types.ts                         # Shared TypeScript types (auth config, request options)
├── schemas/
│   └── teamdynamix/index.ts         # All Zod input schemas (tickets, KB, assets, CI, projects …)
├── tools/
│   ├── teamdynamix.domain-gateways.tools.ts  # Domain gateway registrations + action routing
│   ├── teamdynamix.discovery.tools.ts        # Legacy direct tool module (kept for compatibility tests)
│   ├── teamdynamix.tickets.tools.ts          # Legacy direct tool module
│   ├── teamdynamix.ticket-tasks.tools.ts     # Legacy direct tool module
│   ├── teamdynamix.people.tools.ts           # Legacy direct tool module
│   ├── teamdynamix.kb.tools.ts               # Legacy direct tool module
│   ├── teamdynamix.assets.tools.ts           # Legacy direct tool module
│   ├── teamdynamix.services.tools.ts         # Legacy direct tool module
│   ├── teamdynamix.cmdb.tools.ts             # Legacy direct tool module
│   └── teamdynamix.enumeration.tools.ts      # Legacy direct tool module
├── services/
│   ├── teamdynamix/
│   │   ├── client.service.ts        # TeamDynamixClient — HTTP, auth, retry, safety guards
│   │   └── core.service.ts          # Date helpers, JSON Patch builder, rate limit parser, JWT decode
│   └── __tests__/                   # Service unit tests
└── resources/
    └── teamdynamix.resources.ts     # TeamDynamix MCP resources (capabilities, config)
```

## Layer Responsibilities

### Transport layer (`src/index.ts`)

- Creates the MCP server instance using `@modelcontextprotocol/sdk`
- Imports and calls `registerTeamDynamixDomainGatewayTools`
- Registers MCP resources
- Starts `StdioServerTransport`

### Tool handlers (`src/tools/*.tools.ts`)

- Accept domain gateway inputs (`action`, `payload`, `response_format`)
- Validate `payload` per action with Zod schemas
- Call `assertWriteToolsEnabled` or `assertAdminToolsEnabled` before mutating operations
- Delegate to `TeamDynamixClient` methods
- Format and return the response
- Keep behavior thin and predictable

### Gateway model

The exposed MCP surface is intentionally reduced to domain gateways:

- `teamdynamix_discovery`
- `teamdynamix_tickets`
- `teamdynamix_ticket_relationships`
- `teamdynamix_people`
- `teamdynamix_knowledge_base`
- `teamdynamix_assets`
- `teamdynamix_cmdb`
- `teamdynamix_services`
- `teamdynamix_projects`
- `teamdynamix_time`
- `teamdynamix_reference_data`

Each gateway routes named actions to the underlying client methods.

### TeamDynamixClient (`src/services/teamdynamix/client.service.ts`)

- Manages bearer token cache (standard and admin) with expiry-aware refresh
- Retries on transient failures up to `TEAMDYNAMIX_MAX_RETRIES`
- Parses `X-RateLimit-Reset` and waits at least `TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS` on 429
- All HTTP methods are typed `Record<string, unknown>` to stay schema-agnostic
- Exports `assertWriteToolsEnabled` and `assertAdminToolsEnabled` guards
- **Never imports MCP SDK types**

### Core helpers (`src/services/teamdynamix/core.service.ts`)

- `toTeamDynamixDateTime` / `toTeamDynamixDateOnly` — normalises ISO 8601 to TDX wire format
- `buildTeamDynamixJsonPatchDocument` — converts user-facing path strings to RFC 6902 `op/path/value` objects
- `parseRateLimit` — extracts wait duration from rate limit response headers
- `decodeJwtExpiryEpochSeconds` — reads `exp` claim from TDX JWT to enable proactive token refresh
- `redactTeamDynamixConfig` — strips secrets before logging the config

## Schemas

All TeamDynamix Zod schemas live in `src/schemas/teamdynamix/index.ts`. Each domain section is separated by comments. Schemas are imported into tool files and used as `inputSchema` directly.

## Configuration

`src/config.ts` parses environment variables at startup and exports a typed `TeamDynamixConfig`. Tool handlers call `getTeamDynamixConfig()` rather than reading `process.env` directly. The config includes all connection, auth, and safety flag values.

## Safety policy

Two safety guards gate mutating and administrative operations:

- `assertWriteToolsEnabled(config)` — throws unless `enableWriteTools` is `true` (`TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`)
- `assertAdminToolsEnabled(config)` — throws unless `enableAdminTools` is `true` (`TEAMDYNAMIX_ENABLE_ADMIN_TOOLS=true`)

Destructive tools (remove asset link, remove contact, etc.) additionally include a `confirm: z.literal(true)` field in the input schema. The MCP SDK enforces this at the schema level before the handler is called.

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
