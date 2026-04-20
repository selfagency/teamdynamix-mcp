---
title: Resources
---

The server exposes read-only MCP resources for runtime metadata.

## TeamDynamix resources

| URI | Purpose |
| --- | --- |
| `teamdynamix://capabilities` | Snapshot of implemented TeamDynamix gateway tools and per-domain action catalogs |
| `teamdynamix://config` | Sanitized runtime TeamDynamix config + readiness status (credentials redacted) |

## Notes

- `teamdynamix://capabilities` returns a capability summary with both gateway
  tool names and per-domain action lists. Use [Tool Catalog](/reference/tools)
  as the exhaustive reference.
- `teamdynamix://config` never exposes raw credentials — password, key, and token fields are replaced with `[configured]` or `[not set]`.
- Resources are read-only and available regardless of write/admin flag state.
