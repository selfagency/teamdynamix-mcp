export type ResponseFormat = 'markdown' | 'json';

export interface ToolTextResponse {
  readonly content: Array<{ readonly type: 'text'; readonly text: string }>;
  readonly structuredContent: Record<string, unknown>;
}

export interface TeamDynamixEntity {
  readonly [key: string]: unknown;
}

export interface TeamDynamixNamedEntity extends TeamDynamixEntity {
  readonly ID: number;
  readonly Name?: string;
}

export interface TeamDynamixApplication extends TeamDynamixNamedEntity {}

export interface TeamDynamixTicket extends TeamDynamixNamedEntity {
  readonly Title?: string;
}

export interface TeamDynamixKbArticle extends TeamDynamixNamedEntity {
  readonly Subject?: string;
}

export interface TeamDynamixAsset extends TeamDynamixNamedEntity {}

export interface TeamDynamixProject extends TeamDynamixNamedEntity {}

export interface TeamDynamixGroup extends TeamDynamixNamedEntity {}

export interface TeamDynamixUser extends TeamDynamixEntity {
  readonly UID: string;
  readonly FullName?: string;
}

export type TeamDynamixAuthMode = 'standard' | 'admin';

export interface TeamDynamixConfig {
  readonly baseUrl?: string;
  readonly authMode: TeamDynamixAuthMode;
  readonly username?: string;
  readonly password?: string;
  readonly beid?: string;
  readonly webServicesKey?: string;
  readonly defaultTicketAppId?: number;
  readonly defaultAssetAppId?: number;
  readonly defaultKnowledgeBaseAppId?: number;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly enableWriteTools: boolean;
  readonly enableAdminTools: boolean;
}

export interface TeamDynamixConfigStatus {
  readonly configured: boolean;
  readonly missing: readonly string[];
  readonly authMode: TeamDynamixAuthMode;
}

export interface TeamDynamixRateLimit {
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly resetAt: string | null;
  readonly waitMs: number;
}

export interface TeamDynamixJsonPatchOperation {
  readonly op: 'add' | 'replace' | 'remove';
  readonly path: string;
  readonly value?: unknown;
}

export type TeamDynamixRequestHeaders = Headers | Readonly<Record<string, string>>;

export type TeamDynamixRequestBody = FormData | URLSearchParams | string;

export interface TeamDynamixRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: TeamDynamixRequestHeaders;
  readonly body?: TeamDynamixRequestBody;
  readonly expectedContentType?: 'json' | 'text';
  readonly requireAdmin?: boolean;
}

// SDK client types
export type { TeamDynamixSdk } from '@selfagency/teamdynamix-ts';
