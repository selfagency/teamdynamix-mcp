import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getTeamDynamixConfig, getTeamDynamixConfigStatus } from '../config.js';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  AssetSearchSchema,
  CiSearchSchema,
  CustomAttributeComponentIdSchema,
  GroupSearchSchema,
  KbArticleCreateSchema,
  KbArticleSearchSchema,
  KbArticleUpdateSchema,
  ProjectIssueCreateSchema,
  ProjectRiskCreateSchema,
  ProjectSearchSchema,
  ServiceSearchSchema,
  TeamDynamixAppIdSchema,
  TeamDynamixGuidSchema,
  TeamDynamixResponseFormatSchema,
  TicketCommentSchema,
  TicketCreateSchema,
  TicketPatchSchema,
  TicketSearchSchema,
  TicketTaskCreateSchema,
  TimeEntryQuerySchema,
  UserSearchSchema,
} from '../schemas/teamdynamix/index.js';
import {
  assertWriteToolsEnabled,
  assertDeleteToolsEnabled,
  createConfiguredTeamDynamixClient,
} from '../services/teamdynamix/client.factory.js';
import { redactTeamDynamixConfig } from '../services/teamdynamix/core.service.js';
import { render } from '../services/teamdynamix/render.service.js';
import type { ResponseFormat } from '../types.js';

const teamdynamixDiscoveryActionSchema = z.enum([
  'server_status',
  'get_current_user',
  'list_applications',
  'list_ticket_statuses',
]);

const teamdynamixTicketActionSchema = z.enum([
  'list_ticket_types',
  'list_ticket_priorities',
  'list_ticket_urgencies',
  'list_ticket_impacts',
  'list_ticket_sources',
  'get_ticket',
  'search_tickets',
  'create_ticket',
  'update_ticket',
  'add_ticket_comment',
  'get_ticket_feed',
]);

const teamdynamixTicketRelationshipActionSchema = z.enum([
  'get_ticket_tasks',
  'create_ticket_task',
  'list_ticket_assets',
  'add_ticket_asset',
  'remove_ticket_asset',
  'get_ticket_contacts',
  'add_ticket_contact',
  'remove_ticket_contact',
]);

const teamdynamixPeopleActionSchema = z.enum([
  'get_user',
  'search_users',
  'get_group',
  'search_groups',
  'get_group_members',
]);

const teamdynamixKnowledgeBaseActionSchema = z.enum([
  'get_kb_article',
  'search_kb_articles',
  'list_kb_categories',
  'create_kb_article',
  'update_kb_article',
]);

const teamdynamixAssetsActionSchema = z.enum([
  'get_asset',
  'search_assets',
  'list_asset_statuses',
  'list_product_models',
  'delete_asset',
]);

const teamdynamixCmdbActionSchema = z.enum([
  'get_ci',
  'search_cis',
  'list_ci_types',
  'list_ci_relationship_types',
  'list_vendors',
  'delete_ci',
]);

const teamdynamixServicesActionSchema = z.enum([
  'list_services',
  'get_service',
  'search_services',
  'list_service_categories',
  'delete_service',
  'delete_service_category',
]);

const teamdynamixProjectsActionSchema = z.enum([
  'get_project',
  'search_projects',
  'list_project_types',
  'get_project_plans',
  'get_project_issues',
  'get_project_risks',
  'create_project_issue',
  'create_project_risk',
]);

const teamdynamixTimeActionSchema = z.enum(['list_time_types', 'get_my_time_entries']);

const teamdynamixReferenceDataActionSchema = z.enum([
  'list_accounts',
  'get_account',
  'list_locations',
  'list_functional_roles',
  'list_custom_attributes',
]);

const gatewayPayloadSchema = z.record(z.string(), z.unknown()).default({});

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toStructuredContent(payload: unknown): Record<string, unknown> {
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return {
    data: payload,
  };
}

function parsePayload<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  payload: Record<string, unknown>,
  action: string,
): z.infer<TSchema> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map(issue => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid payload for action "${action}": ${details}`);
  }
  return parsed.data;
}

function toSuccessResponse(
  payload: unknown,
  responseFormat: ResponseFormat,
): {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: false;
} {
  return {
    content: [{ type: 'text' as const, text: render(payload, responseFormat) }],
    structuredContent: toStructuredContent(payload),
  };
}

function toErrorResponse(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: { ok: false; kind: string; message: string };
  isError: true;
} {
  const message = messageFromError(error);

  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    structuredContent: {
      ok: false,
      kind: 'unknown',
      message,
    },
    isError: true,
  };
}

const teamdynamixDiscoveryTool = `${TEAMDYNAMIX_TOOL_PREFIX}_discovery`;
const teamdynamixTicketsTool = `${TEAMDYNAMIX_TOOL_PREFIX}_tickets`;
const teamdynamixTicketRelationshipsTool = `${TEAMDYNAMIX_TOOL_PREFIX}_ticket_relationships`;
const teamdynamixPeopleTool = `${TEAMDYNAMIX_TOOL_PREFIX}_people`;
const teamdynamixKnowledgeBaseTool = `${TEAMDYNAMIX_TOOL_PREFIX}_knowledge_base`;
const teamdynamixAssetsTool = `${TEAMDYNAMIX_TOOL_PREFIX}_assets`;
const teamdynamixCmdbTool = `${TEAMDYNAMIX_TOOL_PREFIX}_cmdb`;
const teamdynamixServicesTool = `${TEAMDYNAMIX_TOOL_PREFIX}_services`;
const teamdynamixProjectsTool = `${TEAMDYNAMIX_TOOL_PREFIX}_projects`;
const teamdynamixTimeTool = `${TEAMDYNAMIX_TOOL_PREFIX}_time`;
const teamdynamixReferenceDataTool = `${TEAMDYNAMIX_TOOL_PREFIX}_reference_data`;

export const TEAMDYNAMIX_GATEWAY_SURFACE = {
  discovery: {
    tool: teamdynamixDiscoveryTool,
    actions: teamdynamixDiscoveryActionSchema.options,
  },
  tickets: {
    tool: teamdynamixTicketsTool,
    actions: teamdynamixTicketActionSchema.options,
  },
  ticketRelationships: {
    tool: teamdynamixTicketRelationshipsTool,
    actions: teamdynamixTicketRelationshipActionSchema.options,
  },
  people: {
    tool: teamdynamixPeopleTool,
    actions: teamdynamixPeopleActionSchema.options,
  },
  knowledgeBase: {
    tool: teamdynamixKnowledgeBaseTool,
    actions: teamdynamixKnowledgeBaseActionSchema.options,
  },
  assets: {
    tool: teamdynamixAssetsTool,
    actions: teamdynamixAssetsActionSchema.options,
  },
  cmdb: {
    tool: teamdynamixCmdbTool,
    actions: teamdynamixCmdbActionSchema.options,
  },
  services: {
    tool: teamdynamixServicesTool,
    actions: teamdynamixServicesActionSchema.options,
  },
  projects: {
    tool: teamdynamixProjectsTool,
    actions: teamdynamixProjectsActionSchema.options,
  },
  time: {
    tool: teamdynamixTimeTool,
    actions: teamdynamixTimeActionSchema.options,
  },
  referenceData: {
    tool: teamdynamixReferenceDataTool,
    actions: teamdynamixReferenceDataActionSchema.options,
  },
} as const;

export function registerTeamDynamixDomainGatewayTools(server: McpServer): void {
  registerTeamDynamixDiscoveryGateway(server);
  registerTeamDynamixTicketsGateway(server);
  registerTeamDynamixTicketRelationshipsGateway(server);
  registerTeamDynamixPeopleGateway(server);
  registerTeamDynamixKnowledgeBaseGateway(server);
  registerTeamDynamixAssetsGateway(server);
  registerTeamDynamixCmdbGateway(server);
  registerTeamDynamixServicesGateway(server);
  registerTeamDynamixProjectsGateway(server);
  registerTeamDynamixTimeGateway(server);
  registerTeamDynamixReferenceDataGateway(server);
}

function registerTeamDynamixDiscoveryGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixDiscoveryTool,
    {
      title: 'TeamDynamix Discovery Gateway',
      description:
        'Gateway for discovery operations: server status, current user, applications, and ticket status lookup.',
      inputSchema: {
        action: teamdynamixDiscoveryActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'server_status': {
            const config = getTeamDynamixConfig();
            const status = getTeamDynamixConfigStatus(config);
            const result = {
              status,
              config: redactTeamDynamixConfig(config),
              gateway: 'discovery',
              actions: TEAMDYNAMIX_GATEWAY_SURFACE.discovery.actions,
            };
            return toSuccessResponse(result, response_format);
          }
          case 'get_current_user': {
            const user = await client.getCurrentUser();
            return toSuccessResponse(user, response_format);
          }
          case 'list_applications': {
            const applications = await client.listApplications();
            return toSuccessResponse({ count: applications.length, applications }, response_format);
          }
          case 'list_ticket_statuses': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema.optional() }), payload, action);
            const config = getTeamDynamixConfig();
            const effectiveAppId = parsed.app_id ?? config.defaultTicketAppId;
            if (!effectiveAppId) {
              throw new Error(
                'No TeamDynamix ticket application ID was provided. Supply payload.app_id or configure TEAMDYNAMIX_DEFAULT_TICKET_APP_ID.',
              );
            }
            const statuses = await client.listTicketStatuses(effectiveAppId);
            return toSuccessResponse({ appId: effectiveAppId, count: statuses.length, statuses }, response_format);
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixTicketsGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixTicketsTool,
    {
      title: 'TeamDynamix Tickets Gateway',
      description: 'Gateway for ticket metadata, read/search, create/update, comments, and feed operations.',
      inputSchema: {
        action: teamdynamixTicketActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'list_ticket_types': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const types = await client.listTicketTypes(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, types }, response_format);
          }
          case 'list_ticket_priorities': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const priorities = await client.listTicketPriorities(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, priorities }, response_format);
          }
          case 'list_ticket_urgencies': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const urgencies = await client.listTicketUrgencies(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, urgencies }, response_format);
          }
          case 'list_ticket_impacts': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const impacts = await client.listTicketImpacts(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, impacts }, response_format);
          }
          case 'list_ticket_sources': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const sources = await client.listTicketSources(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, sources }, response_format);
          }
          case 'get_ticket': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, ticket_id: z.number().int().positive() }),
              payload,
              action,
            );
            const ticket = await client.getTicket(parsed.app_id, parsed.ticket_id);
            return toSuccessResponse(ticket, response_format);
          }
          case 'search_tickets': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, search: TicketSearchSchema }),
              payload,
              action,
            );
            const tickets = await client.searchTickets(parsed.app_id, parsed.search as Record<string, unknown>);
            return toSuccessResponse({ appId: parsed.app_id, count: tickets.length, tickets }, response_format);
          }
          case 'create_ticket': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                ticket: TicketCreateSchema,
                notify_requestor: z.boolean().optional().default(false),
                notify_responsible: z.boolean().optional().default(false),
              }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const created = await client.createTicket(
              parsed.app_id,
              parsed.ticket as Record<string, unknown>,
              parsed.notify_requestor,
              parsed.notify_responsible,
            );
            return toSuccessResponse(created, response_format);
          }
          case 'update_ticket': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, patch: TicketPatchSchema }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const updated = await client.updateTicket(
              parsed.app_id,
              parsed.patch.TicketID,
              parsed.patch.Attributes as Record<string, unknown>,
              parsed.patch.NotifyRequestor ?? false,
              parsed.patch.NotifyResponsible ?? false,
              parsed.patch.Comments ?? '',
              parsed.patch.IsPrivate ?? false,
            );
            return toSuccessResponse(updated, response_format);
          }
          case 'add_ticket_comment': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, comment: TicketCommentSchema }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const entry = await client.addTicketComment(
              parsed.app_id,
              parsed.comment.TicketID,
              parsed.comment.Body,
              parsed.comment.IsPrivate ?? false,
              parsed.comment.NotifyRequestor ?? false,
              parsed.comment.NotifyResponsible ?? false,
            );
            return toSuccessResponse(entry, response_format);
          }
          case 'get_ticket_feed': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, ticket_id: z.number().int().positive() }),
              payload,
              action,
            );
            const feed = await client.getTicketFeed(parsed.app_id, parsed.ticket_id);
            return toSuccessResponse(
              { appId: parsed.app_id, ticketId: parsed.ticket_id, entries: feed },
              response_format,
            );
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixTicketRelationshipsGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixTicketRelationshipsTool,
    {
      title: 'TeamDynamix Ticket Relationships Gateway',
      description: 'Gateway for ticket tasks, linked assets, and linked contacts operations.',
      inputSchema: {
        action: teamdynamixTicketRelationshipActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'get_ticket_tasks': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, ticket_id: z.number().int().positive() }),
              payload,
              action,
            );
            const tasks = await client.getTicketTasks(parsed.app_id, parsed.ticket_id);
            return toSuccessResponse(
              { appId: parsed.app_id, ticketId: parsed.ticket_id, count: tasks.length, tasks },
              response_format,
            );
          }
          case 'create_ticket_task': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, task: TicketTaskCreateSchema }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const created = await client.createTicketTask(
              parsed.app_id,
              parsed.task.TicketID,
              parsed.task as Record<string, unknown>,
            );
            return toSuccessResponse(created, response_format);
          }
          case 'list_ticket_assets': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, ticket_id: z.number().int().positive() }),
              payload,
              action,
            );
            const assets = await client.listTicketAssets(parsed.app_id, parsed.ticket_id);
            return toSuccessResponse(
              { appId: parsed.app_id, ticketId: parsed.ticket_id, count: assets.length, assets },
              response_format,
            );
          }
          case 'add_ticket_asset': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                ticket_id: z.number().int().positive(),
                asset_id: z.number().int().positive(),
              }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const result = await client.addTicketAsset(parsed.app_id, parsed.ticket_id, parsed.asset_id);
            return toSuccessResponse(result, response_format);
          }
          case 'remove_ticket_asset': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                ticket_id: z.number().int().positive(),
                asset_id: z.number().int().positive(),
                confirm: z.literal(true),
              }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            await client.removeTicketAsset(parsed.app_id, parsed.ticket_id, parsed.asset_id);
            return toSuccessResponse(
              {
                appId: parsed.app_id,
                ticketId: parsed.ticket_id,
                assetId: parsed.asset_id,
                unlinked: true,
              },
              response_format,
            );
          }
          case 'get_ticket_contacts': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, ticket_id: z.number().int().positive() }),
              payload,
              action,
            );
            const contacts = await client.getTicketContacts(parsed.app_id, parsed.ticket_id);
            return toSuccessResponse(
              { appId: parsed.app_id, ticketId: parsed.ticket_id, count: contacts.length, contacts },
              response_format,
            );
          }
          case 'add_ticket_contact': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                ticket_id: z.number().int().positive(),
                contact_uid: TeamDynamixGuidSchema,
              }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const result = await client.addTicketContact(parsed.app_id, parsed.ticket_id, parsed.contact_uid);
            return toSuccessResponse(result, response_format);
          }
          case 'remove_ticket_contact': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                ticket_id: z.number().int().positive(),
                contact_uid: TeamDynamixGuidSchema,
                confirm: z.literal(true),
              }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            await client.removeTicketContact(parsed.app_id, parsed.ticket_id, parsed.contact_uid);
            return toSuccessResponse(
              {
                appId: parsed.app_id,
                ticketId: parsed.ticket_id,
                contactUid: parsed.contact_uid,
                removed: true,
              },
              response_format,
            );
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixPeopleGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixPeopleTool,
    {
      title: 'TeamDynamix People Gateway',
      description: 'Gateway for user and group retrieval/search operations.',
      inputSchema: {
        action: teamdynamixPeopleActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'get_user': {
            const parsed = parsePayload(z.object({ uid: TeamDynamixGuidSchema }), payload, action);
            const user = await client.getUser(parsed.uid);
            return toSuccessResponse(user, response_format);
          }
          case 'search_users': {
            const parsed = parsePayload(z.object({ search: UserSearchSchema }), payload, action);
            const users = await client.searchUsers(parsed.search as Record<string, unknown>);
            return toSuccessResponse({ count: users.length, users }, response_format);
          }
          case 'get_group': {
            const parsed = parsePayload(z.object({ group_id: z.number().int().positive() }), payload, action);
            const group = await client.getGroup(parsed.group_id);
            return toSuccessResponse(group, response_format);
          }
          case 'search_groups': {
            const parsed = parsePayload(z.object({ search: GroupSearchSchema }), payload, action);
            const groups = await client.searchGroups(parsed.search as Record<string, unknown>);
            return toSuccessResponse({ count: groups.length, groups }, response_format);
          }
          case 'get_group_members': {
            const parsed = parsePayload(z.object({ group_id: z.number().int().positive() }), payload, action);
            const members = await client.getGroupMembers(parsed.group_id);
            return toSuccessResponse({ groupId: parsed.group_id, count: members.length, members }, response_format);
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixKnowledgeBaseGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixKnowledgeBaseTool,
    {
      title: 'TeamDynamix Knowledge Base Gateway',
      description: 'Gateway for TeamDynamix Knowledge Base retrieval, search, and write operations.',
      inputSchema: {
        action: teamdynamixKnowledgeBaseActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'get_kb_article': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, article_id: z.number().int().positive() }),
              payload,
              action,
            );
            const article = await client.getKbArticle(parsed.app_id, parsed.article_id);
            return toSuccessResponse(article, response_format);
          }
          case 'search_kb_articles': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, search: KbArticleSearchSchema }),
              payload,
              action,
            );
            const articles = await client.searchKbArticles(parsed.app_id, parsed.search as Record<string, unknown>);
            return toSuccessResponse({ appId: parsed.app_id, count: articles.length, articles }, response_format);
          }
          case 'list_kb_categories': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const categories = await client.listKbCategories(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, count: categories.length, categories }, response_format);
          }
          case 'create_kb_article': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, article: KbArticleCreateSchema }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const created = await client.createKbArticle(parsed.app_id, parsed.article as Record<string, unknown>);
            return toSuccessResponse(created, response_format);
          }
          case 'update_kb_article': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, article: KbArticleUpdateSchema }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const { ArticleID, ...body } = parsed.article;
            const updated = await client.updateKbArticle(parsed.app_id, ArticleID, body as Record<string, unknown>);
            return toSuccessResponse(updated, response_format);
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixAssetsGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixAssetsTool,
    {
      title: 'TeamDynamix Assets Gateway',
      description: 'Gateway for TeamDynamix asset retrieval, search, and lookup enumerations.',
      inputSchema: {
        action: teamdynamixAssetsActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'get_asset': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, asset_id: z.number().int().positive() }),
              payload,
              action,
            );
            const asset = await client.getAsset(parsed.app_id, parsed.asset_id);
            return toSuccessResponse(asset, response_format);
          }
          case 'search_assets': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, search: AssetSearchSchema }),
              payload,
              action,
            );
            const assets = await client.searchAssets(parsed.app_id, parsed.search as Record<string, unknown>);
            return toSuccessResponse({ appId: parsed.app_id, count: assets.length, assets }, response_format);
          }
          case 'list_asset_statuses': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const statuses = await client.listAssetStatuses(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, count: statuses.length, statuses }, response_format);
          }
          case 'list_product_models': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const models = await client.listProductModels(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, count: models.length, models }, response_format);
          }
          case 'delete_asset': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                asset_id: z.number().int().positive(),
                confirm: z.literal(true),
              }),
              payload,
              action,
            );
            assertDeleteToolsEnabled(getTeamDynamixConfig());
            await client.deleteAsset(parsed.app_id, parsed.asset_id);
            return toSuccessResponse(
              { appId: parsed.app_id, assetId: parsed.asset_id, deleted: true },
              response_format,
            );
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixCmdbGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixCmdbTool,
    {
      title: 'TeamDynamix CMDB Gateway',
      description: 'Gateway for CI/CMDB retrieval, search, types, relationship types, and vendors.',
      inputSchema: {
        action: teamdynamixCmdbActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'get_ci': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, ci_id: z.number().int().positive() }),
              payload,
              action,
            );
            const ci = await client.getConfigurationItem(parsed.app_id, parsed.ci_id);
            return toSuccessResponse(ci, response_format);
          }
          case 'search_cis': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, search: CiSearchSchema }),
              payload,
              action,
            );
            const results = await client.searchConfigurationItems(
              parsed.app_id,
              parsed.search as Record<string, unknown>,
            );
            return toSuccessResponse({ appId: parsed.app_id, count: results.length, results }, response_format);
          }
          case 'list_ci_types': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const types = await client.listCiTypes(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, count: types.length, types }, response_format);
          }
          case 'list_ci_relationship_types': {
            const types = await client.listCiRelationshipTypes();
            return toSuccessResponse({ count: types.length, types }, response_format);
          }
          case 'list_vendors': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const vendors = await client.listVendors(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, count: vendors.length, vendors }, response_format);
          }
          case 'delete_ci': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                ci_id: z.number().int().positive(),
                confirm: z.literal(true),
              }),
              payload,
              action,
            );
            assertDeleteToolsEnabled(getTeamDynamixConfig());
            await client.deleteConfigurationItem(parsed.app_id, parsed.ci_id);
            return toSuccessResponse({ appId: parsed.app_id, ciId: parsed.ci_id, deleted: true }, response_format);
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixServicesGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixServicesTool,
    {
      title: 'TeamDynamix Services Gateway',
      description: 'Gateway for TeamDynamix service catalog list/get/search/category operations.',
      inputSchema: {
        action: teamdynamixServicesActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'list_services': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const services = await client.listServiceCatalog(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, count: services.length, services }, response_format);
          }
          case 'get_service': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, service_id: z.number().int().positive() }),
              payload,
              action,
            );
            const service = await client.getService(parsed.app_id, parsed.service_id);
            return toSuccessResponse(service, response_format);
          }
          case 'search_services': {
            const parsed = parsePayload(
              z.object({ app_id: TeamDynamixAppIdSchema, search: ServiceSearchSchema }),
              payload,
              action,
            );
            const services = await client.searchServices(parsed.app_id, parsed.search as Record<string, unknown>);
            return toSuccessResponse({ appId: parsed.app_id, count: services.length, services }, response_format);
          }
          case 'list_service_categories': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema }), payload, action);
            const categories = await client.listServiceCategories(parsed.app_id);
            return toSuccessResponse({ appId: parsed.app_id, count: categories.length, categories }, response_format);
          }
          case 'delete_service': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                service_id: z.number().int().positive(),
                confirm: z.literal(true),
              }),
              payload,
              action,
            );
            assertDeleteToolsEnabled(getTeamDynamixConfig());
            await client.deleteService(parsed.app_id, parsed.service_id);
            return toSuccessResponse(
              { appId: parsed.app_id, serviceId: parsed.service_id, deleted: true },
              response_format,
            );
          }
          case 'delete_service_category': {
            const parsed = parsePayload(
              z.object({
                app_id: TeamDynamixAppIdSchema,
                category_id: z.number().int().positive(),
                confirm: z.literal(true),
              }),
              payload,
              action,
            );
            assertDeleteToolsEnabled(getTeamDynamixConfig());
            await client.deleteServiceCategory(parsed.app_id, parsed.category_id);
            return toSuccessResponse(
              { appId: parsed.app_id, categoryId: parsed.category_id, deleted: true },
              response_format,
            );
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixProjectsGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixProjectsTool,
    {
      title: 'TeamDynamix Projects Gateway',
      description: 'Gateway for TeamDynamix projects retrieval/search and project issue/risk operations.',
      inputSchema: {
        action: teamdynamixProjectsActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'get_project': {
            const parsed = parsePayload(z.object({ project_id: z.number().int().positive() }), payload, action);
            const project = await client.getProject(parsed.project_id);
            return toSuccessResponse(project, response_format);
          }
          case 'search_projects': {
            const parsed = parsePayload(z.object({ search: ProjectSearchSchema }), payload, action);
            const projects = await client.searchProjects(parsed.search as Record<string, unknown>);
            return toSuccessResponse({ count: projects.length, projects }, response_format);
          }
          case 'list_project_types': {
            const types = await client.listProjectTypes();
            return toSuccessResponse({ count: types.length, types }, response_format);
          }
          case 'get_project_plans': {
            const parsed = parsePayload(z.object({ project_id: z.number().int().positive() }), payload, action);
            const plans = await client.getProjectPlans(parsed.project_id);
            return toSuccessResponse({ projectId: parsed.project_id, count: plans.length, plans }, response_format);
          }
          case 'get_project_issues': {
            const parsed = parsePayload(z.object({ project_id: z.number().int().positive() }), payload, action);
            const issues = await client.getProjectIssues(parsed.project_id);
            return toSuccessResponse({ projectId: parsed.project_id, count: issues.length, issues }, response_format);
          }
          case 'get_project_risks': {
            const parsed = parsePayload(z.object({ project_id: z.number().int().positive() }), payload, action);
            const risks = await client.getProjectRisks(parsed.project_id);
            return toSuccessResponse({ projectId: parsed.project_id, count: risks.length, risks }, response_format);
          }
          case 'create_project_issue': {
            const parsed = parsePayload(
              z.object({ project_id: z.number().int().positive(), issue: ProjectIssueCreateSchema }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const created = await client.createProjectIssue(parsed.project_id, parsed.issue as Record<string, unknown>);
            return toSuccessResponse(created, response_format);
          }
          case 'create_project_risk': {
            const parsed = parsePayload(
              z.object({ project_id: z.number().int().positive(), risk: ProjectRiskCreateSchema }),
              payload,
              action,
            );
            assertWriteToolsEnabled(getTeamDynamixConfig());
            const created = await client.createProjectRisk(parsed.project_id, parsed.risk as Record<string, unknown>);
            return toSuccessResponse(created, response_format);
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixTimeGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixTimeTool,
    {
      title: 'TeamDynamix Time Gateway',
      description: 'Gateway for TeamDynamix time type lookup and authenticated user time entries.',
      inputSchema: {
        action: teamdynamixTimeActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'list_time_types': {
            const types = await client.listTimeTypes();
            return toSuccessResponse({ count: types.length, types }, response_format);
          }
          case 'get_my_time_entries': {
            const parsed = parsePayload(z.object({ query: TimeEntryQuerySchema }), payload, action);
            const entries = await client.getMyTimeEntries(parsed.query.StartDate, parsed.query.EndDate);
            return toSuccessResponse({ count: entries.length, entries }, response_format);
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}

function registerTeamDynamixReferenceDataGateway(server: McpServer): void {
  server.registerTool(
    teamdynamixReferenceDataTool,
    {
      title: 'TeamDynamix Reference Data Gateway',
      description:
        'Gateway for TeamDynamix reference/enumeration lookups such as accounts, locations, roles, and custom attributes.',
      inputSchema: {
        action: teamdynamixReferenceDataActionSchema,
        payload: gatewayPayloadSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ action, payload, response_format }) => {
      try {
        const client = createConfiguredTeamDynamixClient();

        switch (action) {
          case 'list_accounts': {
            const parsed = parsePayload(z.object({ app_id: TeamDynamixAppIdSchema.optional() }), payload, action);
            const accounts = await client.listAccounts(parsed.app_id);
            return toSuccessResponse({ count: accounts.length, accounts }, response_format);
          }
          case 'get_account': {
            const parsed = parsePayload(z.object({ account_id: z.number().int().positive() }), payload, action);
            const account = await client.getAccount(parsed.account_id);
            return toSuccessResponse(account, response_format);
          }
          case 'list_locations': {
            const locations = await client.listLocations();
            return toSuccessResponse({ count: locations.length, locations }, response_format);
          }
          case 'list_functional_roles': {
            const roles = await client.listFunctionalRoles();
            return toSuccessResponse({ count: roles.length, roles }, response_format);
          }
          case 'list_custom_attributes': {
            const parsed = parsePayload(
              z.object({
                component_id: CustomAttributeComponentIdSchema,
                app_id: TeamDynamixAppIdSchema.optional(),
                associated_type_id: z.number().int().positive().optional(),
              }),
              payload,
              action,
            );
            const attributes = await client.listCustomAttributes(
              parsed.component_id,
              parsed.app_id,
              parsed.associated_type_id,
            );
            return toSuccessResponse(
              { componentId: parsed.component_id, count: attributes.length, attributes },
              response_format,
            );
          }
        }
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  );
}
