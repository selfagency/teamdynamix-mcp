import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getTeamDynamixConfig } from '../config.js';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  KbArticleCreateSchema,
  KbArticleSearchSchema,
  KbArticleUpdateSchema,
  TeamDynamixAppIdSchema,
  TeamDynamixResponseFormatSchema,
} from '../schemas/teamdynamix/index.js';
import { assertWriteToolsEnabled, createConfiguredTeamDynamixClient } from '../services/teamdynamix/client.service.js';
import type { ResponseFormat } from '../types.js';

function render(data: unknown, responseFormat: ResponseFormat): string {
  if (responseFormat === 'json') return JSON.stringify(data, null, 2);
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerTeamDynamixKbTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_kb_article`,
    {
      title: 'Get Knowledge Base Article',
      description: 'Retrieves the full content of a TeamDynamix Knowledge Base article by its numeric ID.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        article_id: z.number().int().positive().describe('Knowledge Base article ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      article_id,
      response_format,
    }: {
      app_id: number;
      article_id: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const article = await client.getKbArticle(app_id, article_id);
        return {
          content: [{ type: 'text', text: render(article, response_format) }],
          structuredContent: article as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_kb_articles`,
    {
      title: 'Search Knowledge Base Articles',
      description: 'Searches TeamDynamix Knowledge Base articles by keyword, category, or publish status.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        search: KbArticleSearchSchema,
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
      search: z.infer<typeof KbArticleSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const articles = await client.searchKbArticles(app_id, search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(articles, response_format) }],
          structuredContent: { appId: app_id, count: articles.length, articles },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_kb_categories`,
    {
      title: 'List Knowledge Base Categories',
      description: 'Returns all Knowledge Base categories for the given TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const categories = await client.listKbCategories(app_id);
        return {
          content: [{ type: 'text', text: render(categories, response_format) }],
          structuredContent: { appId: app_id, count: categories.length, categories },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_create_kb_article`,
    {
      title: 'Create Knowledge Base Article',
      description: 'Creates a new Knowledge Base article in TeamDynamix. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        article: KbArticleCreateSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      article,
      response_format,
    }: {
      app_id: number;
      article: z.infer<typeof KbArticleCreateSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const created = await client.createKbArticle(app_id, article as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(created, response_format) }],
          structuredContent: created as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_update_kb_article`,
    {
      title: 'Update Knowledge Base Article',
      description:
        'Updates an existing Knowledge Base article in TeamDynamix. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        article: KbArticleUpdateSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      article,
      response_format,
    }: {
      app_id: number;
      article: z.infer<typeof KbArticleUpdateSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const { ArticleID, ...body } = article;
        const updated = await client.updateKbArticle(app_id, ArticleID, body as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(updated, response_format) }],
          structuredContent: updated as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
