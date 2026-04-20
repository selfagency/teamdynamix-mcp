# mcp-server-template

A production-ready TypeScript template for building Model Context Protocol (MCP) servers.

## What you get

- Stdio-first MCP server bootstrap with `McpServer`
- Utility starter tools with Zod schema validation
- Read-only template resources for capability/config inspection
- Strict TypeScript setup, build/lint/test scripts, and VitePress docs

## Quick start

1. Install dependencies.
2. Start in development mode.
3. Connect with MCP Inspector or your MCP client.

### Development

- `pnpm dev` — run with `tsx` watch mode
- `pnpm build` — bundle to `dist/`
- `pnpm start` — run built server

### MCP Inspector

Use Inspector to connect to the stdio server:

- command: `node`
- args: `--import tsx/esm src/index.ts`

You can then call starter tools:

- `template_ping`
- `echo`
- `text_transform`
- `current_time`
- `system_info`

## Environment variables

- `MCP_BASE_PATH` — optional default base path for tool operations
- `MCP_SERVER_NAME` — optional server name override
- `MCP_SERVER_VERSION` — optional server version override
- `MCP_LOG_LEVEL` — `debug` | `info` | `warn` | `error`

## License

MIT © [Daniel Sieradski](https://self.agency)
