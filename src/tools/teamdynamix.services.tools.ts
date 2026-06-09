import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getTeamDynamixConfig } from '../config.js';
import { TEAMDYNAMIX_TOOL_PREFIX } from '../constants.js';
import {
  ProjectIssueCreateSchema,
  ProjectRiskCreateSchema,
  ProjectSearchSchema,
  ServiceSearchSchema,
  TeamDynamixAppIdSchema,
  TeamDynamixResponseFormatSchema,
  TimeEntryQuerySchema,
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

export function registerTeamDynamixServiceCatalogTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_services`,
    {
      title: 'List Service Catalog',
      description: 'Returns all services in the TeamDynamix service catalog for the given application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const services = await client.listServiceCatalog(app_id);
        return {
          content: [{ type: 'text', text: render(services, response_format) }],
          structuredContent: { appId: app_id, count: services.length, services },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_service`,
    {
      title: 'Get Service',
      description: 'Retrieves detailed information for a specific TeamDynamix service catalog entry.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        service_id: z.number().int().positive().describe('Service catalog entry ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      app_id,
      service_id,
      response_format,
    }: {
      app_id: number;
      service_id: number;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const service = await client.getService(app_id, service_id);
        return {
          content: [{ type: 'text', text: render(service, response_format) }],
          structuredContent: service as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_services`,
    {
      title: 'Search Service Catalog',
      description: 'Searches the TeamDynamix service catalog by keyword, category, or active status.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        search: ServiceSearchSchema,
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
      search: z.infer<typeof ServiceSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const services = await client.searchServices(app_id, search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(services, response_format) }],
          structuredContent: { appId: app_id, count: services.length, services },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_service_categories`,
    {
      title: 'List Service Categories',
      description: 'Returns all service catalog categories for the given TeamDynamix application.',
      inputSchema: {
        app_id: TeamDynamixAppIdSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ app_id, response_format }: { app_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const categories = await client.listServiceCategories(app_id);
        return {
          content: [{ type: 'text', text: render(categories, response_format) }],
          structuredContent: { appId: app_id, count: categories.length, categories },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}

export function registerTeamDynamixProjectTools(server: McpServer): void {
  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_project`,
    {
      title: 'Get Project',
      description: 'Retrieves full details for a TeamDynamix project by its numeric ID.',
      inputSchema: {
        project_id: z.number().int().positive().describe('TeamDynamix project ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ project_id, response_format }: { project_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const project = await client.getProject(project_id);
        return {
          content: [{ type: 'text', text: render(project, response_format) }],
          structuredContent: project as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_search_projects`,
    {
      title: 'Search Projects',
      description: 'Searches TeamDynamix projects by name, type, manager, or active status.',
      inputSchema: {
        search: ProjectSearchSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({
      search,
      response_format,
    }: {
      search: z.infer<typeof ProjectSearchSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const projects = await client.searchProjects(search as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: render(projects, response_format) }],
          structuredContent: { count: projects.length, projects },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_project_types`,
    {
      title: 'List Project Types',
      description: 'Returns all project type definitions available in TeamDynamix.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const types = await client.listProjectTypes();
        return {
          content: [{ type: 'text', text: render(types, response_format) }],
          structuredContent: { count: types.length, types },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_project_plans`,
    {
      title: 'Get Project Plans',
      description: 'Returns all plans/boards for a TeamDynamix project.',
      inputSchema: {
        project_id: z.number().int().positive().describe('TeamDynamix project ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ project_id, response_format }: { project_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const plans = await client.getProjectPlans(project_id);
        return {
          content: [{ type: 'text', text: render(plans, response_format) }],
          structuredContent: { projectId: project_id, count: plans.length, plans },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_project_issues`,
    {
      title: 'Get Project Issues',
      description: 'Returns all issues for a TeamDynamix project.',
      inputSchema: {
        project_id: z.number().int().positive().describe('TeamDynamix project ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ project_id, response_format }: { project_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const issues = await client.getProjectIssues(project_id);
        return {
          content: [{ type: 'text', text: render(issues, response_format) }],
          structuredContent: { projectId: project_id, count: issues.length, issues },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_project_risks`,
    {
      title: 'Get Project Risks',
      description: 'Returns all risks for a TeamDynamix project.',
      inputSchema: {
        project_id: z.number().int().positive().describe('TeamDynamix project ID.'),
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ project_id, response_format }: { project_id: number; response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const risks = await client.getProjectRisks(project_id);
        return {
          content: [{ type: 'text', text: render(risks, response_format) }],
          structuredContent: { projectId: project_id, count: risks.length, risks },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_create_project_issue`,
    {
      title: 'Create Project Issue',
      description: 'Creates a new issue on a TeamDynamix project. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        project_id: z.number().int().positive().describe('TeamDynamix project ID.'),
        issue: ProjectIssueCreateSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      project_id,
      issue,
      response_format,
    }: {
      project_id: number;
      issue: z.infer<typeof ProjectIssueCreateSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const created = await client.createProjectIssue(project_id, issue as Record<string, unknown>);
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
    `${TEAMDYNAMIX_TOOL_PREFIX}_create_project_risk`,
    {
      title: 'Create Project Risk',
      description: 'Creates a new risk on a TeamDynamix project. Requires TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true.',
      inputSchema: {
        project_id: z.number().int().positive().describe('TeamDynamix project ID.'),
        risk: ProjectRiskCreateSchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({
      project_id,
      risk,
      response_format,
    }: {
      project_id: number;
      risk: z.infer<typeof ProjectRiskCreateSchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const config = getTeamDynamixConfig();
        assertWriteToolsEnabled(config);
        const client = createConfiguredTeamDynamixClient();
        const created = await client.createProjectRisk(project_id, risk as Record<string, unknown>);
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
    `${TEAMDYNAMIX_TOOL_PREFIX}_list_time_types`,
    {
      title: 'List Time Types',
      description: 'Returns all time entry type definitions in TeamDynamix.',
      inputSchema: {
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ response_format }: { response_format: ResponseFormat }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const types = await client.listTimeTypes();
        return {
          content: [{ type: 'text', text: render(types, response_format) }],
          structuredContent: { count: types.length, types },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    `${TEAMDYNAMIX_TOOL_PREFIX}_get_my_time_entries`,
    {
      title: 'Get My Time Entries',
      description: "Returns the authenticated user's time entries for a date range.",
      inputSchema: {
        query: TimeEntryQuerySchema,
        response_format: TeamDynamixResponseFormatSchema,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({
      query,
      response_format,
    }: {
      query: z.infer<typeof TimeEntryQuerySchema>;
      response_format: ResponseFormat;
    }) => {
      try {
        const client = createConfiguredTeamDynamixClient();
        const entries = await client.getMyTimeEntries(query.StartDate, query.EndDate);
        return {
          content: [{ type: 'text', text: render(entries, response_format) }],
          structuredContent: { count: entries.length, entries },
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${messageFromError(error)}` }], isError: true };
      }
    },
  );
}
