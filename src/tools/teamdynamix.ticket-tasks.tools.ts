/**
 * TeamDynamix ticket task and ticket-asset relationship tools.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getTeamDynamixConfig } from '../config.js';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  TeamDynamixAppIdSchema,
  TeamDynamixResponseFormatSchema,
  TicketTaskCreateSchema,
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

export function registerTeamDynamixTicketTaskTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_ticket_tasks`,
    {
      title: 'Get Ticket Tasks',
      description: 'Returns all tasks associated with a TeamDynamix ticket.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket_id: z.number().int().positive().describe('Ticket ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      ticket_id,
      response_format,
    }: {
      app_id: number;
      ticket_id: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const tasks = await client.getTicketTasks(app_id, ticket_id);
        return {
          content: [{ type: 'text', text: render(tasks, response_format) }],
          structuredContent: { appId: app_id, ticketId: ticket_id, count: tasks.length, tasks },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_create_ticket_task`,
    {
      title: 'Create Ticket Task',
      description: 'Creates a new task on a TeamDynamix ticket. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        task: TicketTaskCreateSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      task,
      response_format,
    }: {
      app_id: number;
      task: z.infer<typeof TicketTaskCreateSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const created = await client.createTicketTask(app_id, task.TicketID, task as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(created, response_format) }],
          structuredContent: created,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ticket_assets`,
    {
      title: 'List Ticket Assets',
      description: 'Returns all assets/CIs linked to a TeamDynamix ticket.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket_id: z.number().int().positive().describe('Ticket ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      ticket_id,
      response_format,
    }: {
      app_id: number;
      ticket_id: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const assets = await client.listTicketAssets(app_id, ticket_id);
        return {
          content: [{ type: 'text', text: render(assets, response_format) }],
          structuredContent: { appId: app_id, ticketId: ticket_id, count: assets.length, assets },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_add_ticket_asset`,
    {
      title: 'Add Asset to Ticket',
      description: 'Links an asset/CI to a TeamDynamix ticket. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket_id: z.number().int().positive().describe('Ticket ID.'),
        asset_id: z.number().int().positive().describe('Asset ID to link.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      ticket_id,
      asset_id,
      response_format,
    }: {
      app_id: number;
      ticket_id: number;
      asset_id: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const result = await client.addTicketAsset(app_id, ticket_id, asset_id);
        return {
          content: [{ type: 'text', text: render(result, response_format) }],
          structuredContent: result,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_remove_ticket_asset`,
    {
      title: 'Remove Asset from Ticket',
      description:
        'Unlinks an asset/CI from a TeamDynamix ticket. This is a destructive operation. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket_id: z.number().int().positive().describe('Ticket ID.'),
        asset_id: z.number().int().positive().describe('Asset ID to unlink.'),
        confirm: z.literal(true).describe('Must be true to confirm this destructive operation.'),
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({ app_id, ticket_id, asset_id }: { app_id: number; ticket_id: number; asset_id: number; confirm: true }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        await client.removeTicketAsset(app_id, ticket_id, asset_id);
        const message = `Asset ${asset_id} unlinked from ticket ${ticket_id}.`;
        return {
          content: [{ type: 'text', text: message }],
          structuredContent: { appId: app_id, ticketId: ticket_id, assetId: asset_id, unlinked: true },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}

export function registerTeamDynamixTicketContactTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_ticket_contacts`,
    {
      title: 'Get Ticket Contacts',
      description: 'Returns all contacts associated with a TeamDynamix ticket.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket_id: z.number().int().positive().describe('Ticket ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      ticket_id,
      response_format,
    }: {
      app_id: number;
      ticket_id: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const contacts = await client.getTicketContacts(app_id, ticket_id);
        return {
          content: [{ type: 'text', text: render(contacts, response_format) }],
          structuredContent: { appId: app_id, ticketId: ticket_id, count: contacts.length, contacts },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_add_ticket_contact`,
    {
      title: 'Add Contact to Ticket',
      description:
        'Adds a person as a contact/notify-recipient on a TeamDynamix ticket. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket_id: z.number().int().positive().describe('Ticket ID.'),
        contact_uid: z.string().uuid().describe('GUID of the user to add as a contact.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      ticket_id,
      contact_uid,
      response_format,
    }: {
      app_id: number;
      ticket_id: number;
      contact_uid: string;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const result = await client.addTicketContact(app_id, ticket_id, contact_uid);
        return {
          content: [{ type: 'text', text: render(result, response_format) }],
          structuredContent: result,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_remove_ticket_contact`,
    {
      title: 'Remove Contact from Ticket',
      description: 'Removes a contact from a TeamDynamix ticket. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket_id: z.number().int().positive().describe('Ticket ID.'),
        contact_uid: z.string().uuid().describe('GUID of the contact to remove.'),
        confirm: z.literal(true).describe('Must be true to confirm this destructive operation.'),
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      ticket_id,
      contact_uid,
    }: {
      app_id: number;
      ticket_id: number;
      contact_uid: string;
      confirm: true;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        await client.removeTicketContact(app_id, ticket_id, contact_uid);
        return {
          content: [{ type: 'text', text: `Contact ${contact_uid} removed from ticket ${ticket_id}.` }],
          structuredContent: { appId: app_id, ticketId: ticket_id, contactUid: contact_uid, removed: true },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
