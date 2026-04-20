---
title: Safety Model
---

`mcp-server-template` is built around the principle that **every mutating action can be risky**. The starter code shows defensive patterns you can apply to domain-specific tools.

## Validate Before Execute

Every tool should validate inputs with Zod before any side effects.

## Confirm Destructive Operations

If a tool can delete data or trigger irreversible operations, require an explicit `confirm: true` parameter.

```json
{
  "tool": "dangerous_operation",
  "params": {
    "target": "resource-id",
    "confirm": true
  }
}
```

Reject when confirmation is missing and explain how to proceed safely.

## Keep Dangerous Capabilities Opt-In

Environment-based gates are useful for risky behavior. Example pattern:

```bash
MCP_ENABLE_DESTRUCTIVE_TOOLS=true
```

Default to safer alternatives and explicit user intent.

## Sanitize Outputs

Never return secrets or credentials from tools/resources. Redact sensitive fields before returning structured content.

## Use Bounded Responses

Limit very large responses to avoid client instability. Include truncation indicators when data is shortened.

## Fail Explicitly

Return clear, actionable errors with category and next step guidance. Do not swallow exceptions.

## Path and Input Safety

If tools accept paths, validate them against allowed roots and reject traversal attempts such as `../..`.

## Summary of Safeguards

| Risk Area            | Recommended Safeguard                  |
| -------------------- | -------------------------------------- |
| Destructive actions  | `confirm: true` gate                   |
| Secret exposure      | Redaction before response output       |
| Oversized payloads   | Character limits and truncation notice |
| Path handling        | Root-bound path validation             |
| Runtime failures     | Structured, actionable error responses |
