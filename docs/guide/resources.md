---
title: MCP Resources
---

`mcp-server-template` exposes starter read-only MCP resources to demonstrate resource patterns.

## Available Resources

- `template://capabilities`: built-in server tools/resources and version information.
- `template://config`: sanitized runtime configuration snapshot.

## URI Format

Resources are static URIs in this starter template.

```text
template://capabilities
template://config
```

## Resource Contents

### `template://capabilities`

Returns a JSON object with:

- server name and version
- starter tool names
- starter resource names

### `template://config`

Returns a JSON object with:

- effective `basePath`
- `logLevel`
- effective server identity

## When to Use Resources vs. Tools

Use **resources** when:

- Your client supports resource browsing/subscription
- You need stable read-only server metadata
- You want low-friction context for assistants

Use **tools** when:

- You need input-dependent computation
- You want rich structured outputs tied to request arguments
- You are implementing mutating or side-effecting operations
