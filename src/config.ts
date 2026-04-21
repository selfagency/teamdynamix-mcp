import { z } from 'zod';
import {
  TEAMDYNAMIX_DEFAULT_MAX_RETRIES,
  TEAMDYNAMIX_DEFAULT_TIMEOUT_MS,
  TEAMDYNAMIX_MAX_RETRY_ATTEMPTS,
} from './constants.js';
import type { TeamDynamixAuthMode, TeamDynamixConfig, TeamDynamixConfigStatus } from './types.js';

/**
 * Optional server name override.
 */
export const SERVER_NAME_OVERRIDE: string | undefined = process.env['MCP_SERVER_NAME']?.trim() || undefined;

/**
 * Optional server version override.
 */
export const SERVER_VERSION_OVERRIDE: string | undefined = process.env['MCP_SERVER_VERSION']?.trim() || undefined;

/**
 * Runtime log level used by starter tools and resources.
 */
const validLogLevels = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof validLogLevels)[number];
const rawLogLevel = process.env['MCP_LOG_LEVEL']?.trim() as LogLevel | undefined;
export const LOG_LEVEL: LogLevel = validLogLevels.includes(rawLogLevel as LogLevel)
  ? (rawLogLevel as LogLevel)
  : 'info';

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeOptionalNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return defaultValue;
}

function normalizeNumberWithDefault(value: string | undefined, defaultValue: number, minimum: number): number {
  if (!value?.trim()) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : defaultValue;
}

function normalizeTeamDynamixBaseUrl(value: string | undefined): string | undefined {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.replace(/\/+$/, '') : undefined;
}

function validateHttpsBaseUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const schema = z
    .string()
    .url()
    .refine(url => url.startsWith('https://'), {
      message: 'TEAMDYNAMIX_BASE_URL must be an https URL.',
    });

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid TEAMDYNAMIX_BASE_URL.');
  }

  return value;
}

function normalizeTeamDynamixAuthMode(value: string | undefined): TeamDynamixAuthMode {
  return value?.trim().toLowerCase() === 'admin' ? 'admin' : 'standard';
}

export function getTeamDynamixConfig(): TeamDynamixConfig {
  const baseUrl = validateHttpsBaseUrl(normalizeTeamDynamixBaseUrl(process.env['TEAMDYNAMIX_BASE_URL']));
  const maxRetries = normalizeNumberWithDefault(
    process.env['TEAMDYNAMIX_MAX_RETRIES'],
    TEAMDYNAMIX_DEFAULT_MAX_RETRIES,
    0,
  );
  if (maxRetries > 5) {
    throw new Error(`TEAMDYNAMIX_MAX_RETRIES must be between 0 and ${TEAMDYNAMIX_MAX_RETRY_ATTEMPTS}.`);
  }

  return {
    baseUrl,
    authMode: normalizeTeamDynamixAuthMode(process.env['TEAMDYNAMIX_AUTH_MODE']),
    username: normalizeOptionalString(process.env['TEAMDYNAMIX_USERNAME']),
    password: normalizeOptionalString(process.env['TEAMDYNAMIX_PASSWORD']),
    beid: normalizeOptionalString(process.env['TEAMDYNAMIX_BEID']),
    webServicesKey: normalizeOptionalString(process.env['TEAMDYNAMIX_WEB_SERVICES_KEY']),
    defaultTicketAppId: normalizeOptionalNumber(process.env['TEAMDYNAMIX_DEFAULT_TICKET_APP_ID']),
    defaultAssetAppId: normalizeOptionalNumber(process.env['TEAMDYNAMIX_DEFAULT_ASSET_APP_ID']),
    defaultKnowledgeBaseAppId: normalizeOptionalNumber(process.env['TEAMDYNAMIX_DEFAULT_KB_APP_ID']),
    timeoutMs: normalizeNumberWithDefault(process.env['TEAMDYNAMIX_TIMEOUT_MS'], TEAMDYNAMIX_DEFAULT_TIMEOUT_MS, 1_000),
    maxRetries,
    enableWriteTools: normalizeBoolean(process.env['TEAMDYNAMIX_ENABLE_WRITE_TOOLS'], false),
    enableAdminTools: normalizeBoolean(process.env['TEAMDYNAMIX_ENABLE_ADMIN_TOOLS'], false),
  };
}

export function getTeamDynamixConfigStatus(
  config: TeamDynamixConfig = getTeamDynamixConfig(),
): TeamDynamixConfigStatus {
  const missing = new Set<string>();

  if (!config.baseUrl) {
    missing.add('TEAMDYNAMIX_BASE_URL');
  }

  if (config.authMode === 'admin') {
    if (!config.beid) missing.add('TEAMDYNAMIX_BEID');
    if (!config.webServicesKey) missing.add('TEAMDYNAMIX_WEB_SERVICES_KEY');
  } else {
    if (!config.username) missing.add('TEAMDYNAMIX_USERNAME');
    if (!config.password) missing.add('TEAMDYNAMIX_PASSWORD');
  }

  return {
    configured: missing.size === 0,
    missing: [...missing],
    authMode: config.authMode,
  };
}
