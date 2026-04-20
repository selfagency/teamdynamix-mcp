import { describe, expect, it, vi, afterEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerTeamDynamixTicketTaskTools,
  registerTeamDynamixTicketContactTools,
} from '../teamdynamix.ticket-tasks.tools.js';
import * as clientModule from '../../services/teamdynamix/client.service.js';
import * as configModule from '../../config.js';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockMcpServer = {
  registerTool: vi.fn(),
} as unknown as McpServer;

describe('teamdynamix.ticket-tasks.tools', () => {
  describe('registerTeamDynamixTicketTaskTools', () => {
    it('registers all ticket task tools', () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);
      expect(vi.mocked(mockMcpServer.registerTool)).toHaveBeenCalledTimes(5);
      const calls = vi.mocked(mockMcpServer.registerTool as any).mock.calls;
      expect(calls[0]?.[0]).toBe('teamdynamix_get_ticket_tasks');
      expect(calls[1]?.[0]).toBe('teamdynamix_create_ticket_task');
      expect(calls[2]?.[0]).toBe('teamdynamix_list_ticket_assets');
      expect(calls[3]?.[0]).toBe('teamdynamix_add_ticket_asset');
      expect(calls[4]?.[0]).toBe('teamdynamix_remove_ticket_asset');
    });

    it('get_ticket_tasks returns all tasks for ticket', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      const mockTasks = [
        { ID: 1, Title: 'Task 1' },
        { ID: 2, Title: 'Task 2' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketTasks: vi.fn().mockResolvedValue(mockTasks),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(2);
      expect(result.structuredContent.appId).toBe(42);
      expect(result.structuredContent.ticketId).toBe(1);
      expect(result.structuredContent.tasks).toEqual(mockTasks);
    });

    it('get_ticket_tasks returns markdown format', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      const mockTasks = [{ ID: 1, Title: 'Task 1' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketTasks: vi.fn().mockResolvedValue(mockTasks),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'markdown',
      });

      expect(result.content[0]?.text).toContain('ID');
      expect(result.isError).toBeUndefined();
    });

    it('get_ticket_tasks handles empty task list', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketTasks: vi.fn().mockResolvedValue([]),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(0);
      expect(result.isError).toBeUndefined();
    });

    it('get_ticket_tasks handles API error', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketTasks: vi.fn().mockRejectedValue(new Error('Ticket not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 999,
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Ticket not found');
    });

    it('create_ticket_task requires write tools enabled', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        task: { TicketID: 1, Title: 'New Task' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('create_ticket_task creates task when write tools enabled', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      const mockTask = { ID: 1, Title: 'New Task' };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        createTicketTask: vi.fn().mockResolvedValue(mockTask),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        task: { TicketID: 1, Title: 'New Task' },
        response_format: 'json',
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent).toEqual(mockTask);
    });

    it('create_ticket_task handles creation error', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        createTicketTask: vi.fn().mockRejectedValue(new Error('Invalid task data')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        task: { TicketID: 1, Title: 'New Task' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Invalid task data');
    });

    it('list_ticket_assets returns all assets for ticket', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      const mockAssets = [
        { ID: 1, Name: 'Server 1' },
        { ID: 2, Name: 'Server 2' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listTicketAssets: vi.fn().mockResolvedValue(mockAssets),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(2);
      expect(result.structuredContent.assets).toEqual(mockAssets);
    });

    it('list_ticket_assets handles empty asset list', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listTicketAssets: vi.fn().mockResolvedValue([]),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(0);
    });

    it('add_ticket_asset requires write tools enabled', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        asset_id: 1,
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('add_ticket_asset links asset when write tools enabled', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      const mockResult = { ID: 1, Success: true };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        addTicketAsset: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        asset_id: 5,
        response_format: 'json',
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent).toEqual(mockResult);
    });

    it('add_ticket_asset handles linking error', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        addTicketAsset: vi.fn().mockRejectedValue(new Error('Asset already linked')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        asset_id: 5,
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
    });

    it('remove_ticket_asset requires write tools enabled', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        asset_id: 5,
        confirm: true,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('remove_ticket_asset unlinks asset when write tools enabled', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        removeTicketAsset: vi.fn().mockResolvedValue(void 0),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        asset_id: 5,
        confirm: true,
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.unlinked).toBe(true);
      expect(result.content[0]?.text).toContain('Asset 5 unlinked from ticket 1');
    });

    it('remove_ticket_asset handles deletion error', async () => {
      registerTeamDynamixTicketTaskTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        removeTicketAsset: vi.fn().mockRejectedValue(new Error('Asset not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        asset_id: 999,
        confirm: true,
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('registerTeamDynamixTicketContactTools', () => {
    it('registers all ticket contact tools', () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);
      expect(vi.mocked(mockMcpServer.registerTool)).toHaveBeenCalledTimes(3);
      const calls = vi.mocked(mockMcpServer.registerTool as any).mock.calls;
      expect(calls[0]?.[0]).toBe('teamdynamix_get_ticket_contacts');
      expect(calls[1]?.[0]).toBe('teamdynamix_add_ticket_contact');
      expect(calls[2]?.[0]).toBe('teamdynamix_remove_ticket_contact');
    });

    it('get_ticket_contacts returns all contacts for ticket', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      const mockContacts = [
        { UID: '550e8400-e29b-41d4-a716-446655440001', Name: 'John Doe' },
        { UID: '550e8400-e29b-41d4-a716-446655440002', Name: 'Jane Smith' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketContacts: vi.fn().mockResolvedValue(mockContacts),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(2);
      expect(result.structuredContent.contacts).toEqual(mockContacts);
    });

    it('get_ticket_contacts returns markdown format', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      const mockContacts = [{ UID: '550e8400-e29b-41d4-a716-446655440001', Name: 'John' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketContacts: vi.fn().mockResolvedValue(mockContacts),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'markdown',
      });

      expect(result.content[0]?.text).toBeDefined();
      expect(result.isError).toBeUndefined();
    });

    it('get_ticket_contacts handles empty contact list', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketContacts: vi.fn().mockResolvedValue([]),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(0);
    });

    it('get_ticket_contacts handles API error', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getTicketContacts: vi.fn().mockRejectedValue(new Error('Ticket not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 999,
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Ticket not found');
    });

    it('add_ticket_contact requires write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        contact_uid: '550e8400-e29b-41d4-a716-446655440001',
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('add_ticket_contact adds contact when write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      const mockResult = { ID: 1, Success: true };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        addTicketContact: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        contact_uid: '550e8400-e29b-41d4-a716-446655440001',
        response_format: 'json',
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent).toEqual(mockResult);
    });

    it('add_ticket_contact handles addition error', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        addTicketContact: vi.fn().mockRejectedValue(new Error('User not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        contact_uid: '550e8400-e29b-41d4-a716-446655440001',
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('User not found');
    });

    it('remove_ticket_contact requires write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        contact_uid: '550e8400-e29b-41d4-a716-446655440001',
        confirm: true,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('remove_ticket_contact removes contact when write tools enabled', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        removeTicketContact: vi.fn().mockResolvedValue(void 0),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        contact_uid: '550e8400-e29b-41d4-a716-446655440001',
        confirm: true,
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.removed).toBe(true);
      expect(result.content[0]?.text).toContain('Contact 550e8400-e29b-41d4-a716-446655440001 removed');
    });

    it('remove_ticket_contact handles removal error', async () => {
      vi.mocked(mockMcpServer.registerTool).mockClear();
      registerTeamDynamixTicketContactTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        removeTicketContact: vi.fn().mockRejectedValue(new Error('Contact not associated')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        ticket_id: 1,
        contact_uid: '550e8400-e29b-41d4-a716-446655440001',
        confirm: true,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Contact not associated');
    });
  });
});
