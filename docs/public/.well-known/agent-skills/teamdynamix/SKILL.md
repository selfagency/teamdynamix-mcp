---
name: teamdynamix
description: >
  Use this skill when the user needs TeamDynamix ITSM operations through MCP:
  ticket triage and updates, KB article maintenance, asset/CI relationships,
  service catalog lookups, project issue/risk workflows, or time entry queries.
  Always discover IDs first, use read-before-write patterns, and enforce write
  safety gates.
compatibility: Requires TeamDynamix MCP tools, network access to TEAMDYNAMIX_BASE_URL, and valid TeamDynamix credentials.
metadata:
  owner: teamdynamix-mcp
  maturity: production
---

# TeamDynamix Operator Skill

Use this skill to operate TeamDynamix through an available TeamDynamix MCP
server, whether it is defined in this repository or provided from a separate
repository/runtime. It is optimized for repeatable, safe, multi-step
workflows and assumes tool-first execution (never guess IDs, never skip
read-before-write).

## When to Use

- User asks about TeamDynamix / TDX / ITSM operations.
- User needs ticket updates, comments, tasks, contacts, or asset links.
- User needs KB search/read/write operations.
- User needs CI/CMDB lookups or relationships.
- User needs project issues/risks or time entry/time type lookups.
- User gives ambiguous IDs and needs discovery first.

Do **not** use this skill for generic coding questions unrelated to
TeamDynamix workflows.

## Prerequisites

| Variable                                            | Required                  | Notes                                              |
| --------------------------------------------------- | ------------------------- | -------------------------------------------------- |
| `TEAMDYNAMIX_BASE_URL`                              | ✅                        | TeamDynamix tenant API root (commonly `/TDWebApi`) |
| `TEAMDYNAMIX_AUTH_MODE`                             | ✅                        | `standard` or `admin`                              |
| `TEAMDYNAMIX_USERNAME` / `TEAMDYNAMIX_PASSWORD`     | ✅ in standard mode       | Standard auth credentials                          |
| `TEAMDYNAMIX_BEID` / `TEAMDYNAMIX_WEB_SERVICES_KEY` | ✅ in admin mode          | Admin auth credentials                             |
| `TEAMDYNAMIX_ENABLE_WRITE_TOOLS`                    | Optional, default `false` | Required for create/update/delete tool paths       |
| `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS`                    | Optional, default `false` | Required for admin-only/bulk operations            |
| `TEAMDYNAMIX_DEFAULT_TICKET_APP_ID`                 | Optional                  | Default ticket app ID when `app_id` is omitted     |
| `TEAMDYNAMIX_DEFAULT_ASSET_APP_ID`                  | Optional                  | Default asset app ID when `app_id` is omitted      |
| `TEAMDYNAMIX_DEFAULT_KB_APP_ID`                     | Optional                  | Default KB app ID when `app_id` is omitted         |

## Core Operating Procedure

1. **Clarify target object** (ticket, KB article, asset, CI, project, service, user/group).
2. **Discover IDs first** using lookup tools.
3. **Load full object** after search/list when details may be partial.
4. **Plan write operations** and summarize intended changes before execution.
5. **Check safety gates**:
   - write operation -> require `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`
   - admin operation -> require `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS=true`
   - destructive operation -> require `confirm: true`
6. **Execute** with smallest safe sequence of tools.
7. **Verify result** by re-reading target object/feed/relationship list.
8. **Report outcome** with IDs, changed fields, and any follow-up actions.

## Safety and Branching Rules

- If tool returns **Write tools are disabled** -> stop writes; tell user to set
  `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`.
- If tool returns **Admin tools are disabled** -> stop admin actions; tell user
  to set `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS=true` and admin auth.
- On **401 Unauthorized** -> report auth failure and required credential set.
- On **404 Not Found** -> re-run discovery tools and validate app/context ID.
- On **429 Too Many Requests** -> do not retry manually in a loop; server
  already applies wait/backoff.
- For destructive relationships (remove/unlink) -> require explicit `confirm: true`.

## ID Discovery Quick Start

- Accounts/departments:
  `teamdynamix_reference_data` + `action: "list_accounts"`
- Ticket types/statuses/priorities:
  - `teamdynamix_tickets` + `action: "list_ticket_types"`
  - `teamdynamix_discovery` + `action: "list_ticket_statuses"`
  - `teamdynamix_tickets` + `action: "list_ticket_priorities"`
- Users/groups:
  - `teamdynamix_people` + `action: "search_users"`
  - `teamdynamix_people` + `action: "search_groups"`
- Custom attributes:
  `teamdynamix_reference_data` + `action: "list_custom_attributes"`
- KB categories:
  `teamdynamix_knowledge_base` + `action: "list_kb_categories"`
- CI types/relationship types:
  - `teamdynamix_cmdb` + `action: "list_ci_types"`
  - `teamdynamix_cmdb` + `action: "list_ci_relationship_types"`

## Runbooks

- For complete runbooks, read [workflow runbooks](./references/runbooks.md).
- For ID lookups by domain, read [ID lookup reference](./references/id-lookup.md).
- For full tool family catalog and exact names, read [tool catalog](./references/tool-catalog.md).
- For known caveats and correction patterns, read [gotchas](./references/gotchas.md).

## Output Requirements

- Include concrete IDs in results (`ticket_id`, `project_id`, `article_id`, etc.).
- For list/search responses, provide count + top relevant records.
- For write responses, summarize what changed and how it was verified.

## Example Prompts

- "Find open high-priority tickets assigned to Jane and add a private note to
  ticket 12345."
- "Create a KB draft for VPN timeout troubleshooting under the Networking category."
- "Link asset 456 to ticket 12345 and then verify the ticket asset list."
- "Create a project issue for migration delay risk and assign it to the PM."
- "Show my time entries between 2026-04-01 and 2026-04-15."

## Evaluation

- Baseline eval definitions are in [evals/evals.json](./evals/evals.json).
- Use those prompts to verify triggering quality and workflow output quality.
