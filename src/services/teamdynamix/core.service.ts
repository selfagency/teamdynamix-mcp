import { TEAMDYNAMIX_MAX_RATE_LIMIT_WAIT_MS, TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS } from '../../constants.js';
import type { TeamDynamixConfig, TeamDynamixJsonPatchOperation, TeamDynamixRateLimit } from '../../types.js';

function normalizePatchPath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const segments = withLeadingSlash.split('/');
  return segments
    .map((segment, index) => {
      if (index === 0 || segment.length === 0) {
        return segment;
      }

      return /^\d+$/.test(segment) ? segment : segment.toLowerCase();
    })
    .join('/');
}

export function buildTeamDynamixJsonPatchDocument(
  operations: readonly TeamDynamixJsonPatchOperation[],
): readonly TeamDynamixJsonPatchOperation[] {
  return operations.map(operation => {
    if (operation.op === 'remove') {
      return {
        op: operation.op,
        path: normalizePatchPath(operation.path),
      };
    }

    return {
      op: operation.op,
      path: normalizePatchPath(operation.path),
      value: operation.value ?? null,
    };
  });
}

export function toTeamDynamixDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError(`Invalid date value: "${String(value)}"`);
  }
  return date.toISOString();
}

export function toTeamDynamixDateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError(`Invalid date value: "${String(value)}"`);
  }
  return date.toISOString().slice(0, 10);
}

export function parseRateLimit(headers: Headers, nowMs = Date.now()): TeamDynamixRateLimit {
  const limitRaw = headers.get('X-RateLimit-Limit');
  const remainingRaw = headers.get('X-RateLimit-Remaining');
  const resetRaw = headers.get('X-RateLimit-Reset');
  const resetTime = resetRaw ? Date.parse(resetRaw) : Number.NaN;
  const computedWaitMs = Number.isFinite(resetTime) ? resetTime - nowMs : TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS;
  const waitMs = Math.min(
    Math.max(
      Number.isFinite(computedWaitMs) ? computedWaitMs : TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS,
      TEAMDYNAMIX_MIN_RATE_LIMIT_WAIT_MS,
    ),
    TEAMDYNAMIX_MAX_RATE_LIMIT_WAIT_MS,
  );

  return {
    limit: limitRaw ? Number.parseInt(limitRaw, 10) : null,
    remaining: remainingRaw ? Number.parseInt(remainingRaw, 10) : null,
    resetAt: Number.isFinite(resetTime) ? new Date(resetTime).toISOString() : null,
    waitMs,
  };
}

export function redactTeamDynamixConfig(config: TeamDynamixConfig): Record<string, unknown> {
  return {
    baseUrl: config.baseUrl ?? null,
    authMode: config.authMode,
    username: config.username ? '[configured]' : null,
    password: config.password ? '[configured]' : null,
    beid: config.beid ? '[configured]' : null,
    webServicesKey: config.webServicesKey ? '[configured]' : null,
    defaultTicketAppId: config.defaultTicketAppId ?? null,
    defaultAssetAppId: config.defaultAssetAppId ?? null,
    defaultKnowledgeBaseAppId: config.defaultKnowledgeBaseAppId ?? null,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    enableWriteTools: config.enableWriteTools,
    enableAdminTools: config.enableAdminTools,
  };
}

export function decodeJwtExpiryEpochSeconds(token: string): number | null {
  const segments = token.split('.');
  const payload = segments[1];
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const decoded = Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as { exp?: unknown };
    return typeof parsed.exp === 'number' ? parsed.exp : null;
  } catch {
    return null;
  }
}

export function extractAuthToken(payload: unknown): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Unable to extract bearer token from TeamDynamix authentication response.');
  }

  const record = payload as Record<string, unknown>;
  const candidateKeys = ['token', 'Token', 'accessToken', 'AccessToken', 'bearerToken', 'TokenText', 'value'];
  for (const key of candidateKeys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  throw new Error('Unable to extract bearer token from TeamDynamix authentication response.');
}
