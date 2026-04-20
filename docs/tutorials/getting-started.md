---
title: Getting Started
---

In this tutorial, you will configure `teamdynamix-mcp` in an MCP client,
connect using the published package, and verify connectivity with read-only
tools.

If you want to run from source as a contributor, use the development guide:
`docs/development/contributing.md`.

## Prerequisites

- Node.js 20+
- An MCP client (for example: VS Code or Claude Desktop)
- TeamDynamix credentials
  - standard mode: `TEAMDYNAMIX_USERNAME` + `TEAMDYNAMIX_PASSWORD`
  - admin mode: `TEAMDYNAMIX_BEID` + `TEAMDYNAMIX_WEB_SERVICES_KEY`

## Step 1: add server configuration

Add a TeamDynamix server entry to your MCP client config:

- command: `npx`
- args: `-y`, `@selfagency/teamdynamix-mcp`
- env:
  - `TEAMDYNAMIX_BASE_URL`
  - `TEAMDYNAMIX_AUTH_MODE`
  - standard mode: `TEAMDYNAMIX_USERNAME`, `TEAMDYNAMIX_PASSWORD`
  - admin mode: `TEAMDYNAMIX_BEID`, `TEAMDYNAMIX_WEB_SERVICES_KEY`

## Step 2: start your MCP client

Start or reload your MCP client so it launches the TeamDynamix MCP server.

Expected: your client shows an active TeamDynamix server using stdio transport.

## Step 3: verify tool connectivity

Call these tools in order:

1. `teamdynamix_server_status` — confirms credentials and base URL are configured
2. `teamdynamix_get_current_user` — returns your authenticated user record
3. `teamdynamix_list_applications` — lists accessible TeamDynamix apps

Expected: responses arrive without errors, and
`teamdynamix_server_status` shows `configured: true`.

## Step 4: verify a ticket app ID

Call `teamdynamix_list_applications`, pick the ticketing app, then call:

- `teamdynamix_list_ticket_statuses` with `app_id`

If this works, your baseline environment is ready for ticket and KB workflows.

## Next tutorial

- [First Ticket Workflow](/tutorials/first-ticket-workflow)
