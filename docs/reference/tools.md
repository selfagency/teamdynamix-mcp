---
title: Tool Catalog
---

Current TeamDynamix MCP tool catalog.

## Response conventions

- Most tools support `response_format` with values:
  - `"markdown"` (default)
  - `"json"`
- TeamDynamix domain tools use the `teamdynamix_` prefix.

## Discovery tools (4)

| Tool | Type |
| --- | --- |
| `teamdynamix_server_status` | read |
| `teamdynamix_get_current_user` | read |
| `teamdynamix_list_applications` | read |
| `teamdynamix_list_ticket_statuses` | read |

## Ticket tools (11)

| Tool | Type |
| --- | --- |
| `teamdynamix_list_ticket_types` | read |
| `teamdynamix_list_ticket_priorities` | read |
| `teamdynamix_list_ticket_urgencies` | read |
| `teamdynamix_list_ticket_impacts` | read |
| `teamdynamix_list_ticket_sources` | read |
| `teamdynamix_get_ticket` | read |
| `teamdynamix_search_tickets` | read |
| `teamdynamix_create_ticket` | write |
| `teamdynamix_update_ticket` | write |
| `teamdynamix_add_ticket_comment` | write |
| `teamdynamix_get_ticket_feed` | read |

## Ticket task/contact/asset relationship tools (8)

| Tool | Type |
| --- | --- |
| `teamdynamix_get_ticket_tasks` | read |
| `teamdynamix_create_ticket_task` | write |
| `teamdynamix_list_ticket_assets` | read |
| `teamdynamix_add_ticket_asset` | write |
| `teamdynamix_remove_ticket_asset` | destructive (confirm required) |
| `teamdynamix_get_ticket_contacts` | read |
| `teamdynamix_add_ticket_contact` | write |
| `teamdynamix_remove_ticket_contact` | destructive (confirm required) |

## People tools (5)

| Tool | Type |
| --- | --- |
| `teamdynamix_get_user` | read |
| `teamdynamix_search_users` | read |
| `teamdynamix_get_group` | read |
| `teamdynamix_search_groups` | read |
| `teamdynamix_get_group_members` | read |

## Knowledge Base tools (5)

| Tool | Type |
| --- | --- |
| `teamdynamix_get_kb_article` | read |
| `teamdynamix_search_kb_articles` | read |
| `teamdynamix_list_kb_categories` | read |
| `teamdynamix_create_kb_article` | write |
| `teamdynamix_update_kb_article` | write |

## Asset tools (4)

| Tool | Type |
| --- | --- |
| `teamdynamix_get_asset` | read |
| `teamdynamix_search_assets` | read |
| `teamdynamix_list_asset_statuses` | read |
| `teamdynamix_list_product_models` | read |

## CMDB tools (5)

| Tool | Type |
| --- | --- |
| `teamdynamix_get_ci` | read |
| `teamdynamix_search_cis` | read |
| `teamdynamix_list_ci_types` | read |
| `teamdynamix_list_ci_relationship_types` | read |
| `teamdynamix_list_vendors` | read |

## Service catalog tools (4)

| Tool | Type |
| --- | --- |
| `teamdynamix_list_services` | read |
| `teamdynamix_get_service` | read |
| `teamdynamix_search_services` | read |
| `teamdynamix_list_service_categories` | read |

## Project tools (8)

| Tool | Type |
| --- | --- |
| `teamdynamix_get_project` | read |
| `teamdynamix_search_projects` | read |
| `teamdynamix_list_project_types` | read |
| `teamdynamix_get_project_plans` | read |
| `teamdynamix_get_project_issues` | read |
| `teamdynamix_get_project_risks` | read |
| `teamdynamix_create_project_issue` | write |
| `teamdynamix_create_project_risk` | write |

## Time tools (2)

| Tool | Type |
| --- | --- |
| `teamdynamix_list_time_types` | read |
| `teamdynamix_get_my_time_entries` | read |

## Enumeration tools (5)

| Tool | Type |
| --- | --- |
| `teamdynamix_list_accounts` | read |
| `teamdynamix_get_account` | read |
| `teamdynamix_list_locations` | read |
| `teamdynamix_list_functional_roles` | read |
| `teamdynamix_list_custom_attributes` | read |

## Safety implications

- All `write` and `destructive` tools require `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`.
- Destructive unlink operations also require `confirm: true`.
