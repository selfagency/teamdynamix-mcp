import { createMcpSdkClient } from '../../client/sdk-client.factory.js';
import { getTeamDynamixConfig } from '../../config.js';
import type { TeamDynamixConfig } from '../../types.js';

/**
 * SDK-backed TeamDynamix client.
 */
export class UnifiedTeamDynamixClient {
  private sdkPromise: Promise<Awaited<ReturnType<typeof createMcpSdkClient>>> | null = null;

  constructor(private readonly config: TeamDynamixConfig) {}

  private sdk() {
    if (!this.sdkPromise) {
      this.sdkPromise = createMcpSdkClient(this.config);
    }
    return this.sdkPromise;
  }

  //
  // Discovery
  //
  getCurrentUser(): Promise<unknown> {
    return this.sdk().then(s => s.discovery.authGetuser());
  }
  listApplications(): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.discovery.applications()) as Promise<readonly unknown[]>;
  }

  //
  // Tickets
  //
  getTicket(appId: number, ticketId: number): Promise<unknown> {
    return this.sdk().then(s => s.tickets.appIdTicketsId({ params: { path: { appId, id: ticketId } } }));
  }
  searchTickets(appId: number, _body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.tickets.appIdTicketsFeed({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listTicketTypes(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.tickets.appIdTicketsTypes({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listTicketPriorities(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.tickets.appIdTicketsPriorities({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listTicketUrgencies(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.tickets.appIdTicketsUrgencies({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listTicketImpacts(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.tickets.appIdTicketsImpacts({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listTicketSources(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.tickets.appIdTicketsSources({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  getTicketFeed(appId: number, ticketId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.tickets.appIdTicketsIdFeed({ params: { path: { appId, id: ticketId } } })) as Promise<
      readonly unknown[]
    >;
  }

  //
  // Ticket Relationships
  //
  getTicketTasks(appId: number, ticketId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsTicketIdTasks({ params: { path: { appId, ticketId } } }),
    ) as Promise<readonly unknown[]>;
  }
  createTicketTask(appId: number, ticketId: number, body: Record<string, unknown>): Promise<unknown> {
    return this.sdk().then(s => s.ticketRelationships.createTicketTask({ appId, ticketId, body }));
  }
  listTicketAssets(appId: number, ticketId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsIdAssets({ params: { path: { appId, id: ticketId } } }),
    ) as Promise<readonly unknown[]>;
  }
  addTicketAsset(appId: number, ticketId: number, assetId: number): Promise<unknown> {
    return this.sdk().then(s => s.ticketRelationships.addTicketAsset({ appId, ticketId, assetId }));
  }
  removeTicketAsset(appId: number, ticketId: number, assetId: number): Promise<void> {
    return this.sdk().then(s => {
      s.ticketRelationships.removeTicketAsset({ appId, ticketId, assetId, confirm: true });
    }) as Promise<void>;
  }
  getTicketContacts(appId: number, ticketId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsIdContacts({ params: { path: { appId, id: ticketId } } }),
    ) as Promise<readonly unknown[]>;
  }
  addTicketContact(appId: number, ticketId: number, contactUid: string): Promise<unknown> {
    return this.sdk().then(s => s.ticketRelationships.addTicketContact({ appId, ticketId, contactUid }));
  }
  removeTicketContact(appId: number, ticketId: number, contactUid: string): Promise<void> {
    return this.sdk().then(s => {
      s.ticketRelationships.removeTicketContact({ appId, ticketId, contactUid, confirm: true });
    }) as Promise<void>;
  }

  //
  // People
  //
  getUser(uid: string): Promise<unknown> {
    return this.sdk().then(s => s.people.peopleUid({ params: { path: { uid } } }));
  }
  searchUsers(body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.people.peopleLookup({ body: { SearchText: String(body['SearchText'] ?? '') } }),
    ) as Promise<readonly unknown[]>;
  }
  getGroup(groupId: number): Promise<unknown> {
    return this.sdk().then(s => s.people.groupsId({ params: { path: { id: groupId } } }));
  }
  searchGroups(_body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.people.searchGroups({ body: {} })) as Promise<readonly unknown[]>;
  }
  getGroupMembers(groupId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.people.groupsIdMembers({ params: { path: { id: groupId } } })) as Promise<
      readonly unknown[]
    >;
  }

  //
  // Knowledge Base
  //
  getKbArticle(appId: number, articleId: number): Promise<unknown> {
    return this.sdk().then(s => s.knowledgeBase.appIdKnowledgebaseId({ params: { path: { appId, id: articleId } } }));
  }
  searchKbArticles(appId: number, _body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.knowledgeBase.appIdKnowledgebaseCategories({ params: { path: { appId } } }),
    ) as Promise<readonly unknown[]>;
  }
  listKbCategories(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.knowledgeBase.appIdKnowledgebaseCategories({ params: { path: { appId } } }),
    ) as Promise<readonly unknown[]>;
  }

  //
  // Assets
  //
  getAsset(appId: number, assetId: number): Promise<unknown> {
    return this.sdk().then(s => s.assets.appIdAssetsId({ params: { path: { appId, id: assetId } } }));
  }
  searchAssets(appId: number, _body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.assets.appIdAssetsFeed({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listAssetStatuses(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.assets.appIdAssetsStatuses({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listProductModels(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.assets.appIdAssetsModels({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listVendors(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.cmdb.appIdAssetsVendors({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  //
  // CMDB
  //
  getConfigurationItem(appId: number, ciId: number): Promise<unknown> {
    return this.sdk().then(s => s.cmdb.appIdCmdbId({ params: { path: { appId, id: ciId } } }));
  }
  searchConfigurationItems(appId: number, _body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.cmdb.appIdCmdbSearches({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listCiTypes(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.cmdb.appIdCmdbTypes({ params: { path: { appId } } })) as Promise<readonly unknown[]>;
  }
  listCiRelationshipTypes(): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.cmdb.appIdCmdbRelationshiptypes()) as Promise<readonly unknown[]>;
  }

  //
  // Services
  //
  listServiceCatalog(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.services.appIdServices({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  getService(appId: number, serviceId: number): Promise<unknown> {
    return this.sdk().then(s => s.services.appIdServicesId({ params: { path: { appId, id: serviceId } } }));
  }
  searchServices(appId: number, _body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.services.appIdServicesCategories({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }
  listServiceCategories(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.services.appIdServicesCategories({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  //
  // Projects
  //
  getProject(projectId: number): Promise<unknown> {
    return this.sdk().then(s => s.projects.projectsId({ params: { path: { id: projectId } } }));
  }
  searchProjects(_body: Record<string, unknown>): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.projects.projectsFeed()) as Promise<readonly unknown[]>;
  }
  listProjectTypes(): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.projects.projectsTypes()) as Promise<readonly unknown[]>;
  }
  getProjectPlans(projectId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.projects.projectsProjectIDPlansPlanID({ params: { path: { id: projectId } } }),
    ) as Promise<readonly unknown[]>;
  }
  getProjectIssues(projectId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.projects.projectsProjectIdIssuesCategories({ params: { path: { id: projectId } } }),
    ) as Promise<readonly unknown[]>;
  }
  getProjectRisks(projectId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s =>
      s.projects.projectsProjectIdRisksCategories({ params: { path: { id: projectId } } }),
    ) as Promise<readonly unknown[]>;
  }

  //
  // Time
  //
  listTimeTypes(): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.time.timeTypes()) as Promise<readonly unknown[]>;
  }
  getMyTimeEntries(_startDate: string, _endDate: string): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.time.timeId({ params: { path: { id: 0 } } })) as Promise<readonly unknown[]>;
  }

  //
  // Reference Data
  //
  listAccounts(_appId?: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.referenceData.accounts()) as Promise<readonly unknown[]>;
  }
  getAccount(accountId: number): Promise<unknown> {
    return this.sdk().then(s => s.referenceData.accountsId({ params: { path: { id: accountId } } }));
  }
  listLocations(): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.referenceData.locations()) as Promise<readonly unknown[]>;
  }
  listFunctionalRoles(): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.referenceData.securityrolesPermissions()) as Promise<readonly unknown[]>;
  }
  listCustomAttributes(_componentId: number, _appId?: number, _associatedTypeId?: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.referenceData.attributesCustom()) as Promise<readonly unknown[]>;
  }
  listTicketStatuses(appId: number): Promise<readonly unknown[]> {
    return this.sdk().then(s => s.referenceData.appIdTicketsStatuses({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  //
  // Mutations
  //
  createTicket(
    appId: number,
    body: Record<string, unknown>,
    _notifyRequestor?: boolean,
    _notifyResponsible?: boolean,
  ): Promise<unknown> {
    return this.sdk().then(s => s.tickets.createTicket({ appId, body }));
  }
  updateTicket(
    appId: number,
    ticketId: number,
    body: Record<string, unknown>,
    _notifyRequestor?: boolean,
    _notifyResponsible?: boolean,
    _comments?: string,
    _isPrivate?: boolean,
  ): Promise<unknown> {
    return this.sdk().then(s => s.tickets.updateTicket({ appId, ticketId, body }));
  }
  addTicketComment(
    appId: number,
    ticketId: number,
    body: string,
    _isPrivate?: boolean,
    _notifyRequestor?: boolean,
    _notifyResponsible?: boolean,
  ): Promise<unknown> {
    return this.sdk().then(s => s.tickets.addTicketComment({ appId, ticketId, body: { Body: body } }));
  }
  createKbArticle(appId: number, body: Record<string, unknown>): Promise<unknown> {
    return this.sdk().then(s => s.knowledgeBase.createArticle({ appId, body }));
  }
  updateKbArticle(appId: number, articleId: number, body: Record<string, unknown>): Promise<unknown> {
    return this.sdk().then(s => s.knowledgeBase.updateArticle({ appId, articleId, body }));
  }
  createProjectIssue(_projectId: number, body: Record<string, unknown>): Promise<unknown> {
    return this.sdk().then(s => s.projects.createIssue({ body }));
  }
  createProjectRisk(_projectId: number, body: Record<string, unknown>): Promise<unknown> {
    return this.sdk().then(s => s.projects.createRisk({ body }));
  }
}

/** Creates a configured SDK-backed TeamDynamix client. */
export function createConfiguredTeamDynamixClient(): UnifiedTeamDynamixClient {
  return new UnifiedTeamDynamixClient(getTeamDynamixConfig());
}

export function assertWriteToolsEnabled(config: TeamDynamixConfig): void {
  if (!config.enableWriteTools) {
    throw new Error('Write tools are disabled. Set TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true in your environment.');
  }
}
