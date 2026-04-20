import path from 'node:path';

/**
 * Parses --base-path from process.argv.
 * Supports both `--base-path /path` and `--base-path=/path` forms.
 */
function parseCliBasePath(): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (arg === '--base-path' && i + 1 < args.length) {
      return args[i + 1];
    }
    const match = /^--base-path=(.+)$/.exec(arg);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

const configuredBasePath: string | undefined = process.env['MCP_BASE_PATH'] ?? parseCliBasePath();

/**
 * Optional server-level default base path, resolved to an absolute path.
 * Set via the MCP_BASE_PATH environment variable or --base-path CLI argument.
 */
export const DEFAULT_BASE_PATH: string | undefined = configuredBasePath ? path.resolve(configuredBasePath) : undefined;

/**
 * Resolves an effective file-system path for tool requests.
 * Uses the provided path if given, otherwise falls back to the server default base path.
 * Throws a clear error if neither is available.
 */
export function resolveBasePath(basePath: string | undefined): string {
  const resolved = basePath ?? DEFAULT_BASE_PATH;
  if (!resolved) {
    throw new Error(
      'No base path provided. Pass base_path in the tool request, ' +
        'or configure a server default via the MCP_BASE_PATH environment variable ' +
        'or the --base-path CLI argument.',
    );
  }
  return resolved;
}

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
export const LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' =
  process.env['MCP_LOG_LEVEL'] === 'debug' ||
  process.env['MCP_LOG_LEVEL'] === 'warn' ||
  process.env['MCP_LOG_LEVEL'] === 'error'
    ? process.env['MCP_LOG_LEVEL']
    : 'info';
