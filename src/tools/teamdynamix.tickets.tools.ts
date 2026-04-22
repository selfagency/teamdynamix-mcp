import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getTeamDynamixConfig } from '../config.js';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  TeamDynamixAppIdSchema,
  TeamDynamixResponseFormatSchema,
  TicketCommentSchema,
  TicketCreateSchema,
  TicketPatchSchema,
  TicketSearchSchema,
} from '../schemas/teamdynamix/index.js';
import { assertWriteToolsEnabled, createConfiguredTeamDynamixClient } from '../services/teamdynamix/client.service.js';
import { render } from '../services/teamdynamix/render.service.js';
import type { ResponseFormat } from '../types.js';

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerTeamDynamixTicketTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  // Metadata lookups
  // -------------------------------------------------------------------------

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ticket_types`,
    {
      title: 'List Ticket Types',
      description: 'Returns all ticket types defined for the given TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const types = await client.listTicketTypes(app_id);
        const payload = { appId: app_id, types };
        return {
          content: [{ type: 'text', text: render(payload, response_format) }],
          structuredContent: payload,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ticket_priorities`,
    {
      title: 'List Ticket Priorities',
      description: 'Returns all ticket priorities defined for the given TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const priorities = await client.listTicketPriorities(app_id);
        return {
          content: [{ type: 'text', text: render(priorities, response_format) }],
          structuredContent: { appId: app_id, priorities },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ticket_urgencies`,
    {
      title: 'List Ticket Urgencies',
      description: 'Returns all urgency levels defined for the given TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const urgencies = await client.listTicketUrgencies(app_id);
        return {
          content: [{ type: 'text', text: render(urgencies, response_format) }],
          structuredContent: { appId: app_id, urgencies },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ticket_impacts`,
    {
      title: 'List Ticket Impacts',
      description: 'Returns all impact levels defined for the given TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const impacts = await client.listTicketImpacts(app_id);
        return {
          content: [{ type: 'text', text: render(impacts, response_format) }],
          structuredContent: { appId: app_id, impacts },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_ticket_sources`,
    {
      title: 'List Ticket Sources',
      description: 'Returns all ticket source options defined for the given TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const sources = await client.listTicketSources(app_id);
        return {
          content: [{ type: 'text', text: render(sources, response_format) }],
          structuredContent: { appId: app_id, sources },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  // -------------------------------------------------------------------------
  // CRUD operations
  // -------------------------------------------------------------------------

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_ticket`,
    {
      title: 'Get Ticket',
      description: 'Retrieves full details of a single TeamDynamix ticket by ID.',
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
        const ticket = await client.getTicket(app_id, ticket_id);
        return {
          content: [{ type: 'text', text: render(ticket, response_format) }],
          structuredContent: ticket,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_tickets`,
    {
      title: 'Search Tickets',
      description:
        'Searches tickets in a TeamDynamix application using keyword, date, status, type, priority, urgency, impact, account, and responsible/requestor filters.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        search: TicketSearchSchema,
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
      search: z.infer<typeof TicketSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const tickets = await client.searchTickets(app_id, search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(tickets, response_format) }],
          structuredContent: { appId: app_id, count: tickets.length, tickets },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_create_ticket`,
    {
      title: 'Create Ticket',
      description: 'Creates a new ticket in the specified TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        ticket: TicketCreateSchema,
        notify_requestor: z.boolean().optional().default(false).describe('Send email notification to requestor.'),
        notify_responsible: z.boolean().optional().default(false).describe('Send email notification to responsible.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      ticket,
      notify_requestor,
      notify_responsible,
      response_format,
    }: {
      app_id: number;
      ticket: z.infer<typeof TicketCreateSchema>;
      notify_requestor: boolean;
      notify_responsible: boolean;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const created = await client.createTicket(
          app_id,
          ticket as Record<string, unknown>,
          notify_requestor,
          notify_responsible,
        );
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
    `${TEAMDYNAMIX_TOOL_PREFIX}_update_ticket`,
    {
      title: 'Update Ticket',
      description:
        'Partially updates a ticket using key/value field patches. Only the provided fields are changed. Optionally attaches a comment and sends notifications.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        patch: TicketPatchSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      patch,
      response_format,
    }: {
      app_id: number;
      patch: z.infer<typeof TicketPatchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const updated = await client.updateTicket(
          app_id,
          patch.TicketID,
          patch.Attributes as Record<string, unknown>,
          patch.NotifyRequestor ?? false,
          patch.NotifyResponsible ?? false,
          patch.Comments ?? '',
          patch.IsPrivate ?? false,
        );
        return {
          content: [{ type: 'text', text: render(updated, response_format) }],
          structuredContent: updated,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_add_ticket_comment`,
    {
      title: 'Add Ticket Comment',
      description: 'Adds a feed comment to an existing TeamDynamix ticket.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        comment: TicketCommentSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      app_id,
      comment,
      response_format,
    }: {
      app_id: number;
      comment: z.infer<typeof TicketCommentSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const entry = await client.addTicketComment(
          app_id,
          comment.TicketID,
          comment.Body,
          comment.IsPrivate ?? false,
          comment.NotifyRequestor ?? false,
          comment.NotifyResponsible ?? false,
        );
        return {
          content: [{ type: 'text', text: render(entry, response_format) }],
          structuredContent: entry,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_ticket_feed`,
    {
      title: 'Get Ticket Feed',
      description: 'Returns the activity feed (comments, updates, status changes) for a TeamDynamix ticket.',
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
        const feed = await client.getTicketFeed(app_id, ticket_id);
        return {
          content: [{ type: 'text', text: render(feed, response_format) }],
          structuredContent: { appId: app_id, ticketId: ticket_id, entries: feed },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
