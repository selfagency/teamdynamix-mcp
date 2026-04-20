---
title: Configuration
---

`mcp-server-template` is configured through environment variables and optional CLI flags.

## Environment Variables

- `MCP_BASE_PATH` (default: unset): optional default path for tools that accept `base_path`.
- `MCP_SERVER_NAME` (default: `mcp-server-template`): overrides server name at initialize time.
- `MCP_SERVER_VERSION` (default: `0.2.0`): overrides server version at initialize time.
- `MCP_LOG_LEVEL` (default: `info`): runtime log level (`debug`, `info`, `warn`, `error`).

## CLI Flags

- `--base-path`: CLI alternative to `MCP_BASE_PATH`.

## Example MCP Client Config

Pass variables in the `env` block of your MCP server config:

```json
{
  "mcpServers": {
    "template": {
      "command": "node",
      "args": ["--import", "tsx/esm", "/absolute/path/to/src/index.ts"],
      "env": {
        "MCP_BASE_PATH": "/home/user/myproject",
        "MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Shell Example

Export variables before starting the server:

```bash
export MCP_BASE_PATH=/home/user/myproject
export MCP_LOG_LEVEL=debug
node --import tsx/esm src/index.ts
```
