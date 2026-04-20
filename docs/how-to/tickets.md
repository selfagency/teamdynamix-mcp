---
title: Create and Update Tickets
---

## Use this guide when

You need to create, inspect, search, or update TeamDynamix tickets from an MCP client.

## Steps

1. Resolve `app_id`
   - `teamdynamix_list_applications`
2. Resolve `TypeID`, `AccountID`, optional user GUIDs
   - `teamdynamix_list_ticket_types`
   - `teamdynamix_list_accounts`
   - `teamdynamix_search_users`
3. Create ticket
   - `teamdynamix_create_ticket` (requires `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`)
4. Verify ticket
   - `teamdynamix_get_ticket`
   - `teamdynamix_get_ticket_feed`
5. Update ticket
   - `teamdynamix_update_ticket`
6. Add comment
   - `teamdynamix_add_ticket_comment`

## Notes

- Metadata helpers: `teamdynamix_list_ticket_priorities`, `teamdynamix_list_ticket_urgencies`, `teamdynamix_list_ticket_impacts`, `teamdynamix_list_ticket_sources`
- Use `teamdynamix_search_tickets` for filtered operational views
