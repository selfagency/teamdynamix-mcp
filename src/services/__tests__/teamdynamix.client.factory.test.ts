import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  UnifiedTeamDynamixClient,
  assertWriteToolsEnabled,
  assertDeleteToolsEnabled,
} from '../teamdynamix/client.factory.js';
import type { TeamDynamixConfig } from '../../types.js';

// Mock the SDK client factory
vi.mock('../../client/sdk-client.factory.js', () => ({
  createMcpSdkClient: vi.fn().mockResolvedValue({
    discovery: {
      authGetuser: vi.fn().mockResolvedValue({ FullName: 'Demo User' }),
      applications: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Test App' }]),
      authLoginsso: vi.fn().mockResolvedValue({}),
    },
    tickets: {
      appIdTicketsId: vi.fn().mockResolvedValue({ ID: 9001, Title: 'Test Ticket' }),
      appIdTicketsTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Incident' }]),
      appIdTicketsPriorities: vi.fn().mockResolvedValue([{ ID: 1, Name: 'High' }]),
      appIdTicketsUrgencies: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Urgent' }]),
      appIdTicketsImpacts: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Major' }]),
      appIdTicketsSources: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Phone' }]),
      appIdTicketsFeed: vi.fn().mockResolvedValue([{ ID: 1, Body: 'Comment' }]),
      appIdTicketsIdFeed: vi.fn().mockResolvedValue([{ ID: 1, Body: 'Feed Entry' }]),
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
      searchGroups: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Group' }]),
    },
    ticketRelationships: {
      appIdTicketsTicketIdTasks: vi.fn().mockResolvedValue([{ ID: 1, Title: 'Task' }]),
      appIdTicketsIdAssets: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Asset' }]),
      appIdTicketsIdContacts: vi.fn().mockResolvedValue([{ UID: 'abc', FullName: 'Contact' }]),
      createTicketTask: vi.fn().mockResolvedValue({ ID: 1, Title: 'New Task' }),
      addTicketAsset: vi.fn().mockResolvedValue({ linked: true }),
      removeTicketAsset: vi.fn().mockResolvedValue({ unlinked: true }),
      addTicketContact: vi.fn().mockResolvedValue({ added: true }),
      removeTicketContact: vi.fn().mockResolvedValue({ removed: true }),
    },
    assets: {
      appIdAssetsId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Asset' }),
      appIdAssetsFeed: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Asset' }]),
      appIdAssetsStatuses: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Active' }]),
      appIdAssetsModels: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Model' }]),
      appIdAssetsVendors: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Vendor' }]),
      deleteAsset: vi.fn().mockResolvedValue({ deleted: true }),
    },
    cmdb: {
      appIdCmdbId: vi.fn().mockResolvedValue({ ID: 1, Name: 'CI' }),
      appIdCmdbSearches: vi.fn().mockResolvedValue([{ ID: 1 }]),
      appIdCmdbTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Type' }]),
      appIdCmdbRelationshiptypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Depends On' }]),
      appIdAssetsVendors: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Vendor' }]),
      deleteConfigurationItem: vi.fn().mockResolvedValue({ deleted: true }),
    },
    services: {
      appIdServices: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Service' }]),
      appIdServicesId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Service' }),
      appIdServicesCategories: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Category' }]),
      deleteService: vi.fn().mockResolvedValue({ deleted: true }),
      deleteServiceCategory: vi.fn().mockResolvedValue({ deleted: true }),
    },
    projects: {
      projectsFeed: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Project' }]),
      projectsId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Project' }),
      projectsTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Project Type' }]),
      projectsProjectIDPlansPlanID: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Plan' }]),
      projectsProjectIdIssuesCategories: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Issue' }]),
      projectsProjectIdRisksCategories: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Risk' }]),
      createIssue: vi.fn().mockResolvedValue({ ID: 1 }),
      createRisk: vi.fn().mockResolvedValue({ ID: 1 }),
    },
    time: {
      timeId: vi.fn().mockResolvedValue({ ID: 1 }),
      timeTypes: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Type' }]),
      timeEntriesFeed: vi.fn().mockResolvedValue([{ ID: 1, Hours: 8 }]),
      deleteTimeEntry: vi.fn().mockResolvedValue({ deleted: true }),
    },
    referenceData: {
      accounts: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Account' }]),
      accountsId: vi.fn().mockResolvedValue({ ID: 1, Name: 'Account' }),
      locations: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Location' }]),
      industries: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Industry' }]),
      securityrolesPermissions: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Role' }]),
      attributesCustom: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Attribute' }]),
      appIdTicketsStatuses: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Open' }]),
      appIdAssetsManufacturers: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Vendor' }]),
      appIdServicesOfferings: vi.fn().mockResolvedValue([{ ID: 1, Name: 'Offering' }]),
    },
    helpers: {
      findAccountByName: vi.fn().mockResolvedValue({ ID: 1, Name: 'Account' }),
      findUserByEmail: vi.fn().mockResolvedValue({ UID: 'abc' }),
      resolveTicketLookupContext: vi.fn().mockResolvedValue({ statuses: [], priorities: [], types: [] }),
    },
  }),
}));

const baseConfig: TeamDynamixConfig = {
  baseUrl: 'https://example.teamdynamix.com/TDWebApi',
  authMode: 'standard',
  username: 'demo@example.com',
  password: 'secret',
  timeoutMs: 30_000,
  maxRetries: 3,
  enableWriteTools: true,
  enableAdminTools: false,
  enableDeleteTools: true,
};

describe('UnifiedTeamDynamixClient', () => {
  let client: UnifiedTeamDynamixClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new UnifiedTeamDynamixClient(baseConfig);
  });

  describe('discovery', () => {
    it('getCurrentUser', async () => {
      const user = await client.getCurrentUser();
      expect(user).toHaveProperty('FullName', 'Demo User');
    });

    it('listApplications', async () => {
      const apps = await client.listApplications();
      expect(apps).toHaveLength(1);
    });
  });

  describe('tickets', () => {
    it('getTicket', async () => {
      const ticket = await client.getTicket(42, 9001);
      expect(ticket).toHaveProperty('Title', 'Test Ticket');
    });

    it('searchTickets', async () => {
      const tickets = await client.searchTickets(42, { Keyword: 'test' });
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('listTicketTypes', async () => {
      const types = await client.listTicketTypes(42);
      expect(types).toHaveLength(1);
    });

    it('listTicketPriorities', async () => {
      const priorities = await client.listTicketPriorities(42);
      expect(priorities).toHaveLength(1);
    });

    it('listTicketUrgencies', async () => {
      const urgencies = await client.listTicketUrgencies(42);
      expect(urgencies).toHaveLength(1);
    });

    it('listTicketImpacts', async () => {
      const impacts = await client.listTicketImpacts(42);
      expect(impacts).toHaveLength(1);
    });

    it('listTicketSources', async () => {
      const sources = await client.listTicketSources(42);
      expect(sources).toHaveLength(1);
    });

    it('getTicketFeed', async () => {
      const feed = await client.getTicketFeed(42, 1);
      expect(Array.isArray(feed)).toBe(true);
    });

    it('createTicket', async () => {
      const ticket = await client.createTicket(42, { Title: 'New' });
      expect(ticket).toHaveProperty('Title', 'Created');
    });

    it('updateTicket', async () => {
      const ticket = await client.updateTicket(42, 1, { Title: 'Updated' });
      expect(ticket).toHaveProperty('Title', 'Updated');
    });

    it('addTicketComment', async () => {
      const entry = await client.addTicketComment(42, 1, 'Fixed.');
      expect(entry).toHaveProperty('Body', 'Fixed.');
    });
  });

  describe('ticket relationships', () => {
    it('getTicketTasks', async () => {
      const tasks = await client.getTicketTasks(42, 1);
      expect(tasks).toHaveLength(1);
    });

    it('createTicketTask', async () => {
      const task = await client.createTicketTask(42, 1, { Title: 'Task' });
      expect(task).toHaveProperty('Title', 'New Task');
    });

    it('listTicketAssets', async () => {
      const assets = await client.listTicketAssets(42, 1);
      expect(assets).toHaveLength(1);
    });

    it('addTicketAsset', async () => {
      const result = await client.addTicketAsset(42, 1, 5);
      expect(result).toHaveProperty('linked', true);
    });

    it('removeTicketAsset', async () => {
      await client.removeTicketAsset(42, 1, 5);
      // Should not throw
    });

    it('getTicketContacts', async () => {
      const contacts = await client.getTicketContacts(42, 1);
      expect(contacts).toHaveLength(1);
    });

    it('addTicketContact', async () => {
      const result = await client.addTicketContact(42, 1, 'uid-abc');
      expect(result).toHaveProperty('added', true);
    });

    it('removeTicketContact', async () => {
      await client.removeTicketContact(42, 1, 'uid-abc');
      // Should not throw
    });
  });

  describe('people', () => {
    it('getUser', async () => {
      const user = await client.getUser('uid-abc');
      expect(user).toHaveProperty('FullName', 'Test User');
    });

    it('searchUsers', async () => {
      const users = await client.searchUsers({ SearchText: 'test' });
      expect(users).toHaveLength(1);
    });

    it('getGroup', async () => {
      const group = await client.getGroup(1);
      expect(group).toHaveProperty('Name', 'Test Group');
    });

    it('searchGroups', async () => {
      const groups = await client.searchGroups({ Name: 'test' });
      expect(Array.isArray(groups)).toBe(true);
    });

    it('getGroupMembers', async () => {
      const members = await client.getGroupMembers(1);
      expect(members).toHaveLength(1);
    });
  });

  describe('knowledge base', () => {
    it('getKbArticle', async () => {
      const article = await client.getKbArticle(42, 100);
      expect(article).toHaveProperty('Subject', 'KB Article');
    });

    it('searchKbArticles', async () => {
      const articles = await client.searchKbArticles(42, { SearchText: 'test' });
      expect(Array.isArray(articles)).toBe(true);
    });

    it('listKbCategories', async () => {
      const categories = await client.listKbCategories(42);
      expect(categories).toHaveLength(1);
    });

    it('createKbArticle', async () => {
      const article = await client.createKbArticle(42, { Subject: 'New Article' });
      expect(article).toHaveProperty('ID', 3001);
    });

    it('updateKbArticle', async () => {
      const article = await client.updateKbArticle(42, 1, { Subject: 'Updated' });
      expect(article).toHaveProperty('Subject', 'Updated Article');
    });
  });

  describe('assets', () => {
    it('getAsset', async () => {
      const asset = await client.getAsset(42, 1);
      expect(asset).toHaveProperty('Name', 'Asset');
    });

    it('searchAssets', async () => {
      const assets = await client.searchAssets(42, { Keyword: 'test' });
      expect(assets).toHaveLength(1);
    });

    it('listAssetStatuses', async () => {
      const statuses = await client.listAssetStatuses(42);
      expect(statuses).toHaveLength(1);
    });

    it('listProductModels', async () => {
      const models = await client.listProductModels(42);
      expect(models).toHaveLength(1);
    });

    it('deleteAsset', async () => {
      const result = await client.deleteAsset(42, 1);
      expect(result).toHaveProperty('deleted', true);
    });
  });

  describe('cmdb', () => {
    it('getConfigurationItem', async () => {
      const ci = await client.getConfigurationItem(42, 1);
      expect(ci).toHaveProperty('Name', 'CI');
    });

    it('searchConfigurationItems', async () => {
      const results = await client.searchConfigurationItems(42, {});
      expect(results).toHaveLength(1);
    });

    it('listCiTypes', async () => {
      const types = await client.listCiTypes(42);
      expect(types).toHaveLength(1);
    });

    it('listCiRelationshipTypes', async () => {
      const types = await client.listCiRelationshipTypes();
      expect(types).toHaveLength(1);
    });

    it('deleteConfigurationItem', async () => {
      const result = await client.deleteConfigurationItem(42, 1);
      expect(result).toHaveProperty('deleted', true);
    });
  });

  describe('services', () => {
    it('listServiceCatalog', async () => {
      const services = await client.listServiceCatalog(42);
      expect(services).toHaveLength(1);
    });

    it('getService', async () => {
      const service = await client.getService(42, 1);
      expect(service).toHaveProperty('Name', 'Service');
    });

    it('searchServices', async () => {
      const services = await client.searchServices(42, {});
      expect(services).toHaveLength(1);
    });

    it('listServiceCategories', async () => {
      const categories = await client.listServiceCategories(42);
      expect(categories).toHaveLength(1);
    });

    it('deleteService', async () => {
      const result = await client.deleteService(42, 1);
      expect(result).toHaveProperty('deleted', true);
    });

    it('deleteServiceCategory', async () => {
      const result = await client.deleteServiceCategory(42, 1);
      expect(result).toHaveProperty('deleted', true);
    });
  });

  describe('projects', () => {
    it('getProject', async () => {
      const project = await client.getProject(1);
      expect(project).toHaveProperty('Name', 'Project');
    });

    it('searchProjects', async () => {
      const projects = await client.searchProjects({});
      expect(projects).toHaveLength(1);
    });

    it('listProjectTypes', async () => {
      const types = await client.listProjectTypes();
      expect(types).toHaveLength(1);
    });

    it('getProjectPlans', async () => {
      const plans = await client.getProjectPlans(1);
      expect(plans).toHaveLength(1);
    });

    it('getProjectIssues', async () => {
      const issues = await client.getProjectIssues(1);
      expect(issues).toHaveLength(1);
    });

    it('getProjectRisks', async () => {
      const risks = await client.getProjectRisks(1);
      expect(risks).toHaveLength(1);
    });

    it('createProjectIssue', async () => {
      const issue = await client.createProjectIssue(1, { Title: 'Issue' });
      expect(issue).toHaveProperty('ID', 1);
    });

    it('createProjectRisk', async () => {
      const risk = await client.createProjectRisk(1, { Title: 'Risk' });
      expect(risk).toHaveProperty('ID', 1);
    });
  });

  describe('time', () => {
    it('listTimeTypes', async () => {
      const types = await client.listTimeTypes();
      expect(types).toHaveLength(1);
    });

    it('getMyTimeEntries', async () => {
      const entries = await client.getMyTimeEntries('2024-01-01', '2024-01-31');
      expect(entries).toHaveProperty('ID', 1);
    });

    it('deleteTimeEntry', async () => {
      const result = await client.deleteTimeEntry(1);
      expect(result).toHaveProperty('deleted', true);
    });
  });

  describe('reference data', () => {
    it('listAccounts', async () => {
      const accounts = await client.listAccounts();
      expect(accounts).toHaveLength(1);
    });

    it('getAccount', async () => {
      const account = await client.getAccount(1);
      expect(account).toHaveProperty('Name', 'Account');
    });

    it('listLocations', async () => {
      const locations = await client.listLocations();
      expect(locations).toHaveLength(1);
    });

    it('listFunctionalRoles', async () => {
      const roles = await client.listFunctionalRoles();
      expect(roles).toHaveLength(1);
    });

    it('listCustomAttributes', async () => {
      const attrs = await client.listCustomAttributes(1);
      expect(attrs).toHaveLength(1);
    });

    it('listTicketStatuses', async () => {
      const statuses = await client.listTicketStatuses(42);
      expect(statuses).toHaveLength(1);
    });

    it('listVendors', async () => {
      const vendors = await client.listVendors(42);
      expect(vendors).toHaveLength(1);
    });
  });

  describe('safety assertions', () => {
    it('assertWriteToolsEnabled throws when write tools disabled', () => {
      expect(() => assertWriteToolsEnabled({ ...baseConfig, enableWriteTools: false })).toThrow(
        'TEAMDYNAMIX_ENABLE_WRITE_TOOLS',
      );
    });

    it('assertWriteToolsEnabled passes when write tools enabled', () => {
      expect(() => assertWriteToolsEnabled(baseConfig)).not.toThrow();
    });

    it('assertDeleteToolsEnabled throws when delete tools disabled', () => {
      expect(() => assertDeleteToolsEnabled({ ...baseConfig, enableDeleteTools: false })).toThrow(
        'TEAMDYNAMIX_ENABLE_DELETE_TOOLS',
      );
    });

    it('assertDeleteToolsEnabled passes when delete tools enabled', () => {
      expect(() => assertDeleteToolsEnabled(baseConfig)).not.toThrow();
    });
  });
});
