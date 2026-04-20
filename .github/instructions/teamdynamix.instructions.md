---
description: Instructions for GitHub Copilot when operating against a TeamDynamix instance via the MCP server.
applyTo: '**'
---

# TeamDynamix MCP Server — Agent Instructions

## Context

You are connected to a TeamDynamix ITSM instance via the `teamdynamix-mcp` Model Context Protocol server. All
interactions with TeamDynamix MUST go through the provided MCP tools. Do not fabricate record IDs, user GUIDs,
or API paths.

## Operating Principles

1. **Discover before writing.** Before creating or updating any record, use read tools to resolve IDs, statuses,
   and user GUIDs. Never guess a numeric ID.

2. **Respect safety flags.** Write tools are gated behind `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`. If a write
   tool returns "Write tools are disabled", tell the user to set the environment variable and do not retry.

3. **Confirm destructive actions.** Tools that remove or unlink records require `confirm: true` in the input.
   Ask the user before calling these tools.

4. **Surface errors clearly.** When a tool returns `isError: true`, report the exact error message to the user
   and suggest the most likely fix (wrong ID, missing flag, expired auth, rate limit).

5. **Prefer structured output.** Use `response_format: "json"` for programmatic use and `response_format: "markdown"` for human-readable summaries.

## ID Lookup Cheat Sheet

| Need | Tool |
| --- | --- |
| Account / department ID | `teamdynamix_list_accounts` |
| Ticket type ID | `teamdynamix_list_ticket_types` |
| Ticket status ID | `teamdynamix_list_ticket_statuses` |
| Ticket priority ID | `teamdynamix_list_ticket_priorities` |
| Custom attribute IDs | `teamdynamix_list_custom_attributes` (component_id: 9 for tickets) |
| User GUID | `teamdynamix_search_users` |
| Group ID | `teamdynamix_search_groups` |
| KB category ID | `teamdynamix_list_kb_categories` |
| Asset status ID | `teamdynamix_list_asset_statuses` |
| CI type ID | `teamdynamix_list_ci_types` |
| Location ID | `teamdynamix_list_locations` |
| Functional role ID | `teamdynamix_list_functional_roles` |

## Ticket Workflow

1. Resolve `app_id` — use `teamdynamix_list_applications` or the configured default.
2. Resolve `TypeID` via `teamdynamix_list_ticket_types`.
3. Resolve `AccountID` via `teamdynamix_list_accounts`.
4. Resolve `RequestorUID` and `ResponsibleUID` via `teamdynamix_search_users`.
5. Call `teamdynamix_create_ticket` with all resolved IDs.
6. To add tasks: `teamdynamix_create_ticket_task`.
7. To link an asset: `teamdynamix_add_ticket_asset`.

## KB Authoring Workflow

1. Resolve `app_id` and `CategoryID` via `teamdynamix_list_kb_categories`.
2. Call `teamdynamix_create_kb_article` with `IsPublished: false` for drafts.
3. Call `teamdynamix_update_kb_article` to publish or revise.

## Rate Limits and Auth

- The server auto-refreshes auth tokens; no manual token management needed.
- On `429 Too Many Requests`, the server automatically waits the required cooldown (≥5s). No action needed.
- On `401 Unauthorized`, credentials may have changed. Inform the user.

## Scope Boundaries

- The MCP server only connects to the configured TeamDynamix tenant.
- Do not suggest direct TeamDynamix REST API calls — use the MCP tools exclusively.
- Do not expose auth credentials or tokens in tool responses or user-facing messages.
