import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ResponseFormatSchema, TextSchema, TextTransformModeSchema } from '../schemas/index.js';
import { getCurrentTime, getSystemInfo, transformText } from '../services/utility.service.js';
import type { ResponseFormat } from '../types.js';

function render(data: unknown, responseFormat: ResponseFormat): string {
  if (responseFormat === 'json') {
    return JSON.stringify(data, null, 2);
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data, null, 2);
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerUtilityTools(server: McpServer): void {
  server.registerTool(
    'echo',
    {
      title: 'Echo Text',
      description: 'Returns text exactly as provided. Useful for connectivity checks and prompt debugging.',
      inputSchema: {
        text: TextSchema,
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ text, response_format }: { text: string; response_format: ResponseFormat }) => {
      try {
        const payload = { text };
        return {
          content: [{ type: 'text', text: render(payload, response_format) }],
          structuredContent: payload,
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error (unknown): ${messageFromError(error)}` }],
          structuredContent: {
            ok: false,
            kind: 'unknown',
            message: messageFromError(error),
          },
        };
      }
    },
  );

  server.registerTool(
    'text_transform',
    {
      title: 'Transform Text',
      description: 'Transforms input text using uppercase, lowercase, trim, or slug operations.',
      inputSchema: {
        text: TextSchema,
        mode: TextTransformModeSchema,
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({
      text,
      mode,
      response_format,
    }: {
      text: string;
      mode: 'uppercase' | 'lowercase' | 'trim' | 'slug';
      response_format: ResponseFormat;
    }) => {
      try {
        const payload = transformText(text, mode);
        return {
          content: [{ type: 'text', text: render(payload, response_format) }],
          structuredContent: payload,
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error (unknown): ${messageFromError(error)}` }],
          structuredContent: {
            ok: false,
            kind: 'unknown',
            message: messageFromError(error),
          },
        };
      }
    },
  );

  server.registerTool(
    'current_time',
    {
      title: 'Current Time',
      description: 'Returns current server time in ISO and localized display format.',
      inputSchema: {
        time_zone: z.string().optional(),
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ time_zone, response_format }: { time_zone?: string; response_format: ResponseFormat }) => {
      try {
        const payload = getCurrentTime(time_zone);
        return {
          content: [{ type: 'text', text: render(payload, response_format) }],
          structuredContent: payload,
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error (unknown): ${messageFromError(error)}` }],
          structuredContent: {
            ok: false,
            kind: 'unknown',
            message: messageFromError(error),
          },
        };
      }
    },
  );

  server.registerTool(
    'system_info',
    {
      title: 'System Info',
      description: 'Returns non-sensitive runtime and host information for diagnostics.',
      inputSchema: {
        response_format: ResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const systemInfo = getSystemInfo();
        const payload = {
          platform: systemInfo.platform,
          release: systemInfo.release,
          nodeVersion: systemInfo.nodeVersion,
          cpuCount: systemInfo.cpuCount,
          uptimeSeconds: systemInfo.uptimeSeconds,
          memoryTotalBytes: systemInfo.memoryTotalBytes,
          memoryFreeBytes: systemInfo.memoryFreeBytes,
        };
        return {
          content: [{ type: 'text', text: render(payload, response_format) }],
          structuredContent: payload,
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error (unknown): ${messageFromError(error)}` }],
          structuredContent: {
            ok: false,
            kind: 'unknown',
            message: messageFromError(error),
          },
        };
      }
    },
  );
}
