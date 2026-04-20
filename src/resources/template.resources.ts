import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_BASE_PATH, LOG_LEVEL, SERVER_NAME_OVERRIDE, SERVER_VERSION_OVERRIDE } from '../config.js';
import { SERVER_NAME, SERVER_VERSION } from '../constants.js';

function stringify(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function registerTemplateResources(server: McpServer): void {
  const templateConfig = { list: undefined };

  server.registerResource(
    'template_capabilities',
    new ResourceTemplate('template://capabilities', templateConfig),
    {
      title: 'Template Capabilities',
      description: 'Read-only snapshot describing built-in tools and runtime defaults.',
      mimeType: 'application/json',
    },
    async uri => {
      const capabilities = {
        server: {
          name: SERVER_NAME_OVERRIDE ?? SERVER_NAME,
          version: SERVER_VERSION_OVERRIDE ?? SERVER_VERSION,
        },
        tools: ['template_ping', 'echo', 'text_transform', 'current_time', 'system_info'],
        resources: ['template://capabilities', 'template://config'],
      };

      return {
        contents: [{ uri: uri.toString(), mimeType: 'application/json', text: stringify(capabilities) }],
      };
    },
  );

  server.registerResource(
    'template_config',
    new ResourceTemplate('template://config', templateConfig),
    {
      title: 'Template Runtime Config',
      description: 'Read-only sanitized runtime configuration for the server.',
      mimeType: 'application/json',
    },
    async uri => {
      const config = {
        basePath: DEFAULT_BASE_PATH ?? null,
        logLevel: LOG_LEVEL,
        serverName: SERVER_NAME_OVERRIDE ?? SERVER_NAME,
        serverVersion: SERVER_VERSION_OVERRIDE ?? SERVER_VERSION,
      };

      return {
        contents: [{ uri: uri.toString(), mimeType: 'application/json', text: stringify(config) }],
      };
    },
  );
}
