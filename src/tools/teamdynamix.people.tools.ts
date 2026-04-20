import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  GroupSearchSchema,
  TeamDynamixGuidSchema,
  TeamDynamixResponseFormatSchema,
  UserSearchSchema,
} from '../schemas/teamdynamix/index.js';
import { createConfiguredTeamDynamixClient } from '../services/teamdynamix/client.service.js';
import type { ResponseFormat } from '../types.js';

function render(data: unknown, responseFormat: ResponseFormat): string {
  if (responseFormat === 'json') return JSON.stringify(data, null, 2);
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerTeamDynamixPeopleTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_user`,
    {
      title: 'Get User',
      description: 'Retrieves a TeamDynamix user profile by their GUID (UID).',
      inputSchema: {
        uid: TeamDynamixGuidSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ uid, response_format }: { uid: string; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const user = await client.getUser(uid);
        return {
          content: [{ type: 'text', text: render(user, response_format) }],
          structuredContent: user,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_users`,
    {
      title: 'Search Users',
      description: 'Searches TeamDynamix users by name, username, email, and optional filters.',
      inputSchema: {
        search: UserSearchSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({
      search,
      response_format,
    }: {
      search: z.infer<typeof UserSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const users = await client.searchUsers(search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(users, response_format) }],
          structuredContent: { count: users.length, users },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_group`,
    {
      title: 'Get Group',
      description: 'Retrieves details for a TeamDynamix group by its numeric ID.',
      inputSchema: {
        group_id: z.number().int().positive().describe('TeamDynamix group ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ group_id, response_format }: { group_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const group = await client.getGroup(group_id);
        return {
          content: [{ type: 'text', text: render(group, response_format) }],
          structuredContent: group,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_groups`,
    {
      title: 'Search Groups',
      description: 'Searches TeamDynamix groups by partial name and optional filters.',
      inputSchema: {
        search: GroupSearchSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({
      search,
      response_format,
    }: {
      search: z.infer<typeof GroupSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const groups = await client.searchGroups(search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(groups, response_format) }],
          structuredContent: { count: groups.length, groups },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_group_members`,
    {
      title: 'Get Group Members',
      description: 'Returns all members of a TeamDynamix group.',
      inputSchema: {
        group_id: z.number().int().positive().describe('TeamDynamix group ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ group_id, response_format }: { group_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const members = await client.getGroupMembers(group_id);
        return {
          content: [{ type: 'text', text: render(members, response_format) }],
          structuredContent: { groupId: group_id, count: members.length, members },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
