#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LOG_LEVEL, SERVER_NAME_OVERRIDE, SERVER_VERSION_OVERRIDE, getTeamDynamixConfig } from './config.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import { registerTeamDynamixResources } from './resources/teamdynamix.resources.js';
import { redactTeamDynamixConfig } from './services/teamdynamix/core.service.js';
import { registerTeamDynamixDomainGatewayTools } from './tools/teamdynamix.domain-gateways.tools.js';

const server = new McpServer({
  name: SERVER_NAME_OVERRIDE ?? SERVER_NAME,
  version: SERVER_VERSION_OVERRIDE ?? SERVER_VERSION,
});

registerTeamDynamixDomainGatewayTools(server);
registerTeamDynamixResources(server);

async function main(): Promise<void> {
  console.error(`[teamdynamix-mcp] log level: ${LOG_LEVEL}`);
  if (LOG_LEVEL === 'debug') {
    const config = getTeamDynamixConfig();
    console.error(`[teamdynamix-mcp] sanitized config: ${JSON.stringify(redactTeamDynamixConfig(config))}`);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Server startup failed: ${message}`);
  process.exit(1);
});
