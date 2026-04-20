---
title: Rate Limits and Retries
---

TeamDynamix may return `429 Too Many Requests` during bursts.

## Behavior in this server

- Reads reset timing from API headers
- Applies minimum wait threshold (`TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS`)
- Retries up to configured budget (`TEAMDYNAMIX_MAX_RETRIES`)

## Why this matters

Without controlled retries, agent loops can amplify failures and generate noisy, non-actionable error cascades.

## Operator guidance

- Prefer bounded search filters
- Avoid rapid repeated polling loops
- Use cached IDs where possible across a workflow
