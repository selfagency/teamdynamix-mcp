# Manual MCP Registry Publishing

If the automated GitHub Actions workflow fails or you need to publish server.json manually, follow this fallback runbook.

## Prerequisites

- Node.js 20+ installed
- `@modelcontextprotocol/publisher` CLI installed globally
- Domain ownership verified at [self.agency](https://self.agency)

## Step 1: Install mcp-publisher CLI

```bash
npm install -g @modelcontextprotocol/publisher@latest
```

## Step 2: Verify server.json

Confirm `server.json` exists at repository root and has correct values:

```bash
# Verify mcpName matches package.json
jq '.name' server.json # Should be: agency.self/teamdynamix-mcp
jq '.packages[0].identifier' server.json # Should be: @selfagency/teamdynamix-mcp

# Verify version alignment
jq '.version' server.json # Should match package.json version
jq '.packages[0].version' server.json # Should match package.json version
```

Expected structure:

- `name` matches `package.json.mcpName`
- `version` matches `package.json.version`
- `packages[0].identifier` is `@selfagency/teamdynamix-mcp`
- `environmentVariables` includes all required TeamDynamix env vars

## Step 3: Publish server.json



From the repository root:

```bash
# Publish to MCP Registry
mcp-publisher publish server.json --domain self.agency
```

Expected output:

```text
✓ Validated server.json
✓ Domain ownership verified: self.agency
✓ Published agency.self/teamdynamix-mcp v0.2.0
```

## Step 5: Verify publication

Confirm:

- Server name: `agency.self/teamdynamix-mcp`
- Version: Matches your published version
- Environment variables documented correctly
- Package listing shows npm transport



Check that your server appears in the MCP Registry:

```bash
# Search for your server (when CLI search is available)
mcp-publisher search agency.self/teamdynamix-mcp

# Or verify via web UI at modelcontextprotocol.io
```

Confirm:
- Server name: `agency.self/teamdynamix-mcp`
- Version: Matches your published version
- Environment variables documented correctly
- Package listing shows npm transport

## Troubleshooting

### Domain ownership not verified

**Error**: `Domain ownership verification failed for self.agency`

**Fix**:

1. Visit [MCP Registry domain verification](https://modelcontextprotocol.io/domains)
2. Follow the DNS or TXT record verification steps
3. Wait for propagation (may take up to 24 hours)
4. Retry publish command

### Invalid server.json

**Error**: `server.json validation failed: mcpName does not match package.json`

**Fix**:

1. Run `pnpm build` to sync versions
2. Check `dist/package.json` contains `mcpName` field
3. Verify `server.json.version` matches `package.json.version`

### Auth token invalid

**Error**: `Authentication failed: Invalid MCP_PUBLISHER_TOKEN`

**Fix**:

1. Regenerate domain auth token at MCP Registry dashboard
2. Ensure token is set in `MCP_PUBLISHER_TOKEN` env var
3. Check for trailing spaces or newline in token value

### Version mismatch

**Error**: `Package version X.Y.Z in npm does not match server.json version A.B.C`

**Fix**:

1. Run `npm publish` to push npm package first
2. Wait for npm registry propagation (usually < 1 minute)
3. Retry `mcp-publisher publish server.json`

### CI workflow failure

If GitHub Actions workflow `.github/workflows/publish-mcp-registry.yml` fails:

1. Check workflow logs for specific error
2. Verify `MCP_PUBLISHER_TOKEN` secret is set in repo settings
3. Ensure token has `publish` scope for your domain
4. Confirm `server.json` committed to main branch
5. Re-run workflow after fixing issue

## Automation notes

- **Automated trigger**: The workflow runs automatically on git tags matching `v*` (e.g., `v0.2.0`)
- **Manual trigger**: Use GitHub Actions UI to run `Publish to MCP Registry` workflow with version input
- **Publish order**: The existing release.yml workflow publishes npm first; then MCP registry workflow publishes server.json

## Required secrets

For GitHub Actions CI/CD with OIDC:

**No secrets required**. The workflow uses OpenID Connect (OIDC) authentication, which automatically generates short-lived tokens based on GitHub Actions identity and domain verification at `self.agency`.

For manual publishing:
- You must manually authenticate with your domain credentials or use the MCP Registry dashboard to publish server.json directly

## OIDC Authentication

This repository uses OpenID Connect (OIDC) for MCP Registry authentication:

- **Automated (CI/CD)**: GitHub Actions workflow authenticates automatically using OIDC without secrets
- **Manual (local)**: Requires domain credentials or dashboard access
- **Security**: OIDC provides short-lived tokens, reducing credential exposure risk
- **Domain verification**: Your domain (`self.agency`) must be verified with the MCP Registry

## Related guides

## Related guides

- [Getting started](../tutorials/getting-started.md) - Initial setup and configuration
- [Troubleshooting](./troubleshooting.md) - Common issues and resolutions
- [Development architecture](../development/architecture.md) - Build and test procedures
