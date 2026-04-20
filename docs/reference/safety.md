---
title: Safety
---

## Write and admin gates

| Gate | Default | Meaning |
| --- | --- | --- |
| `TEAMDYNAMIX_ENABLE_WRITE_TOOLS` | `false` | Disables mutating tools unless explicitly enabled |
| `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS` | `false` | Disables admin-scope operations unless explicitly enabled |

Write-guard enforcement is done in service-layer assertions before mutating API calls.

## Destructive confirmations

The following tools require explicit `confirm: true` in input schema:

- `teamdynamix_remove_ticket_asset`
- `teamdynamix_remove_ticket_contact`

## Validation and bounds

- Inputs are validated with Zod schemas before handler logic.
- UUID and numeric IDs are constrained via schema checks.
- Configuration readiness can be inspected via `teamdynamix_server_status`.

## Rate-limit handling

- 429 responses trigger wait-and-retry behavior.
- Minimum wait threshold is controlled by code constant `TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS`.
- Retry budget is controlled by `TEAMDYNAMIX_MAX_RETRIES`.

## Secrets handling

- Config snapshots are redacted for secrets.
- Tool responses do not expose credentials.

## Log sanitization policy

- Runtime startup logs only include `LOG_LEVEL` by default.
- When `MCP_LOG_LEVEL=debug`, configuration logging must use redacted values (for example, password and key fields emit `[configured]`).
- Raw credential values must never be written to stderr/stdout.

## Dependency and CVE monitoring

- CI runs `pnpm audit --prod` on every push and pull request.
- High or moderate vulnerabilities in production dependencies are treated as release blockers.
- If upstream SDK updates are delayed, patched transitive versions are enforced via package manager overrides until upstream catches up.
