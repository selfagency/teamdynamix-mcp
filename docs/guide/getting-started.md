---
title: Getting Started
---

`mcp-server-template` is a production-grade [Model Context Protocol](https://modelcontextprotocol.io) server starter built with TypeScript. It provides a clean baseline you can adapt to any domain.

## Prerequisites

- Node.js 20 or later
- An MCP-compatible client (Claude Desktop, VS Code Copilot, etc.)

## Installation

### From source

```bash
git clone https://github.com/selfagency/mcp-server-template.git
cd mcp-server-template
pnpm install
pnpm dev
```

## Connecting to Claude Desktop

Edit your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "template": {
      "command": "node",
      "args": ["--import", "tsx/esm", "/absolute/path/to/mcp-server-template/src/index.ts"],
      "env": {
        "MCP_BASE_PATH": "/path/to/your/workspace"
      }
    }
  }
}
```

Restart Claude Desktop after saving the file. You should see a hammer icon in the chat toolbar indicating MCP tools are available.

## Connecting to VS Code (GitHub Copilot)

### User settings

Add to your VS Code `settings.json` (`Cmd+Shift+P` → "Open User Settings (JSON)"):

```json
{
  "mcp": {
    "servers": {
      "template": {
        "type": "stdio",
        "command": "node",
        "args": ["--import", "tsx/esm", "${workspaceFolder}/src/index.ts"],
        "env": {
          "MCP_BASE_PATH": "${workspaceFolder}"
        }
      }
    }
  }
}
```

### Workspace `.vscode/mcp.json`

For per-project configuration, create `.vscode/mcp.json` in the root of your repository:

```json
{
  "servers": {
    "template": {
      "type": "stdio",
      "command": "node",
      "args": ["--import", "tsx/esm", "${workspaceFolder}/src/index.ts"],
      "env": {
        "MCP_BASE_PATH": "${workspaceFolder}"
      }
    }
  }
}
```

## Setting a Default Base Path

The `MCP_BASE_PATH` environment variable sets an optional default path used by tools when `base_path` is omitted:

```bash
MCP_BASE_PATH=/home/user/myproject pnpm dev
```

You can also pass it on the command line:

```bash
node --import tsx/esm src/index.ts --base-path /home/user/myproject
```

If neither is set, any tool that requires a path must receive it explicitly.

## Verifying the Installation

Ask your AI assistant:

> "Call `template_ping` with message `hello`"

or

> "Transform this text to slug format: `Hello MCP Server`"

If you see a connection issue, verify the command path and restart your MCP client.

## Next Steps

- [Configuration reference](/guide/configuration) — all environment variables
- [MCP Resources](/guide/resources) — URI-addressable read-only data
- [Tool reference](/tools/) — complete parameter documentation for starter tools
- [Safety model](/guide/safety) — extending the template safely
