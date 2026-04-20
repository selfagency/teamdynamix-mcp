# TeamDynamix Gateway Catalog (Source of Truth)

The MCP surface uses domain gateway tools. Each call uses:

- `action`
- `payload`
- `response_format`

## Gateway tools and actions

### `teamdynamix_discovery`

- `server_status`
- `get_current_user`
- `list_applications`
- `list_ticket_statuses`

### `teamdynamix_tickets`

- `list_ticket_types`
- `list_ticket_priorities`
- `list_ticket_urgencies`
- `list_ticket_impacts`
- `list_ticket_sources`
- `get_ticket`
- `search_tickets`
- `create_ticket`
- `update_ticket`
- `add_ticket_comment`
- `get_ticket_feed`

### `teamdynamix_ticket_relationships`

- `get_ticket_tasks`
- `create_ticket_task`
- `list_ticket_assets`
- `add_ticket_asset`
- `remove_ticket_asset`
- `get_ticket_contacts`
- `add_ticket_contact`
- `remove_ticket_contact`

### `teamdynamix_people`

- `get_user`
- `search_users`
- `get_group`
- `search_groups`
- `get_group_members`

### `teamdynamix_knowledge_base`

- `get_kb_article`
- `search_kb_articles`
- `list_kb_categories`
- `create_kb_article`
- `update_kb_article`

### `teamdynamix_assets`

- `get_asset`
- `search_assets`
- `list_asset_statuses`
- `list_product_models`

### `teamdynamix_cmdb`

- `get_ci`
- `search_cis`
- `list_ci_types`
- `list_ci_relationship_types`
- `list_vendors`

### `teamdynamix_services`

- `list_services`
- `get_service`
- `search_services`
- `list_service_categories`

### `teamdynamix_projects`

- `get_project`
- `search_projects`
- `list_project_types`
- `get_project_plans`
- `get_project_issues`
- `get_project_risks`
- `create_project_issue`
- `create_project_risk`

### `teamdynamix_time`

- `list_time_types`
- `get_my_time_entries`

### `teamdynamix_reference_data`

- `list_accounts`
- `get_account`
- `list_locations`
- `list_functional_roles`
- `list_custom_attributes`

## Notes

- Prefer this file over README snippets for exact gateway/action names.
- Destructive actions require `confirm: true`.
