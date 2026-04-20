import { describe, expect, it, vi, afterEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerTeamDynamixServiceCatalogTools,
  registerTeamDynamixProjectTools,
} from '../teamdynamix.services.tools.js';
import * as clientModule from '../../services/teamdynamix/client.service.js';
import * as configModule from '../../config.js';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockMcpServer = {
  registerTool: vi.fn(),
} as unknown as McpServer;

describe('teamdynamix.services.tools', () => {
  describe('registerTeamDynamixServiceCatalogTools', () => {
    it('registers all service catalog tools', () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);
      expect(vi.mocked(mockMcpServer.registerTool)).toHaveBeenCalledTimes(4);
      const calls = vi.mocked(mockMcpServer.registerTool as any).mock.calls;
      expect(calls[0]?.[0]).toBe('teamdynamix_list_services');
      expect(calls[1]?.[0]).toBe('teamdynamix_get_service');
      expect(calls[2]?.[0]).toBe('teamdynamix_search_services');
      expect(calls[3]?.[0]).toBe('teamdynamix_list_service_categories');
    });

    it('list_services returns formatted service data', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      const mockServices = [
        { ID: 1, Name: 'Email Support' },
        { ID: 2, Name: 'Phone Support' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listServiceCatalog: vi.fn().mockResolvedValue(mockServices),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ app_id: 42, response_format: 'json' });

      expect(result.content[0]?.text).toContain('"ID": 1');
      expect(result.structuredContent.count).toBe(2);
      expect(result.structuredContent.services).toEqual(mockServices);
    });

    it('list_services returns markdown format when requested', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      const mockServices = [{ ID: 1, Name: 'Service' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listServiceCatalog: vi.fn().mockResolvedValue(mockServices),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ app_id: 42, response_format: 'markdown' });

      expect(result.content[0]?.text).toContain('"ID": 1');
      expect(result.isError).toBeUndefined();
    });

    it('list_services handles client errors', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listServiceCatalog: vi.fn().mockRejectedValue(new Error('API Error')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ app_id: 42, response_format: 'json' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Error: API Error');
    });

    it('get_service retrieves single service with JSON format', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      const mockService = { ID: 1, Name: 'Email Support', Description: 'Email support service' };

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getService: vi.fn().mockResolvedValue(mockService),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ app_id: 42, service_id: 1, response_format: 'json' });

      expect(result.structuredContent).toEqual(mockService);
      expect(result.isError).toBeUndefined();
    });

    it('get_service handles missing service', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getService: vi.fn().mockRejectedValue(new Error('Service not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ app_id: 42, service_id: 999, response_format: 'json' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Service not found');
    });

    it('search_services performs search with criteria', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      const mockServices = [{ ID: 1, Name: 'Matching Service' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchServices: vi.fn().mockResolvedValue(mockServices),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        search: { Keyword: 'support' },
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(1);
      expect(result.structuredContent.services).toEqual(mockServices);
    });

    it('search_services handles empty results', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchServices: vi.fn().mockResolvedValue([]),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        search: { Keyword: 'nonexistent' },
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(0);
      expect(result.isError).toBeUndefined();
    });

    it('list_service_categories returns all categories', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      const mockCategories = [
        { ID: 1, Name: 'Infrastructure' },
        { ID: 2, Name: 'Applications' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listServiceCategories: vi.fn().mockResolvedValue(mockCategories),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ app_id: 42, response_format: 'json' });

      expect(result.structuredContent.count).toBe(2);
      expect(result.structuredContent.categories).toEqual(mockCategories);
    });

    it('list_service_categories handles API error', async () => {
      registerTeamDynamixServiceCatalogTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listServiceCategories: vi.fn().mockRejectedValue(new Error('API Timeout')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ app_id: 42, response_format: 'json' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('API Timeout');
    });
  });

  describe('registerTeamDynamixProjectTools', () => {
    it('registers all project tools', () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);
      expect(vi.mocked(mockMcpServer.registerTool)).toHaveBeenCalledTimes(10);
      const calls = vi.mocked(mockMcpServer.registerTool as any).mock.calls;
      expect(calls[0]?.[0]).toBe('teamdynamix_get_project');
      expect(calls[1]?.[0]).toBe('teamdynamix_search_projects');
      expect(calls[2]?.[0]).toBe('teamdynamix_list_project_types');
    });

    it('get_project retrieves project details', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockProject = { ID: 1, Name: 'Website Redesign', Status: 'Active' };

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getProject: vi.fn().mockResolvedValue(mockProject),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ project_id: 1, response_format: 'json' });

      expect(result.structuredContent).toEqual(mockProject);
    });

    it('get_project handles not found error', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getProject: vi.fn().mockRejectedValue(new Error('Project not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ project_id: 999, response_format: 'json' });

      expect(result.isError).toBe(true);
    });

    it('search_projects searches by criteria', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockProjects = [{ ID: 1, Name: 'Website Redesign' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchProjects: vi.fn().mockResolvedValue(mockProjects),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        search: { Keyword: 'website' },
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(1);
    });

    it('list_project_types returns all types', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockTypes = [
        { ID: 1, Name: 'Software' },
        { ID: 2, Name: 'Infrastructure' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listProjectTypes: vi.fn().mockResolvedValue(mockTypes),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ response_format: 'json' });

      expect(result.structuredContent.count).toBe(2);
    });

    it('get_project_plans returns all plans for project', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockPlans = [
        { ID: 1, Name: 'Phase 1' },
        { ID: 2, Name: 'Phase 2' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getProjectPlans: vi.fn().mockResolvedValue(mockPlans),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ project_id: 1, response_format: 'json' });

      expect(result.structuredContent.count).toBe(2);
      expect(result.structuredContent.projectId).toBe(1);
    });

    it('get_project_issues returns all issues for project', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockIssues = [{ ID: 1, Title: 'Issue 1' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getProjectIssues: vi.fn().mockResolvedValue(mockIssues),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ project_id: 1, response_format: 'json' });

      expect(result.structuredContent.count).toBe(1);
    });

    it('get_project_risks returns all risks for project', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockRisks = [{ ID: 1, Title: 'Risk 1' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getProjectRisks: vi.fn().mockResolvedValue(mockRisks),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[5]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ project_id: 1, response_format: 'json' });

      expect(result.structuredContent.count).toBe(1);
    });

    it('create_project_issue requires write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[6]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        project_id: 1,
        issue: { Title: 'New Issue' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('create_project_issue creates issue when write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockIssue = { ID: 1, Title: 'New Issue' };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        createProjectIssue: vi.fn().mockResolvedValue(mockIssue),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[6]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        project_id: 1,
        issue: { Title: 'New Issue' },
        response_format: 'json',
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent).toEqual(mockIssue);
    });

    it('create_project_risk requires write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[7]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        project_id: 1,
        risk: { Title: 'New Risk' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
    });

    it('create_project_risk creates risk when write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockRisk = { ID: 1, Title: 'New Risk' };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        createProjectRisk: vi.fn().mockResolvedValue(mockRisk),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[7]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        project_id: 1,
        risk: { Title: 'New Risk' },
        response_format: 'json',
      });

      expect(result.isError).toBeUndefined();
    });

    it('list_time_types returns all time types', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockTypes = [
        { ID: 1, Name: 'Development' },
        { ID: 2, Name: 'Testing' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listTimeTypes: vi.fn().mockResolvedValue(mockTypes),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[8]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({ response_format: 'json' });

      expect(result.structuredContent.count).toBe(2);
    });

    it('get_my_time_entries queries user time entries', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      const mockEntries = [{ ID: 1, Hours: 8 }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getMyTimeEntries: vi.fn().mockResolvedValue(mockEntries),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[9]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        query: { StartDate: '2026-01-01', EndDate: '2026-01-31' },
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(1);
    });

    it('get_my_time_entries handles API error', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixProjectTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getMyTimeEntries: vi.fn().mockRejectedValue(new Error('Unauthorized')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[9]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        query: { StartDate: '2026-01-01', EndDate: '2026-01-31' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Unauthorized');
    });
  });
});
