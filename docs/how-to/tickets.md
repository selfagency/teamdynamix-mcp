---
title: Create and Update Tickets
---

## Use this guide when

You need to create, inspect, search, or update TeamDynamix tickets from an MCP client.

## Steps

1. Resolve `app_id`
   - `teamdynamix_discovery` with `action: "list_applications"`
2. Resolve `TypeID`, `AccountID`, optional user GUIDs
   - `teamdynamix_tickets` with `action: "list_ticket_types"`
   - `teamdynamix_reference_data` with `action: "list_accounts"`
   - `teamdynamix_people` with `action: "search_users"`
3. Create ticket
   - `teamdynamix_tickets` with `action: "create_ticket"` (requires `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`)
4. Verify ticket
   - `teamdynamix_tickets` with `action: "get_ticket"`
   - `teamdynamix_tickets` with `action: "get_ticket_feed"`
5. Update ticket
   - `teamdynamix_tickets` with `action: "update_ticket"`
6. Add comment
   - `teamdynamix_tickets` with `action: "add_ticket_comment"`

## Notes

- Metadata helpers: `teamdynamix_tickets` with `action: "list_ticket_priorities"`, `action: "list_ticket_urgencies"`, `action: "list_ticket_impacts"`, `action: "list_ticket_sources"`
- Use `teamdynamix_tickets` with `action: "search_tickets"` for filtered operational views
