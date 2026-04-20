---
title: Getting Started
---

In this tutorial, you will run `teamdynamix-mcp`, connect an MCP client, and verify the connection with read-only tools.

## Prerequisites

- Node.js 20+
- pnpm 10+
- TeamDynamix credentials
  - standard mode: `TEAMDYNAMIX_USERNAME` + `TEAMDYNAMIX_PASSWORD`
  - admin mode: `TEAMDYNAMIX_BEID` + `TEAMDYNAMIX_WEB_SERVICES_KEY`

## Step 1: install and configure

1. Install dependencies:
   - `pnpm install`
2. Create local config:
   - `cp .env.example .env`
3. Fill `.env` with your TeamDynamix values.

## Step 2: start the server

Run:

- `pnpm dev`

Expected: startup logs and an active stdio MCP process.

## Step 3: connect your MCP client

Use stdio transport with:

- command: `node`
- args: `--import`, `tsx/esm`, `src/index.ts`

## Step 4: verify tool connectivity

Call these tools in order:

1. `template_ping`
2. `teamdynamix_server_status`
3. `teamdynamix_get_current_user`
4. `teamdynamix_list_applications`

Expected: responses arrive without errors, and `teamdynamix_server_status` shows `configured: true`.

## Step 5: verify a ticket app ID

Call `teamdynamix_list_applications`, pick the ticketing app, then call:

- `teamdynamix_list_ticket_statuses` with `app_id`

If this works, your baseline environment is ready for ticket and KB workflows.

## Next tutorial

- [First Ticket Workflow](/tutorials/first-ticket-workflow)
