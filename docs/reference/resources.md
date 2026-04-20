---
title: Resources
---

The server exposes read-only MCP resources for runtime metadata.

## TeamDynamix resources

| URI | Purpose |
| --- | --- |
| `teamdynamix://capabilities` | Snapshot of implemented TeamDynamix capabilities |
| `teamdynamix://config` | Sanitized runtime TeamDynamix config + readiness status |

## Template resources

| URI | Purpose |
| --- | --- |
| `template://capabilities` | Server metadata and baseline tool/resource listing |
| `template://config` | Sanitized runtime server identity and log/base-path values |

## Notes

- `teamdynamix://capabilities` currently returns a minimal capability slice and should be treated as a snapshot, not a full tool contract.
- Use [Tool Catalog](/reference/tools) as the exhaustive tool reference.
