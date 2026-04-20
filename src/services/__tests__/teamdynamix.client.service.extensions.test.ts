import { describe, expect, it, vi, afterEach } from 'vitest';
import { TeamDynamixClient } from '../../services/teamdynamix/client.service.js';
import * as coreService from '../../services/teamdynamix/core.service.js';

afterEach(() => {
  vi.restoreAllMocks();
});

const baseConfig = {
  baseUrl: 'https://example.teamdynamix.com/TDWebApi',
  authMode: 'standard' as const,
  username: 'user@example.com',
  password: 'secret',
  timeoutMs: 30_000,
  maxRetries: 2,
  enableWriteTools: true,
  enableAdminTools: false,
};

// Helper to create mocks that handle auth + API call
const setupMockFetch = (responseData: unknown) => {
  let callCount = 0;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    callCount += 1;
    if (callCount === 1) {
      return new Response('fake.jwt.token', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }
    // Return the API response with Success and Object fields
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
};

describe('teamdynamix.client.service extensions', () => {
  it('getAllTicketEnumerations retrieves all enumeration data', async () => {
    const mockStatuses = [{ ID: 1, Name: 'New' }];
    setupMockFetch(mockStatuses);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTicketStatuses(42);

    expect(result).toEqual(mockStatuses);
  });

  it('listApplications returns list of applications', async () => {
    const mockApps = [{ ID: 42, Name: 'Service Desk' }];
    setupMockFetch(mockApps);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listApplications();

    expect(result).toEqual(mockApps);
  });

  it('getTicket retrieves single ticket', async () => {
    const mockTicket = { ID: 1, Title: 'Test' };
    setupMockFetch(mockTicket);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getTicket(42, 1);

    expect(result).toEqual(mockTicket);
  });

  it('searchTickets performs POST search', async () => {
    const mockResults = [{ ID: 1, Title: 'Result' }];
    setupMockFetch(mockResults);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchTickets(42, { Keyword: 'test' });

    expect(result).toEqual(mockResults);
  });

  it('createTicket creates new ticket', async () => {
    const mockTicket = { ID: 100, Title: 'New' };
    setupMockFetch(mockTicket);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.createTicket(42, { Title: 'New' }, true, true);

    expect(result.ID).toBe(100);
  });

  it('updateTicket updates existing ticket', async () => {
    const mockTicket = { ID: 1, Title: 'Updated' };
    setupMockFetch(mockTicket);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.updateTicket(42, 1, { Title: 'Updated' });

    expect(result.Title).toBe('Updated');
  });

  it('addTicketComment adds comment to ticket', async () => {
    const mockResult = { ID: 1, Body: 'Comment' };
    setupMockFetch(mockResult);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.addTicketComment(42, 1, 'Comment');

    expect(result).toEqual(mockResult);
  });

  it('getTicketFeed returns feed for ticket', async () => {
    const mockFeed = [{ ID: 1, Body: 'Feed 1' }];
    setupMockFetch(mockFeed);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getTicketFeed(42, 1);

    expect(result).toEqual(mockFeed);
  });

  it('getTicketTasks returns all tasks', async () => {
    const mockTasks = [{ ID: 1, Title: 'Task 1' }];
    setupMockFetch(mockTasks);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getTicketTasks(42, 1);

    expect(result).toEqual(mockTasks);
  });

  it('createTicketTask creates new task', async () => {
    const mockTask = { ID: 1, Title: 'New Task' };
    setupMockFetch(mockTask);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.createTicketTask(42, 1, { Title: 'New Task' });

    expect(result).toEqual(mockTask);
  });

  it('listTicketAssets returns all assets', async () => {
    const mockAssets = [{ ID: 1, Name: 'Asset' }];
    setupMockFetch(mockAssets);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTicketAssets(42, 1);

    expect(result).toEqual(mockAssets);
  });

  it('addTicketAsset links asset to ticket', async () => {
    const mockResult = { ID: 1, Success: true };
    setupMockFetch(mockResult);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.addTicketAsset(42, 1, 5);

    expect(result).toEqual(mockResult);
  });

  it('removeTicketAsset removes asset from ticket', async () => {
    let deleteWasCalled = false;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
      if ((opts as any)?.method === 'DELETE') {
        deleteWasCalled = true;
      }
      if (!deleteWasCalled) {
        return new Response('token', { status: 200 });
      }
      return new Response('', { status: 200 });
    });
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    await client.removeTicketAsset(42, 1, 5);

    expect(deleteWasCalled).toBe(true);
  });

  it('getTicketContacts returns all contacts', async () => {
    const mockContacts = [{ UID: '550e8400-e29b-41d4-a716-446655440001', Name: 'John' }];
    setupMockFetch(mockContacts);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getTicketContacts(42, 1);

    expect(result).toEqual(mockContacts);
  });

  it('addTicketContact adds contact to ticket', async () => {
    const mockResult = { ID: 1, Success: true };
    setupMockFetch(mockResult);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const uid = '550e8400-e29b-41d4-a716-446655440001';
    const result = await client.addTicketContact(42, 1, uid);

    expect(result).toEqual(mockResult);
  });

  it('removeTicketContact removes contact from ticket', async () => {
    let deleteWasCalled = false;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
      if ((opts as any)?.method === 'DELETE') {
        deleteWasCalled = true;
      }
      if (!deleteWasCalled) {
        return new Response('token', { status: 200 });
      }
      return new Response('', { status: 200 });
    });
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const uid = '550e8400-e29b-41d4-a716-446655440001';
    await client.removeTicketContact(42, 1, uid);

    expect(deleteWasCalled).toBe(true);
  });

  it('getKbArticle retrieves article', async () => {
    const mockArticle = { ID: 1, Title: 'Article' };
    setupMockFetch(mockArticle);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getKbArticle(42, 1);

    expect(result).toEqual(mockArticle);
  });

  it('searchKbArticles searches KB', async () => {
    const mockArticles = [{ ID: 1, Title: 'Result' }];
    setupMockFetch(mockArticles);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchKbArticles(42, { Keyword: 'test' });

    expect(result).toEqual(mockArticles);
  });

  it('listKbCategories returns categories', async () => {
    const mockCategories = [{ ID: 1, Name: 'Getting Started' }];
    setupMockFetch(mockCategories);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listKbCategories(42);

    expect(result).toEqual(mockCategories);
  });

  it('createKbArticle creates article', async () => {
    const mockArticle = { ID: 1, Title: 'New Article' };
    setupMockFetch(mockArticle);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.createKbArticle(42, { Title: 'New Article' });

    expect(result).toEqual(mockArticle);
  });

  it('updateKbArticle updates article', async () => {
    const mockArticle = { ID: 1, Title: 'Updated' };
    setupMockFetch(mockArticle);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.updateKbArticle(42, 1, { Title: 'Updated' });

    expect(result).toEqual(mockArticle);
  });

  it('getProject retrieves project', async () => {
    const mockProject = { ID: 1, Name: 'Project' };
    setupMockFetch(mockProject);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getProject(1);

    expect(result).toEqual(mockProject);
  });

  it('searchProjects searches projects', async () => {
    const mockProjects = [{ ID: 1, Name: 'Result' }];
    setupMockFetch(mockProjects);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchProjects({ Keyword: 'test' });

    expect(result).toEqual(mockProjects);
  });

  it('listProjectTypes returns types', async () => {
    const mockTypes = [{ ID: 1, Name: 'Software' }];
    setupMockFetch(mockTypes);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listProjectTypes();

    expect(result).toEqual(mockTypes);
  });

  it('getProjectPlans returns plans', async () => {
    const mockPlans = [{ ID: 1, Name: 'Phase 1' }];
    setupMockFetch(mockPlans);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getProjectPlans(1);

    expect(result).toEqual(mockPlans);
  });

  it('getProjectIssues returns issues', async () => {
    const mockIssues = [{ ID: 1, Title: 'Issue' }];
    setupMockFetch(mockIssues);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getProjectIssues(1);

    expect(result).toEqual(mockIssues);
  });

  it('getProjectRisks returns risks', async () => {
    const mockRisks = [{ ID: 1, Title: 'Risk' }];
    setupMockFetch(mockRisks);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getProjectRisks(1);

    expect(result).toEqual(mockRisks);
  });

  it('createProjectIssue creates issue', async () => {
    const mockIssue = { ID: 1, Title: 'New' };
    setupMockFetch(mockIssue);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.createProjectIssue(1, { Title: 'New' });

    expect(result).toEqual(mockIssue);
  });

  it('createProjectRisk creates risk', async () => {
    const mockRisk = { ID: 1, Title: 'New' };
    setupMockFetch(mockRisk);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.createProjectRisk(1, { Title: 'New' });

    expect(result).toEqual(mockRisk);
  });

  it('listTimeTypes returns types', async () => {
    const mockTypes = [{ ID: 1, Name: 'Development' }];
    setupMockFetch(mockTypes);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTimeTypes();

    expect(result).toEqual(mockTypes);
  });

  it('getMyTimeEntries returns entries', async () => {
    const mockEntries = [{ ID: 1, Hours: 8 }];
    setupMockFetch(mockEntries);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getMyTimeEntries('2026-01-01', '2026-01-31');

    expect(result).toEqual(mockEntries);
  });

  it('listServiceCatalog returns services', async () => {
    const mockServices = [{ ID: 1, Name: 'Service' }];
    setupMockFetch(mockServices);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listServiceCatalog(42);

    expect(result).toEqual(mockServices);
  });

  it('getService retrieves single service', async () => {
    const mockService = { ID: 1, Name: 'Service' };
    setupMockFetch(mockService);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getService(42, 1);

    expect(result).toEqual(mockService);
  });

  it('searchServices searches services', async () => {
    const mockResults = [{ ID: 1, Name: 'Result' }];
    setupMockFetch(mockResults);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchServices(42, { Keyword: 'test' });

    expect(result).toEqual(mockResults);
  });

  it('listServiceCategories returns categories', async () => {
    const mockCategories = [{ ID: 1, Name: 'Infrastructure' }];
    setupMockFetch(mockCategories);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listServiceCategories(42);

    expect(result).toEqual(mockCategories);
  });

  it('getCurrentUser retrieves current user', async () => {
    const mockUser = { UID: '550e8400-e29b-41d4-a716-446655440001', Name: 'User' };
    setupMockFetch(mockUser);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getCurrentUser();

    expect(result).toEqual(mockUser);
  });

  it('getUser retrieves user by UID', async () => {
    const mockUser = { UID: '550e8400-e29b-41d4-a716-446655440001', Name: 'User' };
    setupMockFetch(mockUser);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getUser('550e8400-e29b-41d4-a716-446655440001');

    expect(result).toEqual(mockUser);
  });

  it('searchUsers searches users', async () => {
    const mockUsers = [{ UID: '550e8400-e29b-41d4-a716-446655440001', Name: 'User' }];
    setupMockFetch(mockUsers);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchUsers({ Keyword: 'test' });

    expect(result).toEqual(mockUsers);
  });

  it('getGroup retrieves group', async () => {
    const mockGroup = { ID: 1, Name: 'Group' };
    setupMockFetch(mockGroup);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getGroup(1);

    expect(result).toEqual(mockGroup);
  });

  it('searchGroups searches groups', async () => {
    const mockGroups = [{ ID: 1, Name: 'Result' }];
    setupMockFetch(mockGroups);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchGroups({ Keyword: 'test' });

    expect(result).toEqual(mockGroups);
  });

  it('getGroupMembers retrieves group members', async () => {
    const mockMembers = [{ UID: '550e8400-e29b-41d4-a716-446655440001', Name: 'Member' }];
    setupMockFetch(mockMembers);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getGroupMembers(1);

    expect(result).toEqual(mockMembers);
  });

  it('getAsset retrieves asset', async () => {
    const mockAsset = { ID: 1, Name: 'Asset' };
    setupMockFetch(mockAsset);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getAsset(42, 1);

    expect(result).toEqual(mockAsset);
  });

  it('searchAssets searches assets', async () => {
    const mockAssets = [{ ID: 1, Name: 'Result' }];
    setupMockFetch(mockAssets);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchAssets(42, { Keyword: 'test' });

    expect(result).toEqual(mockAssets);
  });

  it('listAssetStatuses returns statuses', async () => {
    const mockStatuses = [{ ID: 1, Name: 'Active' }];
    setupMockFetch(mockStatuses);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listAssetStatuses(42);

    expect(result).toEqual(mockStatuses);
  });

  it('listProductModels returns models', async () => {
    const mockModels = [{ ID: 1, Name: 'Model' }];
    setupMockFetch(mockModels);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listProductModels(42);

    expect(result).toEqual(mockModels);
  });

  it('listVendors returns vendors', async () => {
    const mockVendors = [{ ID: 1, Name: 'Vendor' }];
    setupMockFetch(mockVendors);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listVendors(42);

    expect(result).toEqual(mockVendors);
  });

  it('getConfigurationItem retrieves CI', async () => {
    const mockCI = { ID: 1, Name: 'CI' };
    setupMockFetch(mockCI);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getConfigurationItem(42, 1);

    expect(result).toEqual(mockCI);
  });

  it('searchConfigurationItems searches CIs', async () => {
    const mockCIs = [{ ID: 1, Name: 'Result' }];
    setupMockFetch(mockCIs);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.searchConfigurationItems(42, { Keyword: 'test' });

    expect(result).toEqual(mockCIs);
  });

  it('listCiTypes returns types', async () => {
    const mockTypes = [{ ID: 1, Name: 'Type' }];
    setupMockFetch(mockTypes);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listCiTypes(42);

    expect(result).toEqual(mockTypes);
  });

  it('listCiRelationshipTypes returns relationship types', async () => {
    const mockTypes = [{ ID: 1, Name: 'Hosted On' }];
    setupMockFetch(mockTypes);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listCiRelationshipTypes();

    expect(result).toEqual(mockTypes);
  });

  it('listAccounts returns accounts', async () => {
    const mockAccounts = [{ ID: 1, Name: 'Account' }];
    setupMockFetch(mockAccounts);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listAccounts();

    expect(result).toEqual(mockAccounts);
  });

  it('getAccount retrieves account', async () => {
    const mockAccount = { ID: 1, Name: 'Account' };
    setupMockFetch(mockAccount);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.getAccount(1);

    expect(result).toEqual(mockAccount);
  });

  it('listLocations returns locations', async () => {
    const mockLocations = [{ ID: 1, Name: 'Location' }];
    setupMockFetch(mockLocations);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listLocations();

    expect(result).toEqual(mockLocations);
  });

  it('listFunctionalRoles returns roles', async () => {
    const mockRoles = [{ ID: 1, Name: 'Role' }];
    setupMockFetch(mockRoles);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listFunctionalRoles();

    expect(result).toEqual(mockRoles);
  });

  it('listCustomAttributes returns attributes', async () => {
    const mockAttributes = [{ ID: 1, Name: 'Attribute' }];
    setupMockFetch(mockAttributes);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listCustomAttributes(9, 42);

    expect(result).toEqual(mockAttributes);
  });

  it('listTicketTypes returns types', async () => {
    const mockTypes = [{ ID: 1, Name: 'Incident' }];
    setupMockFetch(mockTypes);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTicketTypes(42);

    expect(result).toEqual(mockTypes);
  });

  it('listTicketPriorities returns priorities', async () => {
    const mockPriorities = [{ ID: 1, Name: 'Low' }];
    setupMockFetch(mockPriorities);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTicketPriorities(42);

    expect(result).toEqual(mockPriorities);
  });

  it('listTicketUrgencies returns urgencies', async () => {
    const mockUrgencies = [{ ID: 1, Name: 'Low' }];
    setupMockFetch(mockUrgencies);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTicketUrgencies(42);

    expect(result).toEqual(mockUrgencies);
  });

  it('listTicketImpacts returns impacts', async () => {
    const mockImpacts = [{ ID: 1, Name: 'Low' }];
    setupMockFetch(mockImpacts);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTicketImpacts(42);

    expect(result).toEqual(mockImpacts);
  });

  it('listTicketSources returns sources', async () => {
    const mockSources = [{ ID: 1, Name: 'Email' }];
    setupMockFetch(mockSources);
    vi.spyOn(coreService, 'extractAuthToken').mockReturnValue('token');

    const client = new TeamDynamixClient(baseConfig);
    const result = await client.listTicketSources(42);

    expect(result).toEqual(mockSources);
  });
});
