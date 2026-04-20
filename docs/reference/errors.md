---
title: Errors
---

## Error response shape

Tool handlers commonly return:

- `isError: true`
- text content with an actionable message

## Frequent error classes

| Error | Typical cause | Typical remediation |
| --- | --- | --- |
| `Write tools are disabled...` | Write gate not enabled | Set `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true` |
| `Admin tools are disabled...` | Admin gate not enabled | Set `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS=true` |
| `401 Unauthorized` | Invalid credentials for selected auth mode | Verify mode + env vars |
| `404 Not Found` | Wrong `app_id` or object ID | Resolve IDs using list/search tools |
| `429 Too Many Requests` | API rate limit | Allow auto-retry; reduce request burst |
| Missing `confirm` validation | Destructive tool called without confirmation | Add `confirm: true` |

## Defensive pattern

Before mutating calls:

1. Resolve IDs from read-only tools
2. Validate write flags
3. Use minimal input payload
4. Confirm destructive intent explicitly
