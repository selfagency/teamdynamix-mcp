export type TemplateErrorKind = 'invalid_input' | 'not_found' | 'permission' | 'conflict' | 'timeout' | 'unknown';

export interface TemplateError {
  readonly kind: TemplateErrorKind;
  readonly message: string;
}

export type ResponseFormat = 'markdown' | 'json';

export interface ToolTextResponse {
  readonly content: Array<{ readonly type: 'text'; readonly text: string }>;
  readonly structuredContent: Record<string, unknown>;
}

export interface SystemInfo {
  readonly platform: NodeJS.Platform;
  readonly release: string;
  readonly nodeVersion: string;
  readonly cpuCount: number;
  readonly uptimeSeconds: number;
  readonly memoryTotalBytes: number;
  readonly memoryFreeBytes: number;
}
