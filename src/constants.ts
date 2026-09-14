import pkg from '../package.json' with { type: 'json' };

export const SERVER_NAME = 'teamdynamix-mcp';
// Single source of truth: package.json version (no more hardcoded drift)
export const SERVER_VERSION = pkg.version;
export const CHARACTER_LIMIT = 25_000;
export const TEAMDYNAMIX_TOOL_PREFIX = 'teamdynamix';
export const TEAMDYNAMIX_DEFAULT_TIMEOUT_MS = 30_000;
export const TEAMDYNAMIX_DEFAULT_MAX_RETRIES = 2;
export const TEAMDYNAMIX_MAX_RETRY_ATTEMPTS = 5;
export const TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS = 5_000;
export const TEAMDYNAMIX_MAX_RATE_LIMIT_WAIT_MS = 30_000;
