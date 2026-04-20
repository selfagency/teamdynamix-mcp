import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getTeamDynamixConfig, getTeamDynamixConfigStatus } from '../config.js';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import { TeamDynamixAppIdSchema, TeamDynamixResponseFormatSchema } from '../schemas/teamdynamix/index.js';
import { createConfiguredTeamDynamixClient } from '../services/teamdynamix/client.service.js';
import { redactTeamDynamixConfig } from '../services/teamdynamix/core.service.js';
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

export function registerTeamDynamixDiscoveryTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_server_status`,
    {
      title: 'TeamDynamix Server Status',
      description: 'Returns sanitized TeamDynamix runtime configuration and readiness details.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      const config = getTeamDynamixConfig();
      const status = getTeamDynamixConfigStatus(config);
      const payload = {
        status,
        config: redactTeamDynamixConfig(config),
        discoveryTools: [
          'teamdynamix_server_status',
          'teamdynamix_get_current_user',
          'teamdynamix_list_applications',
          'teamdynamix_list_ticket_statuses',
        ],
      };

      return {
        content: [{ type: 'text', text: render(payload, response_format) }],
        structuredContent: payload,
      };
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_current_user`,
    {
      title: 'TeamDynamix Current User',
      description: 'Authenticates with TeamDynamix and returns the current user profile.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const user = await client.getCurrentUser();
        return {
          content: [{ type: 'text', text: render(user, response_format) }],
          structuredContent: user,
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
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_applications`,
    {
      title: 'TeamDynamix Applications',
      description: 'Returns the applications available in the configured TeamDynamix organization.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const applications = await client.listApplications();
        const payload = {
          count: applications.length,
          applications,
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

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ticket_statuses`,
    {
      title: 'TeamDynamix Ticket Statuses',
      description: 'Returns active ticket statuses for the specified or default ticketing application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema.optional(),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ app_id, response_format }: { app_id?: number; response_format: ResponseFormat }) => {
      try {
        const config = getTeamDynamixConfig();
        const effectiveAppId = app_id ?? config.defaultTicketAppId;
        if (!effectiveAppId) {
          throw new Error(
            'No TeamDynamix ticket application ID was provided. Supply app_id or configure TEAMDYNAMIX_DEFAULT_TICKET_APP_ID.',
          );
        }

        const client = createConfiguredTeamDynamixClient();
        const statuses = await client.listTicketStatuses(effectiveAppId);
        const payload = {
          appId: effectiveAppId,
          count: statuses.length,
          statuses,
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
