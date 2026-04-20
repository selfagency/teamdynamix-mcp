import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  AssetSearchSchema,
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

export function registerTeamDynamixAssetTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_asset`,
    {
      title: 'Get Asset',
      description: 'Retrieves full details for a TeamDynamix asset (CI/CMDB item) by its numeric ID.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        asset_id: z.number().int().positive().describe('Asset ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      asset_id,
      response_format,
    }: {
      app_id: number;
      asset_id: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const asset = await client.getAsset(app_id, asset_id);
        return {
          content: [{ type: 'text', text: render(asset, response_format) }],
          structuredContent: asset,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_assets`,
    {
      title: 'Search Assets',
      description: 'Searches TeamDynamix assets by serial number, tag, status, owner, or keyword.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        search: AssetSearchSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      search,
      response_format,
    }: {
      app_id: number;
      search: z.infer<typeof AssetSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const assets = await client.searchAssets(app_id, search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(assets, response_format) }],
          structuredContent: { appId: app_id, count: assets.length, assets },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_asset_statuses`,
    {
      title: 'List Asset Statuses',
      description: 'Returns all asset lifecycle statuses defined in the TeamDynamix CMDB application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const statuses = await client.listAssetStatuses(app_id);
        return {
          content: [{ type: 'text', text: render(statuses, response_format) }],
          structuredContent: { appId: app_id, count: statuses.length, statuses },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_product_models`,
    {
      title: 'List Product Models',
      description: 'Returns all product/model definitions available in the TeamDynamix CMDB application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const models = await client.listProductModels(app_id);
        return {
          content: [{ type: 'text', text: render(models, response_format) }],
          structuredContent: { appId: app_id, count: models.length, models },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
