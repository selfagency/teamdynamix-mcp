import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getTeamDynamixConfig, getTeamDynamixConfigStatus } from '../config.js';
import { redactTeamDynamixConfig } from '../services/teamdynamix/core.service.js';
import { TEAMDYNAMIX_GATEWAY_SURFACE } from '../tools/teamdynamix.domain-gateways.tools.js';

function stringify(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function registerTeamDynamixResources(server: McpServer): void {
  const resourceConfig = { list: undefined };

  server.registerResource(
    'teamdynamix_capabilities',
    new ResourceTemplate('teamdynamix://capabilities', resourceConfig),
    {
      title: 'TeamDynamix Capabilities',
      description: 'Read-only snapshot of the currently implemented TeamDynamix MCP surface.',
      mimeType: 'application/json',
    },
    async uri => {
      const capabilities = {
        toolGroups: {
          discovery: [TEAMDYNAMIX_GATEWAY_SURFACE.discovery.tool],
          tickets: [TEAMDYNAMIX_GATEWAY_SURFACE.tickets.tool],
          ticket_relationships: [TEAMDYNAMIX_GATEWAY_SURFACE.ticketRelationships.tool],
          people: [TEAMDYNAMIX_GATEWAY_SURFACE.people.tool],
          knowledge_base: [TEAMDYNAMIX_GATEWAY_SURFACE.knowledgeBase.tool],
          assets: [TEAMDYNAMIX_GATEWAY_SURFACE.assets.tool],
          cmdb: [TEAMDYNAMIX_GATEWAY_SURFACE.cmdb.tool],
          services: [TEAMDYNAMIX_GATEWAY_SURFACE.services.tool],
          projects: [TEAMDYNAMIX_GATEWAY_SURFACE.projects.tool],
          time: [TEAMDYNAMIX_GATEWAY_SURFACE.time.tool],
          reference_data: [TEAMDYNAMIX_GATEWAY_SURFACE.referenceData.tool],
        },
        gatewayActions: {
          discovery: TEAMDYNAMIX_GATEWAY_SURFACE.discovery.actions,
          tickets: TEAMDYNAMIX_GATEWAY_SURFACE.tickets.actions,
          ticket_relationships: TEAMDYNAMIX_GATEWAY_SURFACE.ticketRelationships.actions,
          people: TEAMDYNAMIX_GATEWAY_SURFACE.people.actions,
          knowledge_base: TEAMDYNAMIX_GATEWAY_SURFACE.knowledgeBase.actions,
          assets: TEAMDYNAMIX_GATEWAY_SURFACE.assets.actions,
          cmdb: TEAMDYNAMIX_GATEWAY_SURFACE.cmdb.actions,
          services: TEAMDYNAMIX_GATEWAY_SURFACE.services.actions,
          projects: TEAMDYNAMIX_GATEWAY_SURFACE.projects.actions,
          time: TEAMDYNAMIX_GATEWAY_SURFACE.time.actions,
          reference_data: TEAMDYNAMIX_GATEWAY_SURFACE.referenceData.actions,
        },
        implementedDomains: [
          'discovery',
          'tickets',
          'ticket_relationships',
          'people',
          'knowledge_base',
          'assets',
          'cmdb',
          'services',
          'projects',
          'time',
          'reference_data',
        ],
      };

      return {
        contents: [{ uri: uri.toString(), mimeType: 'application/json', text: stringify(capabilities) }],
      };
    },
  );

  server.registerResource(
    'teamdynamix_config',
    new ResourceTemplate('teamdynamix://config', resourceConfig),
    {
      title: 'TeamDynamix Runtime Config',
      description: 'Read-only sanitized TeamDynamix configuration and readiness metadata.',
      mimeType: 'application/json',
    },
    async uri => {
      const runtimeConfig = getTeamDynamixConfig();
      const config = {
        status: getTeamDynamixConfigStatus(runtimeConfig),
        config: redactTeamDynamixConfig(runtimeConfig),
      };

      return {
        contents: [{ uri: uri.toString(), mimeType: 'application/json', text: stringify(config) }],
      };
    },
  );
}
