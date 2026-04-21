---
title: First Ticket Workflow
---

In this tutorial, you will resolve required IDs and run a complete ticket lifecycle sequence.

## Goal

Create and inspect a ticket using valid TeamDynamix identifiers discovered from read tools.

## Step 1: resolve required IDs

1. Call `teamdynamix_discovery` with `action: "list_applications"` and choose an `AccountID`.
2. Call `teamdynamix_tickets` with `action: "list_ticket_types"` and your ticket `app_id` and choose a `TypeID`.
3. Optional: call `teamdynamix_people` with `action: "search_users"` to resolve `RequestorUid` and `ResponsibleUid`.

## Step 2: create ticket (write mode)

If write tools are disabled, set:

- `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`

Then call `teamdynamix_tickets` with `action: "create_ticket"` and:

- `app_id`
- `ticket.Title`
- `ticket.TypeID`
- `ticket.AccountID`

Expected: a created ticket object with `ID`.

## Step 3: inspect and search

1. Call `teamdynamix_tickets` with `action: "get_ticket"` and `ticket_id`.
2. Call `teamdynamix_tickets` with `action: "search_tickets"` and filters (for example, status or responsible user).
3. Call `teamdynamix_tickets` with `action: "get_ticket_feed"`.

## Step 4: update and comment

1. Call `teamdynamix_tickets` with `action: "update_ticket"` and a `patch` payload.
2. Call `teamdynamix_tickets` with `action: "add_ticket_comment"`.

Expected: ticket feed now includes your update and comment.

## Step 5: add related data

1. Call `teamdynamix_ticket_relationships` with `action: "create_ticket_task"`.
2. Call `teamdynamix_ticket_relationships` with `action: "add_ticket_contact"`.
3. Optional: call `teamdynamix_ticket_relationships` with `action: "add_ticket_asset"`.

## Validation

You should now be able to retrieve:

- ticket details
- ticket feed
- tasks
- contacts
- linked assets

## Next tutorial

- [First KB Workflow](/tutorials/first-kb-workflow)
