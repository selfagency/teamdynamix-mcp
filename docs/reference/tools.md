---
title: Tool Catalog
---

Current TeamDynamix MCP tool catalog.

## Response conventions

- All gateway tools support `response_format` with values:
  - `"markdown"` (default)
  - `"json"`
- TeamDynamix gateway tools use the `teamdynamix_` prefix.
- Gateway tools accept:
  - `action` (domain-specific operation)
  - `payload` (object containing action parameters)
  - `response_format`

## Exposed gateway tools (11)

| Tool | Type |
| --- | --- |
| `teamdynamix_discovery` | mixed (read actions) |
| `teamdynamix_tickets` | mixed (read/write actions) |
| `teamdynamix_ticket_relationships` | mixed (read/write/destructive actions) |
| `teamdynamix_people` | mixed (read actions) |
| `teamdynamix_knowledge_base` | mixed (read/write actions) |
| `teamdynamix_assets` | mixed (read actions) |
| `teamdynamix_cmdb` | mixed (read actions) |
| `teamdynamix_services` | mixed (read actions) |
| `teamdynamix_projects` | mixed (read/write actions) |
| `teamdynamix_time` | mixed (read actions) |
| `teamdynamix_reference_data` | mixed (read actions) |

## Discovery gateway actions (`teamdynamix_discovery`)

| Tool | Type |
| --- | --- |
| `server_status` | read |
| `get_current_user` | read |
| `list_applications` | read |
| `list_ticket_statuses` | read |

## Tickets gateway actions (`teamdynamix_tickets`)

| Tool | Type |
| --- | --- |
| `list_ticket_types` | read |
| `list_ticket_priorities` | read |
| `list_ticket_urgencies` | read |
| `list_ticket_impacts` | read |
| `list_ticket_sources` | read |
| `get_ticket` | read |
| `search_tickets` | read |
| `create_ticket` | write |
| `update_ticket` | write |
| `add_ticket_comment` | write |
| `get_ticket_feed` | read |

## Ticket relationships gateway actions (`teamdynamix_ticket_relationships`)

| Tool | Type |
| --- | --- |
| `get_ticket_tasks` | read |
| `create_ticket_task` | write |
| `list_ticket_assets` | read |
| `add_ticket_asset` | write |
| `remove_ticket_asset` | destructive (confirm required) |
| `get_ticket_contacts` | read |
| `add_ticket_contact` | write |
| `remove_ticket_contact` | destructive (confirm required) |

## People gateway actions (`teamdynamix_people`)

| Tool | Type |
| --- | --- |
| `get_user` | read |
| `search_users` | read |
| `get_group` | read |
| `search_groups` | read |
| `get_group_members` | read |

## Knowledge Base gateway actions (`teamdynamix_knowledge_base`)

| Tool | Type |
| --- | --- |
| `get_kb_article` | read |
| `search_kb_articles` | read |
| `list_kb_categories` | read |
| `create_kb_article` | write |
| `update_kb_article` | write |

## Assets gateway actions (`teamdynamix_assets`)

| Tool | Type |
| --- | --- |
| `get_asset` | read |
| `search_assets` | read |
| `list_asset_statuses` | read |
| `list_product_models` | read |
| `delete_asset` | destructive (requires `TEAMDYNAMIX_ENABLE_DELETE_TOOLS=true` + `confirm: true`) |

## CMDB gateway actions (`teamdynamix_cmdb`)

| Tool | Type |
| --- | --- |
| `get_ci` | read |
| `search_cis` | read |
| `list_ci_types` | read |
| `list_ci_relationship_types` | read |
| `list_vendors` | read |
| `delete_ci` | destructive (requires `TEAMDYNAMIX_ENABLE_DELETE_TOOLS=true` + `confirm: true`) |

## Services gateway actions (`teamdynamix_services`)

| Tool | Type |
| --- | --- |
| `list_services` | read |
| `get_service` | read |
| `search_services` | read |
| `list_service_categories` | read |
| `delete_service` | destructive (requires `TEAMDYNAMIX_ENABLE_DELETE_TOOLS=true` + `confirm: true`) |
| `delete_service_category` | destructive (requires `TEAMDYNAMIX_ENABLE_DELETE_TOOLS=true` + `confirm: true`) |

## Projects gateway actions (`teamdynamix_projects`)

| Tool | Type |
| --- | --- |
| `get_project` | read |
| `search_projects` | read |
| `list_project_types` | read |
| `get_project_plans` | read |
| `get_project_issues` | read |
| `get_project_risks` | read |
| `create_project_issue` | write |
| `create_project_risk` | write |

## Time gateway actions (`teamdynamix_time`)

| Tool | Type |
| --- | --- |
| `list_time_types` | read |
| `get_my_time_entries` | read |

## Reference data gateway actions (`teamdynamix_reference_data`)

| Tool | Type |
| --- | --- |
| `list_accounts` | read |
| `get_account` | read |
| `list_locations` | read |
| `list_functional_roles` | read |
| `list_custom_attributes` | read |

## Safety implications

- All `write` actions require `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`.
- All `destructive` actions require both their domain flag and `confirm: true`:
  - Ticket relationship unlinks require `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true` + `confirm: true`
  - Asset/CI/service/service category deletion requires `TEAMDYNAMIX_ENABLE_DELETE_TOOLS=true` + `confirm: true`
