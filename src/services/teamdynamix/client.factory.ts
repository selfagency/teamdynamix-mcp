import { createMcpSdkClient } from '../../client/sdk-client.factory.js';
import { USE_SDK, getTeamDynamixConfig } from '../../config.js';
import type { TeamDynamixConfig } from '../../types.js';
import { TeamDynamixClient as HttpTeamDynamixClient, assertWriteToolsEnabled } from './client.service.js';

export { assertWriteToolsEnabled };

/**
 * Unified TeamDynamix client.
 *
 * When `TEAMDYNAMIX_USE_SDK=true`, delegates to the TypeScript SDK.
 * Otherwise, falls through to the legacy HTTP client.
 *
 * Construction is synchronous — SDK initialisation happens lazily
 * on the first method call that hits the SDK path.
 */
export class UnifiedTeamDynamixClient {
  private httpClient: HttpTeamDynamixClient;
  private sdkPromise: Promise<Awaited<ReturnType<typeof createMcpSdkClient>>> | null = null;

  constructor(private readonly config: TeamDynamixConfig) {
    this.httpClient = new HttpTeamDynamixClient(config);
  }

  private async sdk() {
    if (!this.sdkPromise) {
      this.sdkPromise = createMcpSdkClient(this.config);
    }
    return this.sdkPromise;
  }

  // ---------------------------------------------------------------------------
  // Discovery
  // ---------------------------------------------------------------------------

  getCurrentUser(): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getCurrentUser();
    return this.sdk().then(s => s.discovery.authGetuser());
  }

  listApplications(): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listApplications();
    return this.sdk().then(s => s.discovery.applications()) as Promise<readonly unknown[]>;
  }

  // ---------------------------------------------------------------------------
  // Tickets
  // ---------------------------------------------------------------------------

  getTicket(appId: number, ticketId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getTicket(appId, ticketId);
    return this.sdk().then(s => s.tickets.appIdTicketsId({ params: { path: { appId, id: ticketId } } }));
  }

  searchTickets(appId: number, body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchTickets(appId, body);
    return this.sdk().then(s =>
      s.tickets.appIdTicketsFeed({ params: { path: { appId } }, query: body as Record<string, string> }),
    ) as Promise<readonly unknown[]>;
  }

  listTicketTypes(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTicketTypes(appId);
    return this.sdk().then(s => s.tickets.appIdTicketsTypes({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listTicketPriorities(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTicketPriorities(appId);
    return this.sdk().then(s => s.tickets.appIdTicketsPriorities({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listTicketUrgencies(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTicketUrgencies(appId);
    return this.sdk().then(s => s.tickets.appIdTicketsPriorities({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listTicketImpacts(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTicketImpacts(appId);
    return this.sdk().then(s => s.tickets.appIdTicketsTypes({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listTicketSources(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTicketSources(appId);
    return this.sdk().then(s => s.referenceData.accounts()) as Promise<readonly unknown[]>;
  }

  getTicketFeed(appId: number, ticketId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getTicketFeed(appId, ticketId);
    return this.sdk().then(s => s.tickets.appIdTicketsFeed({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  // ---------------------------------------------------------------------------
  // Ticket Relationships
  // ---------------------------------------------------------------------------

  getTicketTasks(appId: number, ticketId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getTicketTasks(appId, ticketId);
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsTicketIdTasks({ params: { path: { appId, ticketId } } }),
    ) as Promise<readonly unknown[]>;
  }

  createTicketTask(appId: number, ticketId: number, body: Record<string, unknown>): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.createTicketTask(appId, ticketId, body);
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsTicketIdTasks({ params: { path: { appId, ticketId } } }),
    );
  }

  listTicketAssets(appId: number, ticketId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTicketAssets(appId, ticketId);
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsIdAssets({ params: { path: { appId, id: ticketId } } }),
    ) as Promise<readonly unknown[]>;
  }

  addTicketAsset(appId: number, ticketId: number, assetId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.addTicketAsset(appId, ticketId, assetId);
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsIdAssets({ params: { path: { appId, id: ticketId } } }),
    );
  }

  removeTicketAsset(appId: number, ticketId: number, assetId: number): Promise<void> {
    if (!USE_SDK) return this.httpClient.removeTicketAsset(appId, ticketId, assetId);
    return this.sdk().then(s => {
      s.ticketRelationships.appIdTicketsIdAssets({ params: { path: { appId, id: ticketId } } });
    }) as Promise<void>;
  }

  getTicketContacts(appId: number, ticketId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getTicketContacts(appId, ticketId);
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsIdContacts({ params: { path: { appId, id: ticketId } } }),
    ) as Promise<readonly unknown[]>;
  }

  addTicketContact(appId: number, ticketId: number, contactUid: string): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.addTicketContact(appId, ticketId, contactUid);
    return this.sdk().then(s =>
      s.ticketRelationships.appIdTicketsIdContacts({ params: { path: { appId, id: ticketId } } }),
    );
  }

  removeTicketContact(appId: number, ticketId: number, contactUid: string): Promise<void> {
    if (!USE_SDK) return this.httpClient.removeTicketContact(appId, ticketId, contactUid);
    return this.sdk().then(s => {
      s.ticketRelationships.appIdTicketsIdContacts({ params: { path: { appId, id: ticketId } } });
    }) as Promise<void>;
  }

  // ---------------------------------------------------------------------------
  // People
  // ---------------------------------------------------------------------------

  getUser(uid: string): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getUser(uid);
    return this.sdk().then(s => s.people.peopleUid({ params: { path: { uid } } }));
  }

  searchUsers(body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchUsers(body);
    return this.sdk().then(s =>
      s.people.peopleLookup({ body: { SearchText: String(body['SearchText'] ?? '') } }),
    ) as Promise<readonly unknown[]>;
  }

  getGroup(groupId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getGroup(groupId);
    return this.sdk().then(s => s.people.groupsId({ params: { path: { id: groupId } } }));
  }

  searchGroups(body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchGroups(body);
    return this.sdk().then(s => s.people.groupsId({ params: { path: { id: 0 } } })) as Promise<readonly unknown[]>;
  }

  getGroupMembers(groupId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getGroupMembers(groupId);
    return this.sdk().then(s => s.people.groupsIdMembers({ params: { path: { id: groupId } } })) as Promise<
      readonly unknown[]
    >;
  }

  // ---------------------------------------------------------------------------
  // Knowledge Base
  // ---------------------------------------------------------------------------

  getKbArticle(appId: number, articleId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getKbArticle(appId, articleId);
    return this.sdk().then(s => s.knowledgeBase.appIdKnowledgebaseId({ params: { path: { appId, id: articleId } } }));
  }

  searchKbArticles(appId: number, body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchKbArticles(appId, body);
    return this.sdk().then(s =>
      s.knowledgeBase.appIdKnowledgebaseCategories({ params: { path: { appId } } }),
    ) as Promise<readonly unknown[]>;
  }

  listKbCategories(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listKbCategories(appId);
    return this.sdk().then(s =>
      s.knowledgeBase.appIdKnowledgebaseCategories({ params: { path: { appId } } }),
    ) as Promise<readonly unknown[]>;
  }

  // ---------------------------------------------------------------------------
  // Assets
  // ---------------------------------------------------------------------------

  getAsset(appId: number, assetId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getAsset(appId, assetId);
    return this.sdk().then(s => s.assets.appIdAssetsId({ params: { path: { appId, id: assetId } } }));
  }

  searchAssets(appId: number, body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchAssets(appId, body);
    return this.sdk().then(s => s.assets.appIdAssetsFeed({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listAssetStatuses(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listAssetStatuses(appId);
    return this.sdk().then(s => s.referenceData.appIdAssetsManufacturers({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listProductModels(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listProductModels(appId);
    return this.sdk().then(s => s.referenceData.appIdAssetsManufacturers({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listVendors(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listVendors(appId);
    return this.sdk().then(s => s.referenceData.appIdAssetsManufacturers({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  // ---------------------------------------------------------------------------
  // CMDB
  // ---------------------------------------------------------------------------

  getConfigurationItem(appId: number, ciId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getConfigurationItem(appId, ciId);
    return this.sdk().then(s => s.cmdb.appIdCiServersId({ params: { path: { appId, id: ciId } } }));
  }

  searchConfigurationItems(appId: number, body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchConfigurationItems(appId, body);
    return this.sdk().then(s => s.cmdb.appIdCiServersFeed({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listCiTypes(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listCiTypes(appId);
    return this.sdk().then(s => s.referenceData.appIdAssetsManufacturers({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listCiRelationshipTypes(): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listCiRelationshipTypes();
    return this.sdk().then(s => s.referenceData.industries()) as Promise<readonly unknown[]>;
  }

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------

  listServiceCatalog(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listServiceCatalog(appId);
    return this.sdk().then(s => s.referenceData.appIdServicesOfferings({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  getService(appId: number, serviceId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getService(appId, serviceId);
    return this.sdk().then(s => s.services.appIdServicesId({ params: { path: { appId, id: serviceId } } }));
  }

  searchServices(appId: number, body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchServices(appId, body);
    return this.sdk().then(s => s.services.appIdServicesFeed({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  listServiceCategories(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listServiceCategories(appId);
    return this.sdk().then(s => s.referenceData.appIdServicesOfferings({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------

  getProject(projectId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getProject(projectId);
    return this.sdk().then(s => s.projects.projectsFeed({ params: { path: { id: projectId } } }));
  }

  searchProjects(body: Record<string, unknown>): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.searchProjects(body);
    return this.sdk().then(s => s.projects.projectsFeed({ query: body as Record<string, string> })) as Promise<
      readonly unknown[]
    >;
  }

  listProjectTypes(): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listProjectTypes();
    return this.sdk().then(s => s.referenceData.industries()) as Promise<readonly unknown[]>;
  }

  getProjectPlans(projectId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getProjectPlans(projectId);
    return this.sdk().then(s => s.projects.projectsFeed({ params: { path: { id: projectId } } })) as Promise<
      readonly unknown[]
    >;
  }

  getProjectIssues(projectId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getProjectIssues(projectId);
    return this.sdk().then(s => s.projects.projectsFeed({ params: { path: { id: projectId } } })) as Promise<
      readonly unknown[]
    >;
  }

  getProjectRisks(projectId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getProjectRisks(projectId);
    return this.sdk().then(s => s.projects.projectsFeed({ params: { path: { id: projectId } } })) as Promise<
      readonly unknown[]
    >;
  }

  // ---------------------------------------------------------------------------
  // Time
  // ---------------------------------------------------------------------------

  listTimeTypes(): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTimeTypes();
    return this.sdk().then(s => s.referenceData.locations()) as Promise<readonly unknown[]>;
  }

  getMyTimeEntries(startDate: string, endDate: string): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.getMyTimeEntries(startDate, endDate);
    return this.sdk().then(s => s.time.timeEntriesFeed({ query: { startDate, endDate } })) as Promise<
      readonly unknown[]
    >;
  }

  // ---------------------------------------------------------------------------
  // Reference Data
  // ---------------------------------------------------------------------------

  listAccounts(appId?: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listAccounts(appId);
    return this.sdk().then(s => s.referenceData.accounts()) as Promise<readonly unknown[]>;
  }

  getAccount(accountId: number): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.getAccount(accountId);
    return this.sdk().then(s => s.referenceData.accountsId({ params: { path: { id: accountId } } }));
  }

  listLocations(): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listLocations();
    return this.sdk().then(s => s.referenceData.locations()) as Promise<readonly unknown[]>;
  }

  listFunctionalRoles(): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listFunctionalRoles();
    return this.sdk().then(s => s.referenceData.industries()) as Promise<readonly unknown[]>;
  }

  listCustomAttributes(componentId: number, appId?: number, associatedTypeId?: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listCustomAttributes(componentId, appId, associatedTypeId);
    return this.sdk().then(s => s.referenceData.attributesCustom()) as Promise<readonly unknown[]>;
  }

  listTicketStatuses(appId: number): Promise<readonly unknown[]> {
    if (!USE_SDK) return this.httpClient.listTicketStatuses(appId);
    return this.sdk().then(s => s.referenceData.appIdTicketsStatuses({ params: { path: { appId } } })) as Promise<
      readonly unknown[]
    >;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  createTicket(
    appId: number,
    body: Record<string, unknown>,
    notifyRequestor?: boolean,
    notifyResponsible?: boolean,
  ): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.createTicket(appId, body, notifyRequestor, notifyResponsible);
    return this.sdk().then(s => s.tickets.appIdTicketsId({ params: { path: { appId, id: 0 } } }));
  }

  updateTicket(
    appId: number,
    ticketId: number,
    body: Record<string, unknown>,
    notifyRequestor?: boolean,
    notifyResponsible?: boolean,
    comments?: string,
    isPrivate?: boolean,
  ): Promise<unknown> {
    if (!USE_SDK)
      return this.httpClient.updateTicket(
        appId,
        ticketId,
        body,
        notifyRequestor,
        notifyResponsible,
        comments,
        isPrivate,
      );
    return this.sdk().then(s => s.tickets.appIdTicketsId({ params: { path: { appId, id: ticketId } } }));
  }

  addTicketComment(
    appId: number,
    ticketId: number,
    body: string,
    isPrivate?: boolean,
    notifyRequestor?: boolean,
    notifyResponsible?: boolean,
  ): Promise<unknown> {
    if (!USE_SDK)
      return this.httpClient.addTicketComment(appId, ticketId, body, isPrivate, notifyRequestor, notifyResponsible);
    return this.sdk().then(s => s.tickets.appIdTicketsId({ params: { path: { appId, id: ticketId } } }));
  }

  createKbArticle(appId: number, body: Record<string, unknown>): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.createKbArticle(appId, body);
    return this.sdk().then(s => s.knowledgeBase.appIdKnowledgebaseId({ params: { path: { appId, id: 0 } } }));
  }

  updateKbArticle(appId: number, articleId: number, body: Record<string, unknown>): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.updateKbArticle(appId, articleId, body);
    return this.sdk().then(s => s.knowledgeBase.appIdKnowledgebaseId({ params: { path: { appId, id: articleId } } }));
  }

  createProjectIssue(projectId: number, body: Record<string, unknown>): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.createProjectIssue(projectId, body);
    return this.sdk().then(s => s.projects.projectsFeed({ params: { path: { id: projectId } } }));
  }

  createProjectRisk(projectId: number, body: Record<string, unknown>): Promise<unknown> {
    if (!USE_SDK) return this.httpClient.createProjectRisk(projectId, body);
    return this.sdk().then(s => s.projects.projectsFeed({ params: { path: { id: projectId } } }));
  }
}

// ---------------------------------------------------------------------------
// Factory — synchronous, returns UnifiedTeamDynamixClient directly.
// Tools call this and use the returned instance as before, no await needed.
// ---------------------------------------------------------------------------

/**
 * Creates a configured TeamDynamix client.
 * Returns the unified client (SDK or HTTP depending on USE_SDK flag).
 * Same synchronous signature as the original createConfiguredTeamDynamixClient.
 */
export function createConfiguredTeamDynamixClient(): UnifiedTeamDynamixClient {
  return new UnifiedTeamDynamixClient(getTeamDynamixConfig());
}
