import { describe, expect, it, vi, afterEach } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTeamDynamixKbTools } from '../teamdynamix.kb.tools.js';
import * as clientModule from '../../services/teamdynamix/client.service.js';
import * as configModule from '../../config.js';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockMcpServer = {
  registerTool: vi.fn(),
} as unknown as McpServer;

describe('teamdynamix.kb.tools', () => {
  describe('registerTeamDynamixKbTools', () => {
    it('registers all KB tools', () => {
      registerTeamDynamixKbTools(mockMcpServer);
      expect(vi.mocked(mockMcpServer.registerTool)).toHaveBeenCalledTimes(5);
      const calls = vi.mocked(mockMcpServer.registerTool as any).mock.calls;
      expect(calls[0]?.[0]).toBe('teamdynamix_get_kb_article');
      expect(calls[1]?.[0]).toBe('teamdynamix_search_kb_articles');
      expect(calls[2]?.[0]).toBe('teamdynamix_list_kb_categories');
      expect(calls[3]?.[0]).toBe('teamdynamix_create_kb_article');
      expect(calls[4]?.[0]).toBe('teamdynamix_update_kb_article');
    });

    it('get_kb_article retrieves article by ID with JSON format', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticle = {
        ID: 1,
        Title: 'How to Reset Password',
        Body: 'Follow these steps...',
        IsPublished: true,
      };

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getKbArticle: vi.fn().mockResolvedValue(mockArticle),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article_id: 1,
        response_format: 'json',
      });

      expect(result.structuredContent).toEqual(mockArticle);
      expect(result.isError).toBeUndefined();
    });

    it('get_kb_article retrieves article with markdown format', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticle = {
        ID: 1,
        Title: 'How to Reset Password',
        Body: 'Follow these steps...',
      };

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getKbArticle: vi.fn().mockResolvedValue(mockArticle),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article_id: 1,
        response_format: 'markdown',
      });

      expect(result.content[0]?.text).toContain('ID');
      expect(result.isError).toBeUndefined();
    });

    it('get_kb_article handles article not found', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getKbArticle: vi.fn().mockRejectedValue(new Error('Article not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article_id: 999,
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Article not found');
    });

    it('get_kb_article handles API error', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        getKbArticle: vi.fn().mockRejectedValue(new Error('Service unavailable')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[0]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article_id: 1,
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
    });

    it('search_kb_articles performs keyword search', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticles = [
        { ID: 1, Title: 'Password Reset' },
        { ID: 2, Title: 'Password Policy' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchKbArticles: vi.fn().mockResolvedValue(mockArticles),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        search: { Keyword: 'password' },
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(2);
      expect(result.structuredContent.articles).toEqual(mockArticles);
    });

    it('search_kb_articles searches by category', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticles = [{ ID: 1, Title: 'Email Setup' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchKbArticles: vi.fn().mockResolvedValue(mockArticles),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        search: { CategoryID: 5 },
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(1);
    });

    it('search_kb_articles handles empty results', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchKbArticles: vi.fn().mockResolvedValue([]),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        search: { Keyword: 'nonexistent' },
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(0);
      expect(result.isError).toBeUndefined();
    });

    it('search_kb_articles filters by publish status', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticles = [{ ID: 1, Title: 'Published Article', IsPublished: true }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchKbArticles: vi.fn().mockResolvedValue(mockArticles),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        search: { IsPublished: true },
        response_format: 'json',
      });

      expect(result.structuredContent.articles[0]?.IsPublished).toBe(true);
    });

    it('search_kb_articles handles API error', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        searchKbArticles: vi.fn().mockRejectedValue(new Error('Search timeout')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[1]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        search: { Keyword: 'test' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
    });

    it('list_kb_categories returns all categories', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockCategories = [
        { ID: 1, Name: 'Getting Started' },
        { ID: 2, Name: 'Troubleshooting' },
        { ID: 3, Name: 'FAQ' },
      ];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listKbCategories: vi.fn().mockResolvedValue(mockCategories),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(3);
      expect(result.structuredContent.categories).toEqual(mockCategories);
    });

    it('list_kb_categories handles empty list', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listKbCategories: vi.fn().mockResolvedValue([]),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        response_format: 'json',
      });

      expect(result.structuredContent.count).toBe(0);
    });

    it('list_kb_categories returns markdown format', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockCategories = [{ ID: 1, Name: 'Getting Started' }];

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listKbCategories: vi.fn().mockResolvedValue(mockCategories),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        response_format: 'markdown',
      });

      expect(result.content[0]?.text).toBeDefined();
    });

    it('list_kb_categories handles API error', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        listKbCategories: vi.fn().mockRejectedValue(new Error('API Error')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[2]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
    });

    it('create_kb_article requires write tools enabled', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { Title: 'New Article', Body: 'Content' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('create_kb_article creates article when write tools enabled', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticle = {
        ID: 1,
        Title: 'New Article',
        Body: 'Content',
        IsPublished: false,
      };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        createKbArticle: vi.fn().mockResolvedValue(mockArticle),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { Title: 'New Article', Body: 'Content' },
        response_format: 'json',
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent).toEqual(mockArticle);
    });

    it('create_kb_article with category creates categorized article', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticle = {
        ID: 1,
        Title: 'New Article',
        CategoryID: 5,
        IsPublished: false,
      };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        createKbArticle: vi.fn().mockResolvedValue(mockArticle),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { Title: 'New Article', CategoryID: 5 },
        response_format: 'json',
      });

      expect(result.structuredContent.CategoryID).toBe(5);
    });

    it('create_kb_article handles creation error', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        createKbArticle: vi.fn().mockRejectedValue(new Error('Invalid category')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[3]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { Title: 'New Article', CategoryID: 999 },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Invalid category');
    });

    it('update_kb_article requires write tools enabled', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: false,
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { ArticleID: 1, Title: 'Updated Title' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Write tools are disabled');
    });

    it('update_kb_article updates article when write tools enabled', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticle = {
        ID: 1,
        Title: 'Updated Title',
        Body: 'Updated content',
      };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        updateKbArticle: vi.fn().mockResolvedValue(mockArticle),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { ArticleID: 1, Title: 'Updated Title' },
        response_format: 'json',
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.Title).toBe('Updated Title');
    });

    it('update_kb_article publishes article', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticle = {
        ID: 1,
        Title: 'Article',
        IsPublished: true,
      };

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        updateKbArticle: vi.fn().mockResolvedValue(mockArticle),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { ArticleID: 1, IsPublished: true },
        response_format: 'json',
      });

      expect(result.structuredContent.IsPublished).toBe(true);
    });

    it('update_kb_article handles update error', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        updateKbArticle: vi.fn().mockRejectedValue(new Error('Article not found')),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      const result = await toolHandler({
        app_id: 42,
        article: { ArticleID: 999, Title: 'Updated' },
        response_format: 'json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Article not found');
    });

    it('update_kb_article extracts ArticleID from article object', async () => {
      registerTeamDynamixKbTools(mockMcpServer);

      const mockArticle = { ID: 5, Title: 'Updated' };
      const createClientMock = vi.fn();

      vi.spyOn(configModule, 'getTeamDynamixConfig').mockReturnValue({
        enableWriteTools: true,
      } as any);

      vi.spyOn(clientModule, 'createConfiguredTeamDynamixClient').mockReturnValue({
        updateKbArticle: createClientMock.mockResolvedValue(mockArticle),
      } as any);

      const toolHandler = vi.mocked(mockMcpServer.registerTool as any).mock.calls[4]?.[2];
      if (!toolHandler) throw new Error('Tool handler not found');

      await toolHandler({
        app_id: 42,
        article: { ArticleID: 5, Title: 'Updated' },
        response_format: 'json',
      });

      expect(createClientMock).toHaveBeenCalledWith(42, 5, { Title: 'Updated' });
    });
  });
});
