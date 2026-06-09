/**
 * TeamDynamix CI / CMDB tools:
 * get CI, search CIs, list CI types, list CI relationship types, list vendors.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  CiSearchSchema,
  TeamDynamixAppIdSchema,
  TeamDynamixResponseFormatSchema,
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

export function registerTeamDynamixCmdbTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_ci`,
    {
      title: 'Get Configuration Item',
      description: 'Retrieves a single TeamDynamix configuration item (CI) by ID.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ci_id: z.number().int().positive().describe('Configuration item ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, ci_id, response_format }: { app_id: number; ci_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const ci = await client.getConfigurationItem(app_id, ci_id);
        return {
          content: [{ type: 'text', text: render(ci, response_format) }],
          structuredContent: ci as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_cis`,
    {
      title: 'Search Configuration Items',
      description: 'Searches TeamDynamix CMDB for configuration items matching the given criteria.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        search: CiSearchSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      search,
      response_format,
    }: {
      app_id: number;
      search: z.infer<typeof CiSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const results = await client.searchConfigurationItems(app_id, search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(results, response_format) }],
          structuredContent: { count: Array.isArray(results) ? results.length : 0, results },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ci_types`,
    {
      title: 'List CI Types',
      description: 'Returns all configuration item types defined in a TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const types = await client.listCiTypes(app_id);
        return {
          content: [{ type: 'text', text: render(types, response_format) }],
          structuredContent: { appId: app_id, count: types.length, types },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ci_relationship_types`,
    {
      title: 'List CI Relationship Types',
      description: 'Returns all CI relationship type definitions (e.g. "Runs On", "Hosted By") in TeamDynamix.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const types = await client.listCiRelationshipTypes();
        return {
          content: [{ type: 'text', text: render(types, response_format) }],
          structuredContent: { count: types.length, types },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_vendors`,
    {
      title: 'List Vendors',
      description: 'Returns all vendors defined in a TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const vendors = await client.listVendors(app_id);
        return {
          content: [{ type: 'text', text: render(vendors, response_format) }],
          structuredContent: { appId: app_id, count: vendors.length, vendors },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
