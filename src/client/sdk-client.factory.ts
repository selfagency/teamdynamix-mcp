import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTeamDynamixClient, loginWithPassword, loginWithServiceAccount } from '@selfagency/teamdynamix-ts';
import type { TeamDynamixClientConfig, TeamDynamixSdk } from '@selfagency/teamdynamix-ts';
import type { TeamDynamixConfig } from '../types.js';

// ponytail: resolve spec from installed SDK package, not process.cwd() — host cwd is
// C:\Windows\System32 under Raycast/MCP hosts. Remove when SDK ships module-relative defaultSpecPath.
let cachedSpecPath: string | undefined;
function resolveSdkSpecPath(): string | undefined {
  const override = process.env['TEAMDYNAMIX_SPEC_PATH']?.trim();
  if (override) return override;
  if (cachedSpecPath) return cachedSpecPath;
  try {
    const require = createRequire(fileURLToPath(import.meta.url));
    const pkgPath = require.resolve('@selfagency/teamdynamix-ts/package.json');
    const pkgRoot = dirname(pkgPath);
    const candidates = [
      resolve(pkgRoot, 'dist/generated/openapi.json'),
      resolve(pkgRoot, 'generated/openapi.json'),
      resolve(pkgRoot, 'src/generated/openapi.json'),
    ];
    cachedSpecPath = candidates.find(p => existsSync(p));
    return cachedSpecPath;
  } catch {
    return undefined;
  }
}
/**
 * Creates a token provider for the SDK client.
 *
 * Supports two auth modes:
 * - Standard: username/password
 * - Admin: BEID/WebServicesKey
 */
function createTokenProvider(config: TeamDynamixConfig, tenant: string): () => string | Promise<string> {
  if (config.authMode === 'admin') {
    if (!config.beid || !config.webServicesKey) {
      throw new Error('BEID and WebServicesKey are required for admin authentication');
    }

    return loginWithServiceAccount({
      tenant,
      beid: config.beid,
      webServicesKey: config.webServicesKey,
    });
  }

  if (!config.username || !config.password) {
    throw new Error('Username and password are required for standard authentication');
  }

  return loginWithPassword({
    tenant,
    username: config.username,
    password: config.password,
  });
}

/**
 * Extracts the tenant from a baseUrl.
 *
 * Examples:
 * - "https://mytenant.teamdynamix.com/TDWebApi" → "mytenant"
 * - "https://td.myuniversity.edu/TDWebApi" → "td.myuniversity.edu"
 */
function extractTenant(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, '').replace(/\/TDWebApi$/, '');
  const withoutProtocol = normalized.replace(/^https?:\/\//, '');
  const parts = withoutProtocol.split('/');
  return parts[0] ?? '';
}

/**
 * Builds an SDK client config from the MCP server config.
 */
function buildSdkConfig(
  config: TeamDynamixConfig,
  tenant: string,
  tokenProvider: () => string | Promise<string>,
): TeamDynamixClientConfig {
  return {
    tenant,
    tokenProvider,
    environment: config.baseUrl?.includes('sandbox') ? 'sandbox' : 'production',
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
    runtimeValidationMode: 'fail-open',
    ...(resolveSdkSpecPath() ? { specPath: resolveSdkSpecPath() as string } : {}),
    retryPolicy: {
      maxRetries: config.maxRetries,
    },
  };
}

/**
 * Creates an SDK client from MCP config.
 * Returns the TeamDynamix SDK client with full domain access.
 */
export async function createMcpSdkClient(config: TeamDynamixConfig): Promise<TeamDynamixSdk> {
  const tenant = extractTenant(config.baseUrl ?? '');
  const tokenProvider = createTokenProvider(config, tenant);
  const sdkConfig = buildSdkConfig(config, tenant, tokenProvider);
  const { client } = await createTeamDynamixClient(sdkConfig);
  return client;
}
