---
title: Configuration
---

`teamdynamix-mcp` is configured with environment variables parsed in `src/config.ts`.

## Required variables

| Variable | Description |
| --- | --- |
| `TEAMDYNAMIX_BASE_URL` | TeamDynamix API base URL, typically ending in `/TDWebApi` |
| `TEAMDYNAMIX_AUTH_MODE` | `standard` or `admin` |
| `TEAMDYNAMIX_USERNAME` | Required in `standard` mode |
| `TEAMDYNAMIX_PASSWORD` | Required in `standard` mode |
| `TEAMDYNAMIX_BEID` | Required in `admin` mode |
| `TEAMDYNAMIX_WEB_SERVICES_KEY` | Required in `admin` mode |

## Optional TeamDynamix variables

| Variable | Default | Notes |
| --- | --- | --- |
| `TEAMDYNAMIX_DEFAULT_TICKET_APP_ID` | unset | Used when `app_id` is omitted in ticket/discovery contexts |
| `TEAMDYNAMIX_DEFAULT_ASSET_APP_ID` | unset | Default asset app ID |
| `TEAMDYNAMIX_DEFAULT_KB_APP_ID` | unset | Default KB app ID |
| `TEAMDYNAMIX_TIMEOUT_MS` | `30000` | HTTP timeout budget |
| `TEAMDYNAMIX_MAX_RETRIES` | `2` | Retry budget for transient failures |
| `TEAMDYNAMIX_ENABLE_WRITE_TOOLS` | `false` | Enables create/update/comment/mutation operations |
| `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS` | `false` | Enables admin-only operations |

## Optional server metadata variables

| Variable | Default | Notes |
| --- | --- | --- |
| `MCP_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `MCP_SERVER_NAME` | unset | Overrides initialize name |
| `MCP_SERVER_VERSION` | unset | Overrides initialize version |
| `MCP_BASE_PATH` | unset | Reserved base path; not used by TeamDynamix tool logic |

## CLI flag

- `--base-path` is supported by the server bootstrap and maps to the same base-path logic as `MCP_BASE_PATH`.

## Auth mode behavior

- `standard`: requires username/password
- `admin`: requires BEID/WebServicesKey

Runtime config readiness can be inspected using `teamdynamix_server_status`.
