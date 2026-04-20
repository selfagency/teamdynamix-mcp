#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DEFAULT_BASE_PATH, LOG_LEVEL, SERVER_NAME_OVERRIDE, SERVER_VERSION_OVERRIDE } from './config.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import { registerTemplateResources } from './resources/template.resources.js';
import { registerUtilityTools } from './tools/utility.tools.js';

const server = new McpServer({
  name: SERVER_NAME_OVERRIDE ?? SERVER_NAME,
  version: SERVER_VERSION_OVERRIDE ?? SERVER_VERSION,
});

registerUtilityTools(server);
registerTemplateResources(server);

server.registerTool(
  'template_ping',
  {
    title: 'Template Ping',
    description: 'Returns a simple response to verify the server is running.',
    inputSchema: {
      message: z.string().default('pong'),
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async ({ message }: { message: string }) => {
    return {
      content: [{ type: 'text', text: `${SERVER_NAME_OVERRIDE ?? SERVER_NAME}: ${message}` }],
      structuredContent: {
        ok: true,
        message,
      },
    };
  },
);

async function main(): Promise<void> {
  if (DEFAULT_BASE_PATH) {
    console.error(`[mcp-template] default base path: ${DEFAULT_BASE_PATH}`);
  }
  console.error(`[mcp-template] log level: ${LOG_LEVEL}`);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Server startup failed: ${message}`);
  process.exit(1);
});
