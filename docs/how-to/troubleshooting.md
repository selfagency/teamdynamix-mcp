---
title: Troubleshooting Errors
---

## Write tools are disabled

Error resembles:

- `Write tools are disabled...`

Fix:

- Set `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`
- Restart MCP server

## Admin tools are disabled

Error resembles:

- `Admin tools are disabled...`

Fix:

- Set `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS=true`
- Use admin auth mode values (`TEAMDYNAMIX_BEID`, `TEAMDYNAMIX_WEB_SERVICES_KEY`)

## 401 Unauthorized

Likely causes:

- wrong credential pair for selected auth mode
- expired or invalid environment values

Fix:

- verify auth mode and variables
- restart server after correction

## 404 Not Found

Likely cause:

- wrong `app_id` or record ID

Fix:

- rediscover IDs using list/search tools before retrying write operations

## 429 Too Many Requests

Behavior:

- server waits and retries automatically (minimum wait threshold applies)

Fix:

- usually no manual fix required
- if persistent, lower concurrency and reduce repeated polling

## Destructive operation rejected

Likely cause:

- missing `confirm: true` for unlink operations

Fix:

- add explicit `confirm: true` and retry only after confirming user intent
