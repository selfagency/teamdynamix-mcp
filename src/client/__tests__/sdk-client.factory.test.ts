import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createMcpSdkClient } from '../sdk-client.factory.js';
import type { TeamDynamixConfig } from '../../types.js';

// Mock the SDK so we don't need real credentials
vi.mock('@selfagency/teamdynamix-ts', () => {
  const mockClient = {
    discovery: {
      authGetuser: vi.fn().mockResolvedValue({ FullName: 'Demo User' }),
      applications: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Test App' }]),
      authLoginsso: vi.fn().mockResolvedValue({}),
    },
    tickets: {
      appIdTicketsId: vi.fn().mockResolvedValue({ ID: 9001, Title: 'Test Ticket' }),
      appIdTicketsTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Incident' }]),
      appIdTicketsPriorities: vi.fn().mockResolvedValue([{ ID: 1, Name: 'High' }]),
      appIdTicketsFeed: vi.fn().mockResolvedValue([{ ID: 1, Body: 'Comment' }]),
      createTicket: vi.fn().mockResolvedValue({ ID: 42, Title: 'Created' }),
      updateTicket: vi.fn().mockResolvedValue({ ID: 1, Title: 'Updated' }),
      addTicketComment: vi.fn().mockResolvedValue({ ID: 1, Body: 'Fixed.' }),
    },
    knowledgeBase: {
      appIdKnowledgebaseId: vi.fn().mockResolvedValue({ ID: 100, Subject: 'KB Article' }),
      appIdKnowledgebaseCategories: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Category' }]),
      createArticle: vi.fn().mockResolvedValue({ ID: 3001, Subject: 'New Article' }),
      updateArticle: vi.fn().mockResolvedValue({ ID: 1, Subject: 'Updated Article' }),
    },
    people: {
      peopleUid: vi.fn().mockResolvedValue({ UID: 'abc', FullName: 'Test User' }),
      peopleLookup: vi.fn().mockResolvedValue([{ UID: 'abc', FullName: 'Test User' }]),
      groupsId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Test Group' }),
      groupsIdMembers: vi.fn().mockResolvedValue([{ UID: 'abc' }]),
    },
    ticketRelationships: {
      appIdTicketsTicketIdTasks: vi.fn().mockResolvedValue([{ ID: 1, Title: 'Task' }]),
      appIdTicketsIdAssets: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Asset' }]),
      appIdTicketsIdContacts: vi.fn().mockResolvedValue([{ UID: 'abc', FullName: 'Contact' }]),
      createTicketTask: vi.fn().mockResolvedValue({ ID: 1, Title: 'New Task' }),
      addTicketAsset: vi.fn().mockResolvedValue({}),
      removeTicketAsset: vi.fn().mockResolvedValue({}),
      addTicketContact: vi.fn().mockResolvedValue({}),
      removeTicketContact: vi.fn().mockResolvedValue({}),
    },
    assets: {
      appIdAssetsId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Asset' }),
      appIdAssetsFeed: vi.fn().mockResolvedValue([{ ID: 1 }]),
      appIdAssetsStatuses: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Active' }]),
      appIdAssetsModels: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Model' }]),
    },
    cmdb: {
      appIdCmdbId: vi.fn().mockResolvedValue({ ID: 1, Name: 'CI' }),
      appIdCmdbSearches: vi.fn().mockResolvedValue([{ ID: 1 }]),
      appIdCmdbTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Type' }]),
      appIdCmdbRelationshiptypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Depends On' }]),
    },
    services: {
      appIdServices: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Service' }]),
      appIdServicesId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Service' }),
      appIdServicesCategories: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Category' }]),
    },
    projects: {
      projectsFeed: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Project' }]),
      projectsId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Project' }),
      projectsTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Project Type' }]),
      createIssue: vi.fn().mockResolvedValue({ ID: 1 }),
      createRisk: vi.fn().mockResolvedValue({ ID: 1 }),
    },
    referenceData: {
      accounts: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Account' }]),
      accountsId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Account' }),
      locations: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Location' }]),
      industries: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Industry' }]),
      attributesCustom: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Attribute' }]),
      appIdTicketsStatuses: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Open' }]),
      appIdAssetsManufacturers: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Vendor' }]),
      appIdServicesOfferings: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Offering' }]),
    },
    time: {
      timeId: vi.fn().mockResolvedValue({ ID: 1 }),
      timeTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Type' }]),
      timeEntriesFeed: vi.fn().mockResolvedValue([{ ID: 1 }]),
    },
    helpers: {
      resolveTicketLookupContext: vi.fn().mockResolvedValue({ statuses: [], priorities: [], types: [] }),
    },
  };

  return {
    createTeamDynamixClient: vi.fn().mockResolvedValue({ client: mockClient, raw: {}, config: {} }),
    loginWithPassword: vi.fn().mockReturnValue(async () => 'mock-token'),
    loginWithServiceAccount: vi.fn().mockReturnValue(async () => 'mock-token'),
    createTokenProviderFromJWT: vi.fn().mockReturnValue(() => 'mock-jwt'),
    bulkAddUsersToGroup: vi.fn().mockResolvedValue({ added: 1, skipped: 0, errors: [] }),
    projectFields: vi.fn().mockReturnValue([]),
    previewEntity: vi.fn().mockReturnValue({}),
    runTicketReport: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 50, hasMore: false }),
  };
});

const baseConfig: TeamDynamixConfig = {
  baseUrl: 'https://example.teamdynamix.com/TDWebApi',
  authMode: 'standard',
  username: 'demo@example.com',
  password: 'secret',
  timeoutMs: 30_000,
  maxRetries: 3,
  enableWriteTools: true,
  enableAdminTools: false,
};

describe('SDK Client Factory', () => {
  describe('client creation', () => {
    it('should create a client with standard auth', async () => {
      const client = await createMcpSdkClient(baseConfig);
      expect(client).toBeDefined();
      expect(client.discovery).toBeDefined();
      expect(client.tickets).toBeDefined();
      expect(client.referenceData).toBeDefined();
      expect(client.helpers).toBeDefined();
    });

    it('should create a client with admin auth', async () => {
      const adminConfig: TeamDynamixConfig = {
        ...baseConfig,
        authMode: 'admin',
        beid: 'test-beid',
        webServicesKey: 'test-key',
      };
      const client = await createMcpSdkClient(adminConfig);
      expect(client).toBeDefined();
    });
  });

  describe('discovery domain', () => {
    it('should get current user', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const user = await client.discovery.authGetuser();
      expect(user).toEqual({ FullName: 'Demo User' });
    });

    it('should list applications', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const apps = (await client.discovery.applications()) as Array<Record<string, unknown>>;
      expect(apps).toHaveLength(1);
      expect(apps[0].Name).toBe('Test App');
    });
  });

  describe('tickets domain', () => {
    it('should get a ticket by ID', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const ticket = await client.tickets.appIdTicketsId({ params: { path: { appId: 42, id: 9001 } } });
      expect(ticket).toEqual({ ID: 9001, Title: 'Test Ticket' });
    });

    it('should list ticket types', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const types = await client.tickets.appIdTicketsTypes({ params: { path: { appId: 42 } } });
      expect(types).toHaveLength(1);
    });

    it('should create a ticket', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const result = await client.tickets.createTicket({ appId: 42, body: { Title: 'New' } });
      expect(result).toEqual({ ID: 42, Title: 'Created' });
    });

    it('should add a ticket comment', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const result = await client.tickets.addTicketComment({ appId: 42, ticketId: 1, body: { Body: 'Fixed.' } });
      expect(result).toEqual({ ID: 1, Body: 'Fixed.' });
    });
  });

  describe('knowledge base domain', () => {
    it('should get a KB article', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const article = await client.knowledgeBase.appIdKnowledgebaseId({ params: { path: { appId: 42, id: 100 } } });
      expect(article).toEqual({ ID: 100, Subject: 'KB Article' });
    });

    it('should create a KB article', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const result = await client.knowledgeBase.createArticle({ appId: 42, body: { Subject: 'New Article' } });
      expect(result).toEqual({ ID: 3001, Subject: 'New Article' });
    });
  });

  describe('people domain', () => {
    it('should get a person by UID', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const person = await client.people.peopleUid({ params: { path: { uid: 'abc' } } });
      expect(person).toEqual({ UID: 'abc', FullName: 'Test User' });
    });

    it('should get group members', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const members = await client.people.groupsIdMembers({ params: { path: { id: 1 } } });
      expect(members).toHaveLength(1);
    });
  });

  describe('ticket relationships', () => {
    it('should get ticket tasks', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const tasks = await client.ticketRelationships.appIdTicketsTicketIdTasks({
        params: { path: { appId: 42, ticketId: 1 } },
      });
      expect(tasks).toHaveLength(1);
    });

    it('should create a ticket task', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const result = await client.ticketRelationships.createTicketTask({
        appId: 42,
        ticketId: 1,
        body: { Title: 'New Task' },
      });
      expect(result).toEqual({ ID: 1, Title: 'New Task' });
    });
  });

  describe('helpers', () => {
    it('should resolve ticket lookup context', async () => {
      const client = await createMcpSdkClient(baseConfig);
      const context = await client.helpers.resolveTicketLookupContext({ appId: 42 });
      expect(context).toBeDefined();
      expect(context.statuses).toEqual([]);
    });
  });
});
