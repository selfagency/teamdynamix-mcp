# TeamDynamix Tool Catalog (Source of Truth)

The list below reflects currently registered tools in `src/tools/teamdynamix*.ts` plus utility tools.

## TeamDynamix tools

### Discovery

- `teamdynamix_server_status`
- `teamdynamix_get_current_user`
- `teamdynamix_list_applications`
- `teamdynamix_list_ticket_statuses`

### Ticket metadata + lifecycle

- `teamdynamix_list_ticket_types`
- `teamdynamix_list_ticket_priorities`
- `teamdynamix_list_ticket_urgencies`
- `teamdynamix_list_ticket_impacts`
- `teamdynamix_list_ticket_sources`
- `teamdynamix_get_ticket`
- `teamdynamix_search_tickets`
- `teamdynamix_create_ticket`
- `teamdynamix_update_ticket`
- `teamdynamix_add_ticket_comment`
- `teamdynamix_get_ticket_feed`

### Ticket tasks/assets/contacts

- `teamdynamix_get_ticket_tasks`
- `teamdynamix_create_ticket_task`
- `teamdynamix_list_ticket_assets`
- `teamdynamix_add_ticket_asset`
- `teamdynamix_remove_ticket_asset`
- `teamdynamix_get_ticket_contacts`
- `teamdynamix_add_ticket_contact`
- `teamdynamix_remove_ticket_contact`

### People

- `teamdynamix_get_user`
- `teamdynamix_search_users`
- `teamdynamix_get_group`
- `teamdynamix_search_groups`
- `teamdynamix_get_group_members`

### Knowledge Base

- `teamdynamix_get_kb_article`
- `teamdynamix_search_kb_articles`
- `teamdynamix_list_kb_categories`
- `teamdynamix_create_kb_article`
- `teamdynamix_update_kb_article`

### Assets + CMDB

- `teamdynamix_get_asset`
- `teamdynamix_search_assets`
- `teamdynamix_list_asset_statuses`
- `teamdynamix_list_product_models`
- `teamdynamix_get_ci`
- `teamdynamix_search_cis`
- `teamdynamix_list_ci_types`
- `teamdynamix_list_ci_relationship_types`
- `teamdynamix_list_vendors`

### Service Catalog

- `teamdynamix_list_services`
- `teamdynamix_get_service`
- `teamdynamix_search_services`
- `teamdynamix_list_service_categories`

### Projects + Time

- `teamdynamix_get_project`
- `teamdynamix_search_projects`
- `teamdynamix_list_project_types`
- `teamdynamix_get_project_plans`
- `teamdynamix_get_project_issues`
- `teamdynamix_get_project_risks`
- `teamdynamix_create_project_issue`
- `teamdynamix_create_project_risk`
- `teamdynamix_list_time_types`
- `teamdynamix_get_my_time_entries`

### Enumeration

- `teamdynamix_list_accounts`
- `teamdynamix_get_account`
- `teamdynamix_list_locations`
- `teamdynamix_list_functional_roles`
- `teamdynamix_list_custom_attributes`

## Utility tools

- `template_ping`
- `echo`
- `text_transform`
- `current_time`
- `system_info`

## Notes

- Prefer this file over README snippets for exact tool names.
- `teamdynamix_list_product_models` is the correct asset model lookup name.
- For destructive operations, check for `confirm: true` requirement before execution.
