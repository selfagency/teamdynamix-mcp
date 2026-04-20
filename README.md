# teamdynamix-mcp

`teamdynamix-mcp` is a TypeScript Model Context Protocol (MCP) server that exposes TeamDynamix ITSM capabilities as agent-callable tools.

It is designed for AI agent builders using MCP clients (VS Code, Claude Desktop, MCP Inspector) who need safe, structured access to:

- tickets and ticket metadata
- knowledge base articles
- assets and CMDB configuration items
- users, groups, accounts, locations, and custom attributes
- service catalog, projects, and time entries

## Quick start

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Example MCP client configuration (stdio transport):

```json
{
  "command": "node",
  "args": ["--import", "tsx/esm", "src/index.ts"]
}
```

Verify connectivity by calling `teamdynamix_server_status` with `response_format: "json"` from your MCP client.

## Safety defaults

- Write tools are disabled by default (`TEAMDYNAMIX_ENABLE_WRITE_TOOLS=false`)
- Admin tools are disabled by default (`TEAMDYNAMIX_ENABLE_ADMIN_TOOLS=false`)
- Destructive unlink operations require explicit `confirm: true`
- Inputs are validated with Zod before API calls
- 429 responses are retried with rate-limit-aware waiting

## Documentation

- Start here: [docs/index.md](docs/index.md)
- Tutorials: [docs/tutorials/index.md](docs/tutorials/index.md)
- How-to guides: [docs/how-to/index.md](docs/how-to/index.md)
- Reference (exhaustive tools + config): [docs/reference/index.md](docs/reference/index.md)
- Explanation (architecture and safety rationale): [docs/explanation/index.md](docs/explanation/index.md)
- Development docs: [docs/development/architecture.md](docs/development/architecture.md)

## Skills and agent definitions

- Skill: [skills/teamdynamix/SKILL.md](skills/teamdynamix/SKILL.md)
- Agent prompt: [prompts/teamdynamix-agent.prompt.md](prompts/teamdynamix-agent.prompt.md)

## Development checks

```sh
pnpm typecheck
pnpm lint
pnpm test
```

## License

MIT © [Daniel Sieradski](https://self.agency)
