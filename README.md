# teamdynamix-mcp

A TypeScript [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that exposes [TeamDynamix](https://www.teamdynamix.com/) ITSM capabilities as agent-callable tools. Designed for AI agents and MCP clients that need structured, safety-gated access to TeamDynamix operations.

## Features

- **62 tools** across 9 domains: tickets, KB, assets, CMDB, people, services, projects, time, and enumerations
- **Safe by default**: write tools disabled until explicitly opted in, destructive operations require `confirm: true`
- **Two auth modes**: standard (username/password) and admin (BEID/WebServicesKey)
- **Rate-limit aware**: auto-retry with backoff on 429 responses
- **Zod-validated inputs**: schema enforcement before any API call
- **Agent skill and prompt included**: ready-to-use skill definition for GitHub Copilot and compatible agents

## Quick start

```sh
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your TeamDynamix credentials and base URL

# 3. Start the development server
pnpm dev
```

### Minimum required environment variables

```sh
TEAMDYNAMIX_BASE_URL=https://your-tenant.teamdynamix.com/TDWebApi
TEAMDYNAMIX_AUTH_MODE=standard          # or: admin
TEAMDYNAMIX_USERNAME=you@example.com    # standard mode
TEAMDYNAMIX_PASSWORD=your-password      # standard mode
```

For admin mode, use `TEAMDYNAMIX_BEID` and `TEAMDYNAMIX_WEB_SERVICES_KEY` instead.

## MCP client configuration

### VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "teamdynamix": {
      "type": "stdio",
      "command": "node",
      "args": ["--import", "tsx/esm", "/path/to/teamdynamix-mcp/src/index.ts"],
      "env": {
        "TEAMDYNAMIX_BASE_URL": "https://your-tenant.teamdynamix.com/TDWebApi",
        "TEAMDYNAMIX_AUTH_MODE": "standard",
        "TEAMDYNAMIX_USERNAME": "you@example.com",
        "TEAMDYNAMIX_PASSWORD": "your-password"
      }
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "teamdynamix": {
      "command": "node",
      "args": ["--import", "tsx/esm", "/path/to/teamdynamix-mcp/src/index.ts"],
      "env": {
        "TEAMDYNAMIX_BASE_URL": "https://your-tenant.teamdynamix.com/TDWebApi",
        "TEAMDYNAMIX_AUTH_MODE": "standard",
        "TEAMDYNAMIX_USERNAME": "you@example.com",
        "TEAMDYNAMIX_PASSWORD": "your-password"
      }
    }
  }
}
```

### Production (built bundle)

```sh
pnpm build   # outputs to dist/
```

```json
{
  "command": "node",
  "args": ["/path/to/teamdynamix-mcp/dist/index.js"]
}
```

### Verify connectivity

After connecting your MCP client, call `teamdynamix_server_status` with `response_format: "json"`. A successful response shows `configured: true`.

## Tool domains

| Domain               | Read tools                                                                                                                                                                                                                                                              | Write tools                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery            | `teamdynamix_server_status`, `teamdynamix_get_current_user`, `teamdynamix_list_applications`, `teamdynamix_list_ticket_statuses`                                                                                                                                        | —                                                                                                                                                                            |
| Tickets              | `teamdynamix_get_ticket`, `teamdynamix_search_tickets`, `teamdynamix_get_ticket_feed`, `teamdynamix_list_ticket_types`, `teamdynamix_list_ticket_priorities`, `teamdynamix_list_ticket_urgencies`, `teamdynamix_list_ticket_impacts`, `teamdynamix_list_ticket_sources` | `teamdynamix_create_ticket`, `teamdynamix_update_ticket`, `teamdynamix_add_ticket_comment`                                                                                   |
| Ticket relationships | `teamdynamix_get_ticket_tasks`, `teamdynamix_list_ticket_assets`, `teamdynamix_get_ticket_contacts`                                                                                                                                                                     | `teamdynamix_create_ticket_task`, `teamdynamix_add_ticket_asset`, `teamdynamix_remove_ticket_asset`†, `teamdynamix_add_ticket_contact`, `teamdynamix_remove_ticket_contact`† |
| Knowledge Base       | `teamdynamix_get_kb_article`, `teamdynamix_search_kb_articles`, `teamdynamix_list_kb_categories`                                                                                                                                                                        | `teamdynamix_create_kb_article`, `teamdynamix_update_kb_article`                                                                                                             |
| Assets               | `teamdynamix_get_asset`, `teamdynamix_search_assets`, `teamdynamix_list_asset_statuses`, `teamdynamix_list_product_models`                                                                                                                                              | —                                                                                                                                                                            |
| CMDB                 | `teamdynamix_get_ci`, `teamdynamix_search_cis`, `teamdynamix_list_ci_types`, `teamdynamix_list_ci_relationship_types`, `teamdynamix_list_vendors`                                                                                                                       | —                                                                                                                                                                            |
| People               | `teamdynamix_get_user`, `teamdynamix_search_users`, `teamdynamix_get_group`, `teamdynamix_search_groups`, `teamdynamix_get_group_members`                                                                                                                               | —                                                                                                                                                                            |
| Services             | `teamdynamix_list_services`, `teamdynamix_get_service`, `teamdynamix_search_services`, `teamdynamix_list_service_categories`                                                                                                                                            | —                                                                                                                                                                            |
| Projects             | `teamdynamix_get_project`, `teamdynamix_search_projects`, `teamdynamix_list_project_types`, `teamdynamix_get_project_plans`, `teamdynamix_get_project_issues`, `teamdynamix_get_project_risks`                                                                          | `teamdynamix_create_project_issue`, `teamdynamix_create_project_risk`                                                                                                        |
| Time                 | `teamdynamix_list_time_types`, `teamdynamix_get_my_time_entries`                                                                                                                                                                                                        | —                                                                                                                                                                            |
| Enumerations         | `teamdynamix_list_accounts`, `teamdynamix_get_account`, `teamdynamix_list_locations`, `teamdynamix_list_functional_roles`, `teamdynamix_list_custom_attributes`                                                                                                         | —                                                                                                                                                                            |

† Requires `confirm: true` in addition to write tools being enabled.

All write tools require `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`.

## Safety defaults

| Flag                             | Default | Effect when `true`                               |
| -------------------------------- | ------- | ------------------------------------------------ |
| `TEAMDYNAMIX_ENABLE_WRITE_TOOLS` | `false` | Enables all create/update/comment/mutation tools |
| `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS` | `false` | Enables admin-scope operations                   |

Destructive unlink operations additionally require `confirm: true` in the tool call regardless of write flag state.

## Agent skill

This repository ships a GitHub Copilot-compatible skill definition:

- **Skill**: [`skills/teamdynamix/SKILL.md`](skills/teamdynamix/SKILL.md) — ID-first workflow patterns, safety branching rules, runbooks, gotchas, and tool catalog
- **Agent prompt**: [`prompts/teamdynamix-agent.prompt.md`](prompts/teamdynamix-agent.prompt.md) — system prompt for agent mode with TeamDynamix context

Install the skill via your Copilot skill configuration (see `skills/teamdynamix/SKILL.md` for full details).

## Documentation

| Section                                         | Purpose                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ |
| [Tutorials](docs/tutorials/index.md)            | Step-by-step setup and first workflows                       |
| [How-to guides](docs/how-to/index.md)           | Task-oriented recipes for real operations                    |
| [Reference](docs/reference/index.md)            | Exhaustive tool catalog, configuration, safety model, errors |
| [Explanation](docs/explanation/index.md)        | Architecture, auth model, safety rationale, rate limiting    |
| [Development](docs/development/architecture.md) | Architecture, contributing, testing                          |

## Development

```sh
pnpm typecheck   # TypeScript strict checks
pnpm lint        # oxlint
pnpm test        # vitest (194 tests, 87% coverage)
pnpm build       # tsup → dist/
```

## License

MIT © [Daniel Sieradski](https://self.agency)
