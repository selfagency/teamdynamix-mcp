---
title: Ticket Tasks, Contacts, and Assets
---

## Use this guide when

You need to manage tasks and relationships attached to a ticket.

## Manage tasks

- Read existing tasks: `teamdynamix_get_ticket_tasks`
- Create task: `teamdynamix_create_ticket_task` (write enabled)

## Manage ticket contacts

- List contacts: `teamdynamix_get_ticket_contacts`
- Add contact: `teamdynamix_add_ticket_contact` (write enabled)
- Remove contact: `teamdynamix_remove_ticket_contact` (write enabled + `confirm: true`)

## Manage linked assets

- List linked assets: `teamdynamix_list_ticket_assets`
- Add linked asset: `teamdynamix_add_ticket_asset` (write enabled)
- Remove linked asset: `teamdynamix_remove_ticket_asset` (write enabled + `confirm: true`)

## Safety reminders

- `confirm: true` is mandatory for destructive unlink operations
- Use read tools first to validate IDs and avoid accidental unlinking
