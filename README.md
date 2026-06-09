# 🎟️ TeamDynamix MCP Server (unofficial)

![NPM Version](https://img.shields.io/npm/v/@selfagency/teamdynamix-mcp) [![CI](https://github.com/selfagency/teamdynamix-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/selfagency/teamdynamix-mcp/actions/workflows/ci.yml) [![codecov](https://codecov.io/gh/selfagency/teamdynamix-mcp/graph/badge.svg?token=kYslnQkMFy)](https://codecov.io/gh/selfagency/teamdynamix-mcp)

A TypeScript [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that exposes [TeamDynamix](https://www.teamdynamix.com/) ITSM capabilities as agent-callable tools. Designed for AI agents and MCP clients that need structured, safety-gated access to TeamDynamix operations.

## Features

- **Powered by the official TeamDynamix TypeScript SDK**: type-safe, auto-generated API methods with built-in retry, exponential backoff, runtime validation, and token lifecycle management
- **11 domain gateway tools** that route validated actions across discovery,
  tickets, relationships, KB, assets, CMDB, people, services, projects,
  time, and reference data
- **Safe by default**: write tools disabled until explicitly opted in;
  destructive operations require `confirm: true`
- **Two auth modes**: standard (username/password) and admin (BEID/WebServicesKey)
- **Covers 207 API endpoints** across all TeamDynamix domains, verified against the SDK route manifest
- **Rate-limit aware**: SDK built-in retry with exponential backoff on 429 and 5xx responses
- **Zod-validated inputs**: schema enforcement before any API call
- **Agent skill and prompt included**: ready-to-use skill definition for
  GitHub Copilot and compatible agents

## MCP Registry

This server is published to the [MCP Registry](https://modelcontextprotocol.io/) as `io.github.selfagency/teamdynamix-mcp`.

- **Registry name**: `io.github.selfagency/teamdynamix-mcp`
- **Install via registry**: `mcp-install io.github.selfagency/teamdynamix-mcp` (when available)
- **Manual install**: Use npm package `@selfagency/teamdynamix-mcp` as shown below

## Quick start (developer setup)

This quick start is for contributors running the server from source in this
repository. If you are a regular MCP client user, skip to
[MCP client configuration](#mcp-client-configuration) and use the `npx`
command examples.

```sh
# 1. Clone the repository
git clone https://github.com/selfagency/teamdynamix-mcp.git
cd teamdynamix-mcp

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your TeamDynamix credentials and base URL

# 4. Start the development server
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

> **Security notice:** Values shown above are placeholders. **Never commit real credentials to source control.**
> Inject secrets at runtime via a `.env` file (excluded by `.gitignore`), CI/CD secrets, or a secret manager.

### VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "teamdynamix": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@selfagency/teamdynamix-mcp"],
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
      "command": "npx",
      "args": ["-y", "@selfagency/teamdynamix-mcp"],
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
  "command": "npx",
  "args": ["-y", "@selfagency/teamdynamix-mcp"]
}
```

### Verify connectivity

After connecting your MCP client, call `teamdynamix_discovery` with:

- `action: "server_status"`
- `payload: {}`
- `response_format: "json"`

A successful response shows `status.configured: true`.

## Domain gateway tools

Each gateway tool accepts:

- `action`: domain-specific operation name
- `payload`: object for that action’s parameters
- `response_format`: `"markdown"` or `"json"`

| Domain               | Gateway tool                       |
| -------------------- | ---------------------------------- |
| Discovery            | `teamdynamix_discovery`            |
| Tickets              | `teamdynamix_tickets`              |
| Ticket relationships | `teamdynamix_ticket_relationships` |
| Knowledge Base       | `teamdynamix_knowledge_base`       |
| Assets               | `teamdynamix_assets`               |
| CMDB                 | `teamdynamix_cmdb`                 |
| People               | `teamdynamix_people`               |
| Services             | `teamdynamix_services`             |
| Projects             | `teamdynamix_projects`             |
| Time                 | `teamdynamix_time`                 |
| Reference data       | `teamdynamix_reference_data`       |

† Requires `confirm: true` in addition to write tools being enabled.

All write/mutating actions require `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`.

## Safety defaults

| Flag                             | Default | Effect when `true`                               |
| -------------------------------- | ------- | ------------------------------------------------ |
| `TEAMDYNAMIX_ENABLE_WRITE_TOOLS` | `false` | Enables all create/update/comment/mutation tools |
| `TEAMDYNAMIX_ENABLE_ADMIN_TOOLS` | `false` | Enables admin-scope operations                   |

Destructive unlink operations additionally require `confirm: true` in the
tool call regardless of write flag state.

## Agent skill

This repository ships a GitHub Copilot-compatible skill definition:

- **Skill**: [`skills/teamdynamix/SKILL.md`](skills/teamdynamix/SKILL.md)
  — ID-first workflow patterns, safety branching rules, runbooks,
  gotchas, and tool catalog
- **Agent prompt**:
  [`prompts/teamdynamix-agent.prompt.md`](prompts/teamdynamix-agent.prompt.md)
  — system prompt for agent mode with TeamDynamix context

Install the skill via your Copilot skill configuration
(see `skills/teamdynamix/SKILL.md` for full details).

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

MIT © [The Self Agency LLC](https://self.agency)
