import { LOG_LEVEL, getTeamDynamixConfig, getTeamDynamixConfigStatus } from '../../config.js';
import { TEAMDYNAMIX_MAX_RETRY_ATTEMPTS } from '../../constants.js';
import { TeamDynamixListResponseSchema, TeamDynamixSingleResponseSchema } from '../../schemas/index.js';
import type {
  TeamDynamixApplication,
  TeamDynamixAsset,
  TeamDynamixConfig,
  TeamDynamixEntity,
  TeamDynamixGroup,
  TeamDynamixKbArticle,
  TeamDynamixNamedEntity,
  TeamDynamixProject,
  TeamDynamixRequestOptions,
  TeamDynamixTicket,
  TeamDynamixUser,
} from '../../types.js';
import { decodeJwtExpiryEpochSeconds, extractAuthToken, parseRateLimit } from './core.service.js';

/**
 * Asserts that write tools are enabled in the configuration.
 * Throws a clear error if TEAMDYNAMIX_ENABLE_WRITE_TOOLS is not set to true.
 */
export function assertWriteToolsEnabled(config: TeamDynamixConfig): void {
  if (!config.enableWriteTools) {
    throw new Error(
      'Write tools are disabled. Set TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true in your environment to enable ticket creation, updates, comments, and other write operations.',
    );
  }
}

/**
 * Asserts that admin tools are enabled in the configuration.
 * Throws a clear error if TEAMDYNAMIX_ENABLE_ADMIN_TOOLS is not set to true.
 */
export function assertAdminToolsEnabled(config: TeamDynamixConfig): void {
  if (!config.enableAdminTools) {
    throw new Error(
      'Admin tools are disabled. Set TEAMDYNAMIX_ENABLE_ADMIN_TOOLS=true in your environment and configure admin auth (BEID + WebServicesKey) to enable bulk and administrative operations.',
    );
  }
}

interface CachedToken {
  readonly token: string;
  readonly expiresAtMs: number | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export class TeamDynamixClient {
  private cachedToken: CachedToken | null = null;

  public constructor(private readonly config: TeamDynamixConfig) {}

  public async getCurrentUser(): Promise<TeamDynamixUser> {
    return await this.requestJson<TeamDynamixUser>('/api/auth/getuser');
  }

  public async listApplications(): Promise<readonly TeamDynamixApplication[]> {
    return await this.requestJson<readonly TeamDynamixApplication[]>('/api/applications');
  }

  // -------------------------------------------------------------------------
  // Discovery / Enumeration domains
  // -------------------------------------------------------------------------

  public async listAccounts(appId?: number): Promise<readonly TeamDynamixNamedEntity[]> {
    const path = appId ? `/api/${appId}/accounts` : '/api/accounts';
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(path);
  }

  public async getAccount(accountId: number): Promise<TeamDynamixNamedEntity> {
    return await this.requestJson<TeamDynamixNamedEntity>(`/api/accounts/${accountId}`);
  }

  public async listLocations(): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>('/api/locations');
  }

  public async listFunctionalRoles(): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>('/api/functionalroles');
  }

  public async listCustomAttributes(
    componentId: number,
    appId?: number,
    associatedTypeId?: number,
  ): Promise<readonly TeamDynamixEntity[]> {
    const qs = new URLSearchParams({ componentId: String(componentId) });
    if (appId !== undefined) qs.set('appId', String(appId));
    if (associatedTypeId !== undefined) qs.set('associatedTypeId', String(associatedTypeId));
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/attributes/custom?${qs}`);
  }

  public async listTicketStatuses(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/tickets/statuses`);
  }

  public async listTicketTypes(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/tickets/types`);
  }

  public async listTicketPriorities(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/tickets/priorities`);
  }

  public async listTicketUrgencies(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/tickets/urgencies`);
  }

  public async listTicketImpacts(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/tickets/impacts`);
  }

  public async listTicketSources(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/tickets/sources`);
  }

  public async getTicket(appId: number, ticketId: number): Promise<TeamDynamixTicket> {
    return await this.requestJson<TeamDynamixTicket>(`/api/${appId}/tickets/${ticketId}`);
  }

  public async searchTickets(appId: number, body: Record<string, unknown>): Promise<readonly TeamDynamixTicket[]> {
    return await this.requestJson<readonly TeamDynamixTicket[]>(`/api/${appId}/tickets/search`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async createTicket(
    appId: number,
    body: Record<string, unknown>,
    notifyRequestor = false,
    notifyResponsible = false,
  ): Promise<TeamDynamixTicket> {
    return await this.requestJson<TeamDynamixTicket>(
      `/api/${appId}/tickets?NotifyRequestor=${notifyRequestor}&NotifyResponsible=${notifyResponsible}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  }

  public async updateTicket(
    appId: number,
    ticketId: number,
    body: Record<string, unknown>,
    notifyRequestor = false,
    notifyResponsible = false,
    comments = '',
    isPrivate = false,
  ): Promise<TeamDynamixTicket> {
    const qs = new URLSearchParams({
      NotifyRequestor: String(notifyRequestor),
      NotifyResponsible: String(notifyResponsible),
      ...(comments ? { Comments: comments } : {}),
      IsPrivate: String(isPrivate),
    });
    return await this.requestJson<TeamDynamixTicket>(`/api/${appId}/tickets/${ticketId}?${qs}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public async addTicketComment(
    appId: number,
    ticketId: number,
    body: string,
    isPrivate = false,
    notifyRequestor = false,
    notifyResponsible = false,
  ): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/${appId}/tickets/${ticketId}/feed`, {
      method: 'POST',
      body: JSON.stringify({
        Body: body,
        IsPrivate: isPrivate,
        NotifyRequestor: notifyRequestor,
        NotifyResponsible: notifyResponsible,
      }),
    });
  }

  public async getTicketFeed(appId: number, ticketId: number): Promise<readonly TeamDynamixEntity[]> {
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/${appId}/tickets/${ticketId}/feed`);
  }

  public async getTicketTasks(appId: number, ticketId: number): Promise<readonly TeamDynamixEntity[]> {
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/${appId}/tickets/${ticketId}/tasks`);
  }

  public async createTicketTask(
    appId: number,
    ticketId: number,
    body: Record<string, unknown>,
  ): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/${appId}/tickets/${ticketId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async listTicketAssets(appId: number, ticketId: number): Promise<readonly TeamDynamixAsset[]> {
    return await this.requestJson<readonly TeamDynamixAsset[]>(`/api/${appId}/tickets/${ticketId}/assets`);
  }

  public async addTicketAsset(appId: number, ticketId: number, assetId: number): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/${appId}/tickets/${ticketId}/assets/${assetId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  public async removeTicketAsset(appId: number, ticketId: number, assetId: number): Promise<void> {
    await this.requestJson<void>(`/api/${appId}/tickets/${ticketId}/assets/${assetId}`, { method: 'DELETE' });
  }

  // -------------------------------------------------------------------------
  // People & Groups
  // -------------------------------------------------------------------------

  public async getUser(uid: string): Promise<TeamDynamixUser> {
    return await this.requestJson<TeamDynamixUser>(`/api/people/${encodeURIComponent(uid)}`);
  }

  public async searchUsers(body: Record<string, unknown>): Promise<readonly TeamDynamixUser[]> {
    return await this.requestJson<readonly TeamDynamixUser[]>('/api/people/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async getGroup(groupId: number): Promise<TeamDynamixGroup> {
    return await this.requestJson<TeamDynamixGroup>(`/api/groups/${groupId}`);
  }

  public async searchGroups(body: Record<string, unknown>): Promise<readonly TeamDynamixGroup[]> {
    return await this.requestJson<readonly TeamDynamixGroup[]>('/api/groups/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async getGroupMembers(groupId: number): Promise<readonly TeamDynamixUser[]> {
    return await this.requestJson<readonly TeamDynamixUser[]>(`/api/groups/${groupId}/members`);
  }

  // -------------------------------------------------------------------------
  // Knowledge Base
  // -------------------------------------------------------------------------

  public async getKbArticle(appId: number, articleId: number): Promise<TeamDynamixKbArticle> {
    return await this.requestJson<TeamDynamixKbArticle>(`/api/${appId}/knowledgebase/${articleId}`);
  }

  public async searchKbArticles(
    appId: number,
    body: Record<string, unknown>,
  ): Promise<readonly TeamDynamixKbArticle[]> {
    return await this.requestJson<readonly TeamDynamixKbArticle[]>(`/api/${appId}/knowledgebase/search`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async listKbCategories(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/knowledgebase/categories`);
  }

  public async createKbArticle(appId: number, body: Record<string, unknown>): Promise<TeamDynamixKbArticle> {
    return await this.requestJson<TeamDynamixKbArticle>(`/api/${appId}/knowledgebase`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async updateKbArticle(
    appId: number,
    articleId: number,
    body: Record<string, unknown>,
  ): Promise<TeamDynamixKbArticle> {
    return await this.requestJson<TeamDynamixKbArticle>(`/api/${appId}/knowledgebase/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // -------------------------------------------------------------------------
  // Assets / CMDB
  // -------------------------------------------------------------------------

  public async getAsset(appId: number, assetId: number): Promise<TeamDynamixAsset> {
    return await this.requestJson<TeamDynamixAsset>(`/api/${appId}/assets/${assetId}`);
  }

  public async searchAssets(appId: number, body: Record<string, unknown>): Promise<readonly TeamDynamixAsset[]> {
    return await this.requestJson<readonly TeamDynamixAsset[]>(`/api/${appId}/assets/search`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async listAssetStatuses(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/assets/statuses`);
  }

  public async listProductModels(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/assets/models`);
  }

  public async listVendors(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/assets/vendors`);
  }

  public async getConfigurationItem(appId: number, ciId: number): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/${appId}/cmdb/${ciId}`);
  }

  public async searchConfigurationItems(
    appId: number,
    body: Record<string, unknown>,
  ): Promise<readonly TeamDynamixEntity[]> {
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/${appId}/cmdb/search`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async listCiTypes(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/cmdb/types`);
  }

  public async listCiRelationshipTypes(): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>('/api/cmdb/relationshiptypes');
  }

  // -------------------------------------------------------------------------
  // Service Catalog
  // -------------------------------------------------------------------------

  public async listServiceCatalog(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/services`);
  }

  public async getService(appId: number, serviceId: number): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/${appId}/services/${serviceId}`);
  }

  public async searchServices(appId: number, body: Record<string, unknown>): Promise<readonly TeamDynamixEntity[]> {
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/${appId}/services/search`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------

  public async getProject(projectId: number): Promise<TeamDynamixProject> {
    return await this.requestJson<TeamDynamixProject>(`/api/projects/${projectId}`);
  }

  public async searchProjects(body: Record<string, unknown>): Promise<readonly TeamDynamixProject[]> {
    return await this.requestJson<readonly TeamDynamixProject[]>('/api/projects/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async listProjectTypes(): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>('/api/projects/types');
  }

  public async getProjectPlans(projectId: number): Promise<readonly TeamDynamixEntity[]> {
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/projects/${projectId}/plans`);
  }

  public async getProjectIssues(projectId: number): Promise<readonly TeamDynamixEntity[]> {
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/projects/${projectId}/issues`);
  }

  public async getProjectRisks(projectId: number): Promise<readonly TeamDynamixEntity[]> {
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/projects/${projectId}/risks`);
  }

  public async createProjectIssue(projectId: number, body: Record<string, unknown>): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/projects/${projectId}/issues`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async createProjectRisk(projectId: number, body: Record<string, unknown>): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/projects/${projectId}/risks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async listTimeTypes(): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>('/api/time/types');
  }

  public async getMyTimeEntries(startDate: string, endDate: string): Promise<readonly TeamDynamixEntity[]> {
    const qs = new URLSearchParams({ startDate, endDate });
    return await this.requestJson<readonly TeamDynamixEntity[]>(`/api/time/entries?${qs}`);
  }

  public async getTicketContacts(appId: number, ticketId: number): Promise<readonly TeamDynamixUser[]> {
    return await this.requestJson<readonly TeamDynamixUser[]>(`/api/${appId}/tickets/${ticketId}/contacts`);
  }

  public async addTicketContact(appId: number, ticketId: number, contactUid: string): Promise<TeamDynamixEntity> {
    return await this.requestJson<TeamDynamixEntity>(`/api/${appId}/tickets/${ticketId}/contacts/${contactUid}`, {
      method: 'PUT',
    });
  }

  public async removeTicketContact(appId: number, ticketId: number, contactUid: string): Promise<void> {
    await this.requestJson<void>(`/api/${appId}/tickets/${ticketId}/contacts/${contactUid}`, {
      method: 'DELETE',
    });
  }

  public async listServiceCategories(appId: number): Promise<readonly TeamDynamixNamedEntity[]> {
    return await this.requestJson<readonly TeamDynamixNamedEntity[]>(`/api/${appId}/services/categories`);
  }

  private async requestJson<T>(path: string, options: TeamDynamixRequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = await this.getBearerToken(options.requireAdmin ?? false);
    headers.set('Authorization', `Bearer ${token}`);

    const requestInit: RequestInit = {
      method: options.method ?? 'GET',
      headers,
      body: options.body,
    };

    const endpoint = `${this.config.baseUrl}${normalizePath(path)}`;

    const cappedRetries = Math.min(this.config.maxRetries, TEAMDYNAMIX_MAX_RETRY_ATTEMPTS);

    for (let attempt = 0; attempt <= cappedRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
      let response: Response;
      try {
        response = await fetch(endpoint, { ...requestInit, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 429 && attempt < cappedRetries) {
        const rateLimit = parseRateLimit(response.headers);
        if (LOG_LEVEL === 'debug') {
          console.error(
            `[teamdynamix-mcp] rate limited on ${normalizePath(path)}; retry ${attempt + 1}/${cappedRetries} in ${rateLimit.waitMs}ms`,
          );
        }
        await sleep(rateLimit.waitMs);
        continue;
      }

      if (!response.ok) {
        await response.text();
        throw new Error(`TeamDynamix request failed (${response.status}) for ${normalizePath(path)}.`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = (await response.json()) as T;
        // Validate response structure at runtime
        if (Array.isArray(data)) {
          TeamDynamixListResponseSchema.parse(data);
        } else if (typeof data === 'object' && data !== null) {
          TeamDynamixSingleResponseSchema.parse(data);
        }
        return data;
      }

      const text = await response.text();
      return text as T;
    }

    throw new Error(`TeamDynamix request exceeded retry budget for ${normalizePath(path)}.`);
  }

  private async getBearerToken(requireAdmin: boolean): Promise<string> {
    const configStatus = getTeamDynamixConfigStatus(this.config);
    if (!configStatus.configured) {
      throw new Error(
        `TeamDynamix is not configured. Missing: ${configStatus.missing.join(', ')}. ` +
          'Populate the required environment variables in .env before using TeamDynamix tools.',
      );
    }

    if (requireAdmin && this.config.authMode !== 'admin') {
      throw new Error(
        'This TeamDynamix action requires admin authentication, but TEAMDYNAMIX_AUTH_MODE is not set to admin.',
      );
    }

    const expiresAtMs = this.cachedToken?.expiresAtMs;
    if (this.cachedToken && (!expiresAtMs || expiresAtMs > Date.now() + 60_000)) {
      return this.cachedToken.token;
    }

    const token = await this.login();
    return token;
  }

  private async login(): Promise<string> {
    if (!this.config.baseUrl) {
      throw new Error('TeamDynamix base URL is not configured. Set TEAMDYNAMIX_BASE_URL.');
    }

    const isAdmin = this.config.authMode === 'admin';
    const loginPath = isAdmin ? '/api/auth/loginadmin' : '/api/auth/login';
    const body = isAdmin
      ? JSON.stringify({ BEID: this.config.beid, WebServicesKey: this.config.webServicesKey })
      : JSON.stringify({ username: this.config.username, password: this.config.password });

    const loginController = new AbortController();
    const loginTimeoutId = setTimeout(() => loginController.abort(), this.config.timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}${loginPath}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain;q=0.9',
          'Content-Type': 'application/json',
        },
        body,
        signal: loginController.signal,
      });
    } finally {
      clearTimeout(loginTimeoutId);
    }

    if (!response.ok) {
      await response.text();
      throw new Error(`TeamDynamix authentication failed (${response.status}).`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? ((await response.json()) as unknown)
      : await response.text();
    const token = extractAuthToken(payload);
    // TeamDynamix token expiry is derived from the JWT `exp` claim for cache invalidation.
    // Signature verification is not performed client-side because TeamDynamix validates token integrity server-side.
    const expiryEpochSeconds = decodeJwtExpiryEpochSeconds(token);

    this.cachedToken = {
      token,
      expiresAtMs: expiryEpochSeconds ? expiryEpochSeconds * 1_000 : null,
    };

    return token;
  }
}

export function createConfiguredTeamDynamixClient(): TeamDynamixClient {
  return new TeamDynamixClient(getTeamDynamixConfig());
}
