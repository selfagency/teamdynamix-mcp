# TeamDynamix ID Lookup Reference

Use this reference when a workflow needs IDs before write operations.

## Common lookup sequences

### Ticket create/update prerequisites

1. `teamdynamix_reference_data` + `action: "list_accounts"`
   -> Account/Department IDs
2. `teamdynamix_tickets` + `action: "list_ticket_types"`
   -> Ticket Type IDs
3. `teamdynamix_discovery` + `action: "list_ticket_statuses"`
   -> Status IDs
4. `teamdynamix_tickets` + `action: "list_ticket_priorities"`
   -> Priority IDs
5. `teamdynamix_people` + `action: "search_users"`
   -> Requestor/Responsible user GUIDs
6. `teamdynamix_reference_data` + `action: "list_custom_attributes"`
   with `component_id=9` -> Ticket custom attribute IDs

### KB article prerequisites

1. `teamdynamix_knowledge_base` + `action: "list_kb_categories"`
   -> Category IDs
2. `teamdynamix_people` + `action: "search_users"`
   -> author/owner GUIDs if needed
3. `teamdynamix_reference_data` + `action: "list_custom_attributes"`
   with KB component ID -> KB custom attribute IDs

### Asset/CI relationship prerequisites

1. `teamdynamix_assets` + `action: "search_assets"` -> asset IDs
2. `teamdynamix_cmdb` + `action: "search_cis"` -> CI IDs
3. `teamdynamix_cmdb` + `action: "list_ci_types"` -> CI type IDs
4. `teamdynamix_cmdb` + `action: "list_ci_relationship_types"`
   -> relationship type IDs

### Project issue/risk prerequisites

1. `teamdynamix_projects` + `action: "search_projects"` -> project IDs
2. `teamdynamix_projects` + `action: "get_project"`
   -> validate project scope and permissions
3. `teamdynamix_people` + `action: "search_users"`
   -> assignee/owner GUIDs

## Discovery-first rules

- Never assume numeric IDs from names.
- Prefer search/list for discovery, then load full object by ID before write.
- If multiple close matches exist, ask user to confirm target by ID.
- If lookup returns empty, branch to alternate filters (name/email/GUID/app scope).
