/**
 * TeamDynamix enumeration / discovery tools:
 * accounts, locations, functional roles, custom attributes.
 *
 * These provide IDs and valid values required by write workflows.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  CustomAttributeComponentIdSchema,
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

export function registerTeamDynamixEnumerationTools(server: McpServer): void {
  // Accounts
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_accounts`,
    {
      title: 'List Accounts',
      description: 'Returns all accounts/departments in TeamDynamix, optionally scoped to an application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema.optional(),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id?: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const accounts = await client.listAccounts(app_id);
        return {
          content: [{ type: 'text', text: render(accounts, response_format) }],
          structuredContent: { count: accounts.length, accounts },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_account`,
    {
      title: 'Get Account',
      description: 'Retrieves details for a specific TeamDynamix account/department by ID.',
      inputSchema: {
        account_id: z.number().int().positive().describe('Account/department ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ account_id, response_format }: { account_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const account = await client.getAccount(account_id);
        return {
          content: [{ type: 'text', text: render(account, response_format) }],
          structuredContent: account,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  // Locations
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_locations`,
    {
      title: 'List Locations',
      description: 'Returns all locations and rooms defined in TeamDynamix.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const locations = await client.listLocations();
        return {
          content: [{ type: 'text', text: render(locations, response_format) }],
          structuredContent: { count: locations.length, locations },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  // Functional Roles
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_functional_roles`,
    {
      title: 'List Functional Roles',
      description: 'Returns all functional roles defined in TeamDynamix.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const roles = await client.listFunctionalRoles();
        return {
          content: [{ type: 'text', text: render(roles, response_format) }],
          structuredContent: { count: roles.length, roles },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  // Custom Attributes
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_custom_attributes`,
    {
      title: 'List Custom Attributes',
      description:
        'Returns custom attribute definitions for a TeamDynamix component. Common component IDs: 9 = Ticket, 27 = Asset, 63 = KB Article, 31 = Person. Use this to discover valid attribute IDs before creating or updating records.',
      inputSchema: {
        component_id: CustomAttributeComponentIdSchema,
        app_id: TeamDynamixAppIdSchema.optional(),
        associated_type_id: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Filter attributes by associated type ID (e.g. ticket type ID).'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      component_id,
      app_id,
      associated_type_id,
      response_format,
    }: {
      component_id: number;
      app_id?: number;
      associated_type_id?: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const attributes = await client.listCustomAttributes(component_id, app_id, associated_type_id);
        return {
          content: [{ type: 'text', text: render(attributes, response_format) }],
          structuredContent: { componentId: component_id, count: attributes.length, attributes },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
