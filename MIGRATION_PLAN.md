# Migration Plan: TeamDynamix MCP Server SDK Integration

## Executive Summary

**Goal**: Migrate the current TeamDynamix MCP server from custom HTTP client implementation to the official `@selfagency/teamdynamix-ts` SDK while maintaining backward compatibility, safety features, and all existing MCP tool capabilities.

**Current State**: Custom HTTP client with manual auth handling, retry logic, validation, and domain gateway tools.

**Target State**: Full SDK integration leveraging `createTeamDynamixClient`, `loginWithPassword`/`loginWithServiceAccount`, domain-specific read methods, curated mutations, and helper functions.

**Timeline Estimate**: 3-5 development sprints (15-25 days)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Migration Strategy](#migration-strategy)
3. [Phased Implementation Plan](#phased-implementation-plan)
4. [Backward Compatibility](#backward-compatibility)
5. [Testing Strategy](#testing-strategy)
6. [Risk Assessment](#risk-assessment)
7. [Dependencies](#dependencies)
8. [Rollout Plan](#rollout-plan)

---

## Architecture Overview

### Current Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ MCP Server Entry Point (src/index.ts)                       │
├─────────────────────────────────────────────────────────────┤
│ Configuration Layer (src/config.ts)                          │
│ - Environment variable parsing                               │
│ - Config validation (Zod)                                    │
│ - Config status reporting                                    │
├─────────────────────────────────────────────────────────────┤
│ HTTP Client Layer (src/services/teamdynamix/core.service.ts)│
│ - Manual auth token management                               │
│ - Custom retry with backoff                                  │
│ - Rate limit handling (429)                                   │
│ - Request/response logging                                   │
├─────────────────────────────────────────────────────────────┤
│ Domain Gateway Tools (src/tools/teamdynamix.domain-gateways.tools.ts)│
│ - 11 domain-specific gateway tools                          │
│ - Zod validation schemas (src/schemas/)                      │
│ - Safe-by-default (write tools disabled)                     │
├─────────────────────────────────────────────────────────────┤
│ Resources (src/resources/teamdynamix.resources.ts)           │
│ - Static resource definitions                                │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture with SDK

```text
┌─────────────────────────────────────────────────────────────┐
│ MCP Server Entry Point (src/index.ts)                       │
├─────────────────────────────────────────────────────────────┤
│ Configuration Layer (src/config.ts)                          │
│ - Environment variable parsing (RETAINED)                     │
│ - Config validation (Zod) (RETAINED)                          │
│ - SDK client factory initialization (NEW)                     │
├─────────────────────────────────────────────────────────────┤
│ SDK Client Factory (src/client/sdk-client.factory.ts) (NEW)   │
│ - createTeamDynamixClient(config)                             │
│ - Token provider selection (loginWithPassword / service account)│
│ - Retry policy configuration                                  │
│ - Runtime validation mode (fail-open/fail-closed)            │
│ - Environment detection (production/sandbox)                  │
├─────────────────────────────────────────────────────────────┤
│ SDK Domain Adapters (src/adapters/) (NEW)                    │
│ - tickets.adapter.ts                                        │
│ - assets.adapter.ts                                          │
│ - people.adapter.ts                                          │
│ - ... (one per SDK domain)                                   │
│ - Map MCP tool schemas to SDK method calls                  │
│ - Transform responses to MCP format                         │
├─────────────────────────────────────────────────────────────┤
│ Domain Gateway Tools (src/tools/teamdynamix.domain-gateways.tools.ts)│
│ - Same 11 gateway tools (RETAINED)                           │
│ - Delegate to SDK adapters instead of HTTP client            │
│ - Maintain same safety gate behavior                         │
├─────────────────────────────────────────────────────────────┤
│ Resources (src/resources/teamdynamix.resources.ts)           │
│ - Use SDK client for dynamic resource resolution (ENHANCED)  │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Approach: Incremental Adapter Pattern

**Rationale**: Complete rewrite is high-risk. Use adapter pattern to gradually migrate domain-by-domain while maintaining existing tool signatures.

**Key Principles**:

1. **Maintain tool contracts**: All existing MCP tool names, inputs, and outputs must remain unchanged
2. **Safety-first migration**: Write tools remain disabled until explicitly re-enabled
3. **Domain independence**: Each domain can migrate independently
4. **Parallel development**: Multiple domains can be migrated simultaneously
5. **Test-driven**: Each domain migration requires passing tests before proceeding

### Migration Phases

| Phase | Scope                                 | Duration | Dependencies          |
| ----- | ------------------------------------- | -------- | --------------------- |
| 0     | Infrastructure setup                  | 2 days   | None                  |
| 1     | Discovery domain migration            | 2 days   | Phase 0               |
| 2     | Reference data domain migration       | 3 days   | Phase 0               |
| 3     | People domain migration               | 3 days   | Phase 0               |
| 4     | Knowledge base domain migration       | 4 days   | Phase 0               |
| 5     | Tickets domain migration              | 5 days   | Phase 0               |
| 6     | Ticket relationships domain migration | 3 days   | Phase 5               |
| 7     | Assets domain migration               | 5 days   | Phase 0               |
| 8     | CMDB domain migration                 | 5 days   | Phase 0               |
| 9     | Services domain migration             | 4 days   | Phase 0               |
| 10    | Projects domain migration             | 5 days   | Phase 0               |
| 11    | Time domain migration                 | 3 days   | Phase 0               |
| 12    | Write tools migration (mutations)     | 5 days   | Read domains complete |
| 13    | Cleanup and deprecation               | 3 days   | All previous phases   |

---

## Phased Implementation Plan

### Phase 0: Infrastructure Setup (2 days)

**Objective**: Establish SDK integration infrastructure without breaking existing functionality.

#### Tasks

1. **Install SDK dependency**

   ```bash
   pnpm add @selfagency/teamdynamix-ts
   ```

2. **Create SDK client factory**
   - File: `src/client/sdk-client.factory.ts`
   - Export `createMcpSdkClient(config: TeamDynamixConfig): Promise<TeamDynamixClient>`
   - Map existing config to SDK config:

     ```typescript
     const sdkConfig: TeamDynamixClientConfig = {
       tenant: extractTenant(config.baseUrl),
       tokenProvider: createTokenProvider(config),
       environment: config.baseUrl.includes('sandbox') ? 'sandbox' : 'production',
       baseUrl: config.baseUrl,
       timeoutMs: config.timeoutMs,
       retryPolicy: {
         maxRetries: config.maxRetries,
         // ... other retry params with defaults
       },
       runtimeValidationMode: config.enableAdminTools ? 'fail-closed' : 'fail-open',
     };
     ```

3. **Create token provider factory**
   - File: `src/client/token-provider.factory.ts`
   - Function `createTokenProvider(config: TeamDynamixConfig): () => string | Promise<string>`
   - Handle both auth modes:

     ```typescript
     if (config.authMode === 'admin') {
       return loginWithServiceAccount({
         tenant: extractTenant(config.baseUrl),
         beid: config.beid!,
         webServicesKey: config.webServicesKey!,
       });
     } else {
       return loginWithPassword({
         tenant: extractTenant(config.baseUrl),
         username: config.username!,
         password: config.password!,
       });
     }
     ```

4. **Create domain adapter interface**
   - File: `src/adapters/domain-adapter.interface.ts`

   ```typescript
   export interface DomainAdapter {
     readonly name: string;
     readonly client: TeamDynamixClient;
     readonly appId: number | undefined;

     // Read operations
     read(method: string, params: unknown): Promise<unknown>;

     // Mutations (if applicable)
     create?(input: unknown): Promise<unknown>;
     update?(id: number | string, input: unknown): Promise<unknown>;
     delete?(id: number | string, confirm: boolean): Promise<unknown>;
   }
   ```

5. **Update type definitions**
   - File: `src/types.ts`
   - Add SDK types:

     ```typescript
     import type { TeamDynamixClient } from '@selfagency/teamdynamix-ts';
     import { projectFields, previewEntity, bulkAddUsersToGroup, runTicketReport } from '@selfagency/teamdynamix-ts';
     ```

6. **Create feature flag for SDK usage**
   - Environment variable: `TEAMDYNAMIX_USE_SDK=true|false`
   - Default: `false` (fallback to HTTP client)
   - Allows gradual rollout and A/B testing

**Deliverables**:

- [ ] SDK dependency installed
- [ ] SDK client factory implemented and tested
- [ ] Token provider factory implemented and tested
- [ ] Domain adapter interface defined
- [ ] Feature flag infrastructure
- [ ] Integration tests for SDK client creation

**Verification**:

```typescript
// Test that SDK client can be created
const { client, onLoginError } = await createMcpSdkClient(config);
expect(client).toBeDefined();
expect(typeof client.tickets.appIdTicketsId).toBe('function');
```

---

### Phase 1: Discovery Domain Migration (2 days)

**Objective**: Migrate discovery domain to SDK, proving the adapter pattern works.

#### Current Implementation

File: `src/schemas/teamdynamix/discovery.schema.ts`

```typescript
export const discoveryActionsSchema = z.object({
  action: z.enum(['server_status', 'list_applications', 'get_current_user', 'get_sso_login_status']),
  // ... payload schemas
});
```

File: `src/services/teamdynamix/discovery.service.ts`

- Custom HTTP calls to `/api/applications`, `/api/auth/getuser`, etc.

#### Migration Tasks

1. **Create discovery domain adapter**
   - File: `src/adapters/discovery.adapter.ts`

   ```typescript
   export class DiscoveryDomainAdapter implements DomainAdapter {
     readonly name = 'discovery';

     constructor(
       private readonly client: TeamDynamixClient,
       private readonly appId?: number,
     ) {}

     async read(method: string, params: unknown): Promise<unknown> {
       switch (method) {
         case 'server_status':
           return this.getServerStatus();
         case 'list_applications':
           return this.client.discovery.applications();
         case 'get_current_user':
           return this.client.discovery.authGetuser();
         case 'get_sso_login_status':
           return this.client.discovery.authLoginsso();
         default:
           throw new Error(`Unknown discovery method: ${method}`);
       }
     }

     private async getServerStatus(): Promise<{ configured: boolean; authMode: string }> {
       try {
         await this.client.discovery.authGetuser();
         return { configured: true, authMode: 'active' };
       } catch (error) {
         return { configured: false, authMode: 'error' };
       }
     }
   }
   ```

2. **Update discovery service to use adapter**
   - File: `src/services/teamdynamix/discovery.service.ts`
   - Add adapter factory function
   - Maintain backward compatibility with HTTP client

3. **Update domain gateway tool**
   - File: `src/tools/teamdynamix.domain-gateways.tools.ts`
   - Discovery tool delegates to adapter when feature flag is enabled

4. **Add tests**
   - Unit tests for adapter methods
   - Integration tests with mock SDK client
   - Comparison tests (HTTP vs SDK responses)

**Deliverables**:

- [ ] Discovery domain adapter
- [ ] Updated discovery service
- [ ] Updated gateway tool with conditional delegation
- [ ] Test suite (passing)
- [ ] Documentation update

**Verification**:

```bash
pnpm test -- --grep "discovery"
```

---

### Phase 2: Reference Data Domain Migration (3 days)

**Objective**: Migrate reference data domain to SDK. This is simpler as it's read-only and doesn't require appId for most operations.

#### Current Implementation

- HTTP calls to `/api/accounts`, `/api/locations`, `/api/industries`, etc.
- Some operations require appId (e.g., `appIdTicketsStatuses`)

#### Migration Tasks

1. **Create reference data domain adapter**
   - File: `src/adapters/reference-data.adapter.ts`

   ```typescript
   export class ReferenceDataDomainAdapter implements DomainAdapter {
     readonly name = 'reference_data';

     async read(method: string, params: unknown): Promise<unknown> {
       const { appId } = this;

       switch (method) {
         case 'list_accounts':
           return this.client.referenceData.accounts();
         case 'get_account':
           return this.client.referenceData.accountsId({
             params: { path: { id: (params as { id: number }).id } },
           });
         case 'list_locations':
           return this.client.referenceData.locations();
         case 'list_industries':
           return this.client.referenceData.industries();
         case 'list_ticket_statuses':
           if (!appId) throw new Error('appId required for ticket statuses');
           return this.client.referenceData.appIdTicketsStatuses({
             params: { path: { appId } },
           });
         case 'list_custom_attributes':
           return this.client.referenceData.attributesCustom();
         // ... more methods
       }
     }
   }
   ```

2. **Update reference data service**
   - Replace HTTP calls with SDK calls via adapter
   - Keep HTTP fallback for backward compatibility

3. **Implement SDK helpers**
   - Use `projectFields` for field projection:

     ```typescript
     import { projectFields } from '@selfagency/teamdynamix-ts';

     // In adapter
     async listAccountsWithProjection(fields: string[]) {
       const accounts = await this.client.referenceData.accounts();
       return projectFields(accounts, fields);
     }
     ```

4. **Add comprehensive tests**
   - Test pagination (Page, PageSize query params)
   - Test field projection
   - Test appId-required methods
   - Test error handling

**Deliverables**:

- [ ] Reference data domain adapter
- [ ] Updated reference data service
- [ ] Field projection support
- [ ] Test suite (passing)
- [ ] Documentation update

**Verification**:

```bash
pnpm test -- --grep "reference.data"
```

---

### Phase 3: People Domain Migration (3 days)

**Objective**: Migrate people domain to SDK, including groups and user lookups.

#### Current Implementation

- HTTP calls to `/api/people/{uid}`, `/api/groups/{id}`, `/api/people/lookup`

#### Migration Tasks

1. **Create people domain adapter**
   - File: `src/adapters/people.adapter.ts`

   ```typescript
   export class PeopleDomainAdapter implements DomainAdapter {
     readonly name = 'people';

     async read(method: string, params: unknown): Promise<unknown> {
       switch (method) {
         case 'get_person_by_uid':
           return this.client.people.peopleUid({
             params: { path: { uid: (params as { uid: string }).uid } },
           });
         case 'get_uid_by_username':
           return this.client.people.peopleGetuidUsername({
             params: { path: { username: (params as { username: string }).username } },
           });
         case 'lookup_people':
           return this.client.people.peopleLookup({
             params: { query: (params as { query: Record<string, string> }).query },
           });
         case 'get_group':
           return this.client.people.groupsId({
             params: { path: { id: (params as { id: number }).id } },
           });
         case 'get_group_members':
           return this.client.people.groupsIdMembers({
             params: { path: { id: (params as { id: number }).id } },
           });
         case 'get_group_applications':
           return this.client.people.groupsIdApplications({
             params: { path: { id: (params as { id: number }).id } },
           });
         // ... more methods
       }
     }
   }
   ```

2. **Implement SDK helper: bulkAddUsersToGroup**
   - File: `src/adapters/people.helpers.ts`

   ```typescript
   import { bulkAddUsersToGroup } from '@selfagency/teamdynamix-ts';

   async addUsersToGroup(input: {
     groupId: number;
     uids: string[];
     dryRun?: boolean;
   }): Promise<BulkResult> {
     return bulkAddUsersToGroup(this.client, input);
   }
   ```

3. **Update people service**
   - Migrate all read operations
   - Add bulk operations via SDK helpers

4. **Add tests**
   - Test user lookups
   - Test group operations
   - Test bulk user addition
   - Test dry-run mode

**Deliverables**:

- [ ] People domain adapter
- [ ] Bulk operations helper
- [ ] Updated people service
- [ ] Test suite (passing)
- [ ] Documentation update

**Verification**:

```bash
pnpm test -- --grep "people"
```

---

### Phase 4: Knowledge Base Domain Migration (4 days)

**Objective**: Migrate knowledge base domain with appId scoping.

#### Current Implementation

- HTTP calls to `/{appId}/knowledgebase/{id}`, `/{appId}/knowledgebase/categories`

#### Migration Tasks

1. **Create knowledge base domain adapter**
   - File: `src/adapters/knowledge-base.adapter.ts`
   - Note: Requires appId for all operations

   ```typescript
   export class KnowledgeBaseDomainAdapter implements DomainAdapter {
     readonly name = 'knowledge_base';
     readonly appId: number;

     async read(method: string, params: unknown): Promise<unknown> {
       if (!this.appId) {
         throw new Error('appId required for knowledge base operations');
       }

       switch (method) {
         case 'get_article':
           return this.client.knowledgeBase.appIdKnowledgebaseId({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         case 'list_categories':
           return this.client.knowledgeBase.appIdKnowledgebaseCategories({
             params: { path: { appId: this.appId } },
           });
         case 'get_category':
           return this.client.knowledgeBase.appIdKnowledgebaseCategoriesId({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         case 'get_article_related':
           return this.client.knowledgeBase.appIdKnowledgebaseIdRelated({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         case 'get_article_assets':
           return this.client.knowledgeBase.appIdKnowledgebaseIdAssetscis({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         // ... more methods
       }
     }
   }
   ```

2. **Implement mutations (curated SDK methods)**
   - File: `src/adapters/knowledge-base.mutations.ts`

   ```typescript
   async createArticle(input: {
     Subject: string;
     Content: string;
     TypeID?: number;
     StatusID?: number;
   }): Promise<unknown> {
     return this.client.knowledgeBase.createArticle({
       appId: this.appId,
       body: input,
     });
   }

   async updateArticle(id: number, input: {
     Subject?: string;
     Content?: string;
     StatusID?: number;
   }): Promise<unknown> {
     return this.client.knowledgeBase.updateArticle({
       appId: this.appId,
       articleId: id,
       body: input,
     });
   }

   async deleteArticle(id: number, confirm: boolean): Promise<unknown> {
     if (!confirm) {
       throw new Error('Confirm required for deletion');
     }
     return this.client.knowledgeBase.deleteArticle({
       appId: this.appId,
       articleId: id,
     });
   }
   ```

3. **Update knowledge base service**
   - Migrate read operations
   - Migrate mutations (respect `enableWriteTools` flag)

4. **Add tests**
   - Test read operations
   - Test mutations (with safety gates)
   - Test appId validation
   - Test confirm required for delete

**Deliverables**:

- [ ] Knowledge base domain adapter
- [ ] Mutation methods
- [ ] Updated knowledge base service
- [ ] Test suite (passing)
- [ ] Documentation update

**Verification**:

```bash
pnpm test -- --grep "knowledge.base"
```

---

### Phase 5: Tickets Domain Migration (5 days)

**Objective**: Migrate the most complex domain with extensive read operations, feed pagination, and mutations.

#### Current Implementation

- HTTP calls to `/{appId}/tickets/{id}`, `/{appId}/tickets/feed`, etc.
- Custom search and report functionality

#### Migration Tasks

1. **Create tickets domain adapter**
   - File: `src/adapters/tickets.adapter.ts`
   - Most methods require appId

   ```typescript
   export class TicketsDomainAdapter implements DomainAdapter {
     readonly name = 'tickets';
     readonly appId: number;

     async read(method: string, params: unknown): Promise<unknown> {
       if (!this.appId) {
         throw new Error('appId required for ticket operations');
       }

       switch (method) {
         case 'get_ticket':
           return this.client.tickets.appIdTicketsId({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         case 'list_tickets_feed':
           return this.client.tickets.appIdTicketsFeed({
             params: {
               path: { appId: this.appId },
               query: (params as { query?: Record<string, string> }).query ?? {},
             },
           });
         case 'get_ticket_workflow':
           return this.client.tickets.appIdTicketsIdWorkflow({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         case 'get_ticket_workflow_actions':
           return this.client.tickets.appIdTicketsIdWorkflowActions({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         case 'list_priorities':
           return this.client.tickets.appIdTicketsPriorities({
             params: { path: { appId: this.appId } },
           });
         case 'list_statuses':
           return this.client.tickets.appIdTicketsStatuses({
             params: { path: { appId: this.appId } },
           });
         // ... many more methods
       }
     }
   }
   ```

2. **Implement SDK helper: runTicketReport**
   - File: `src/adapters/tickets.helpers.ts`

   ```typescript
   import { runTicketReport } from '@selfagency/teamdynamix-ts';

   async runSavedReport(input: {
     searchId: number;
     page?: number;
     pageSize?: number;
     filter?: (item: unknown) => boolean;
   }): Promise<ReportPage> {
     return runTicketReport(this.client, {
       appId: this.appId,
       ...input,
     });
   }
   ```

3. **Implement mutations**
   - File: `src/adapters/tickets.mutations.ts`

   ```typescript
   async createTicket(input: {
     Title: string;
     Description: string;
     StatusID: number;
     PriorityID?: number;
     TypeID?: number;
   }): Promise<unknown> {
     return this.client.tickets.createTicket({
       appId: this.appId,
       body: input,
     });
   }

   async updateTicket(id: number, input: {
     StatusID?: number;
     PriorityID?: number;
     Description?: string;
   }): Promise<unknown> {
     return this.client.tickets.updateTicket({
       appId: this.appId,
       ticketId: id,
       body: input,
     });
   }

   async addComment(id: number, comment: string): Promise<unknown> {
     return this.client.tickets.addTicketComment({
       appId: this.appId,
       ticketId: id,
       body: { Comment: comment },
     });
   }

   async deleteTicket(id: number, confirm: boolean): Promise<unknown> {
     if (!confirm) {
       throw new Error('Confirm required for deletion');
     }
     return this.client.tickets.deleteTicket({
       appId: this.appId,
       ticketId: id,
     });
   }
   ```

4. **Update tickets service**
   - Migrate all read operations
   - Migrate mutations
   - Implement report helper

5. **Add tests**
   - Comprehensive test coverage
   - Test pagination (feed, reports)
   - Test mutations with safety gates
   - Test error handling

**Deliverables**:

- [ ] Tickets domain adapter
- [ ] Mutation methods
- [ ] Report helper
- [ ] Updated tickets service
- [ ] Comprehensive test suite (passing)
- [ ] Documentation update

**Verification**:

```bash
pnpm test -- --grep "tickets"
```

---

### Phase 6: Ticket Relationships Domain Migration (3 days)

**Objective**: Migrate ticket relationships (tasks, assets, contacts) domain.

**Dependency**: Phase 5 (tickets) must be complete

#### Migration Tasks

1. **Create ticket relationships domain adapter**
   - File: `src/adapters/ticket-relationships.adapter.ts`
   - Requires appId

   ```typescript
   export class TicketRelationshipsDomainAdapter implements DomainAdapter {
     readonly name = 'ticket_relationships';
     readonly appId: number;

     async read(method: string, params: unknown): Promise<unknown> {
       if (!this.appId) {
         throw new Error('appId required for ticket relationship operations');
       }

       switch (method) {
         case 'list_ticket_tasks':
           return this.client.ticketRelationships.appIdTicketsTicketIdTasks({
             params: { path: { appId: this.appId, ticketId: (params as { ticketId: number }).ticketId } },
           });
         case 'get_task':
           return this.client.ticketRelationships.appIdTicketsTicketIdTasksId({
             params: {
               path: {
                 appId: this.appId,
                 ticketId: (params as { ticketId: number }).ticketId,
                 id: (params as { id: number }).id,
               },
             },
           });
         case 'get_task_feed':
           return this.client.ticketRelationships.appIdTicketsTicketIdTasksIdFeed({
             params: {
               path: {
                 appId: this.appId,
                 ticketId: (params as { ticketId: number }).ticketId,
                 id: (params as { id: number }).id,
               },
             },
           });
         case 'list_ticket_assets':
           return this.client.ticketRelationships.appIdTicketsIdAssets({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         case 'list_ticket_contacts':
           return this.client.ticketRelationships.appIdTicketsIdContacts({
             params: { path: { appId: this.appId, id: (params as { id: number }).id } },
           });
         // ... more methods
       }
     }
   }
   ```

2. **Implement mutations**
   - Create/update/delete tasks
   - Link/unlink assets
   - Link/unlink contacts

3. **Update service**
   - Migrate read operations
   - Migrate mutations

4. **Add tests**

**Deliverables**:

- [ ] Ticket relationships domain adapter
- [ ] Mutation methods
- [ ] Updated service
- [ ] Test suite (passing)
- [ ] Documentation update

**Verification**:

```bash
pnpm test -- --grep "ticket.relationships"
```

---

### Phase 7-11: Remaining Domain Migrations

**Approach**: Follow the same pattern as previous phases.

| Phase | Domain   | Key Characteristics                            | Estimated Duration |
| ----- | -------- | ---------------------------------------------- | ------------------ |
| 7     | Assets   | App-scoped, contracts, models, vendors         | 5 days             |
| 8     | CMDB     | App-scoped, relationships, maintenance windows | 5 days             |
| 9     | Services | App-scoped, offerings, categories              | 4 days             |
| 10    | Projects | Global (no appId), plans, issues, risks, links | 5 days             |
| 11    | Time     | Global, reports, types, days off               | 3 days             |

#### Common Tasks for Each Domain

1. **Create domain adapter** (`src/adapters/{domain}.adapter.ts`)
2. **Implement mutations** (if applicable)
3. **Update domain service** (`src/services/teamdynamix/{domain}.service.ts`)
4. **Update gateway tool**
5. **Add comprehensive tests**
6. **Update documentation**

---

### Phase 12: Write Tools Migration (5 days)

**Objective**: Migrate all mutation (write) operations to SDK curated methods.

**Dependency**: All read domains must be migrated first.

#### Current Write Tools

- Create/update/delete tickets
- Create/update/delete KB articles
- Create/update/delete assets
- Add ticket comments
- Link/unlink assets to tickets
- Bulk operations

#### Migration Tasks

1. **Ensure all domain adapters implement mutations**
2. **Update write service layer**
3. **Maintain safety gates**:
   - `enableWriteTools` flag
   - `confirm: true` for destructive operations
4. **Add mutation-specific tests**
5. **Update documentation**

**Deliverables**:

- [ ] All mutation methods migrated
- [ ] Safety gates verified
- [ ] Mutation test suite (passing)
- [ ] Documentation updated

**Verification**:

```bash
TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true pnpm test -- --grep "mutations"
```

---

### Phase 13: Cleanup and Deprecation (3 days)

**Objective**: Remove deprecated HTTP client code and finalize SDK integration.

#### Tasks

1. **Remove HTTP client fallback code**
   - Delete `src/services/teamdynamix/core.service.ts`
   - Delete HTTP client utilities
   - Remove feature flag (SDK is now required)

2. **Update configuration**
   - Simplify config to only support SDK
   - Remove legacy config options

3. **Update types**
   - Remove deprecated types
   - Consolidate SDK types

4. **Final test sweep**
   - Run full test suite
   - Ensure 100% pass rate
   - Verify coverage hasn't dropped

5. **Documentation cleanup**
   - Update README
   - Update architecture docs
   - Remove HTTP client references

6. **Release notes**
   - Document breaking changes (if any)
   - List migration benefits

**Deliverables**:

- [ ] HTTP client code removed
- [ ] Configuration simplified
- [ ] Types updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Release notes published

**Verification**:

```bash
pnpm test
pnpm build
pnpm typecheck
```

---

## Backward Compatibility

### Compatibility Matrix

| Feature               | Before Migration | After Migration | Notes                                      |
| --------------------- | ---------------- | --------------- | ------------------------------------------ |
| Tool names            | Same             | Same            | No breaking changes                        |
| Tool inputs           | Same             | Same            | Maintained via adapters                    |
| Tool outputs          | Same             | Same            | Transformation layer ensures compatibility |
| Environment variables | Same             | Same            | + new `TEAMDYNAMIX_USE_SDK` flag           |
| Safety gates          | Same             | Same            | All flags respected                        |
| Rate limiting         | Custom           | SDK built-in    | SDK provides better defaults               |
| Retry logic           | Custom           | SDK built-in    | SDK provides exponential backoff           |
| Validation            | Zod              | Zod + AJV (SDK) | Dual validation in Phase 0                 |

### Deprecation Path

1. **Phase 0-12**: Both HTTP client and SDK available via feature flag
2. **Phase 13**: HTTP client removed, SDK required
3. **Breaking changes**: None if environment is configured correctly

---

## Testing Strategy

### Test Categories

#### 1. Unit Tests (Domain Adapters)

```typescript
describe('DiscoveryDomainAdapter', () => {
  it('should list applications', async () => {
    const mockClient = createMockSdkClient();
    const adapter = new DiscoveryDomainAdapter(mockClient);

    const result = await adapter.read('list_applications', {});

    expect(result).toBeDefined();
    expect(mockClient.discovery.applications).toHaveBeenCalled();
  });

  it('should handle auth errors', async () => {
    const mockClient = createMockSdkClient();
    mockClient.discovery.applications.mockRejectedValue(new Error('Unauthorized'));

    const adapter = new DiscoveryDomainAdapter(mockClient);

    await expect(adapter.read('list_applications', {})).rejects.toThrow('Unauthorized');
  });
});
```

#### 2. Integration Tests (SDK Client)

```typescript
describe('SDK Client Integration', () => {
  it('should create SDK client with password auth', async () => {
    const config = createTestConfig({ authMode: 'standard' });
    const { client } = await createMcpSdkClient(config);

    expect(client).toBeDefined();
    // Test that client is properly authenticated
  });

  it('should handle token refresh on 401', async () => {
    // Test automatic retry with fresh token
  });
});
```

#### 3. Comparison Tests (HTTP vs SDK)

```typescript
describe('HTTP vs SDK Equivalence', () => {
  it('should return same data for list_accounts', async () => {
    const config = createTestConfig();

    const httpClient = createHttpClient(config);
    const sdkClient = await createMcpSdkClient(config);

    const httpResult = await httpClient.get('/api/accounts');
    const sdkResult = await sdkClient.referenceData.accounts();

    expect(httpResult).toEqual(sdkResult);
  });
});
```

#### 4. End-to-End Tests (MCP Tools)

```typescript
describe('MCP Tool Integration', () => {
  it('should handle teamdynamix_discovery tool', async () => {
    const result = await callMcpTool('teamdynamix_discovery', {
      action: 'list_applications',
      payload: {},
      response_format: 'json',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
```

### Coverage Targets

| Category            | Target | Current        |
| ------------------- | ------ | -------------- |
| Domain adapters     | 95%    | -              |
| SDK client factory  | 100%   | -              |
| Gateway tools       | 90%    | 87% (maintain) |
| Mutation operations | 95%    | -              |
| Error handling      | 90%    | -              |

---

## Risk Assessment

### Risks and Mitigations

| Risk                                   | Probability | Impact | Mitigation                                                                  |
| -------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------- |
| SDK doesn't support all endpoints      | Medium      | High   | Fallback to HTTP client during transition; add feature requests to SDK repo |
| Breaking changes in MCP tool contracts | Low         | High   | Maintain strict adapter contracts; comprehensive testing                    |
| Performance regression                 | Low         | Medium | Benchmark HTTP vs SDK; profile critical paths                               |
| Authentication differences             | Medium      | High   | Test both auth modes thoroughly; validate token lifecycle                   |
| SDK version conflicts                  | Low         | Medium | Pin SDK version; monitor updates                                            |
| Configuration drift                    | Low         | Medium | Validate config mapping; add config tests                                   |

### Rollback Plan

If migration fails at any phase:

1. Set `TEAMDYNAMIX_USE_SDK=false` to revert to HTTP client
2. Fix issues in next phase
3. Re-enable SDK incrementally

---

## Dependencies

### External Dependencies

```json
{
  "@selfagency/teamdynamix-ts": "^1.x.x", // NEW
  "@modelcontextprotocol/sdk": "^1.29.0", // EXISTING
  "tablemark": "^4.1.0", // EXISTING
  "zod": "^4.3.6" // EXISTING
}
```

### Internal Dependencies

| Module                 | Phase      | Notes   |
| ---------------------- | ---------- | ------- |
| SDK client factory     | Phase 0    | New     |
| Token provider factory | Phase 0    | New     |
| Domain adapters        | Phase 1-11 | New     |
| Domain services        | Phase 1-11 | Updated |
| Gateway tools          | Phase 1-11 | Updated |
| Configuration          | Phase 0    | Updated |

---

## Rollout Plan

### Development Phase

1. **Week 1-2**: Phase 0 (Infrastructure)
2. **Week 2-3**: Phases 1-3 (Discovery, Reference Data, People)
3. **Week 4-5**: Phases 4-6 (KB, Tickets, Ticket Relationships)
4. **Week 6-8**: Phases 7-11 (Remaining domains)
5. **Week 9**: Phase 12 (Write tools)
6. **Week 10**: Phase 13 (Cleanup)

### Testing Phase

1. **Unit tests**: Continuous, each phase
2. **Integration tests**: End of each phase
3. **E2E tests**: After Phase 12
4. **Performance testing**: After Phase 13
5. **Security audit**: Before release

### Release Phase

1. **Alpha release**: After Phase 6 (feature branch)
2. **Beta release**: After Phase 12 (feature branch)
3. **RC release**: After Phase 13 (main branch)
4. **Stable release**: After RC validation

### Monitoring

1. **Error rates**: Compare HTTP vs SDK error rates
2. **Performance**: Monitor latency and throughput
3. **Test coverage**: Ensure no regression
4. **User feedback**: Collect during beta phase

---

## Success Criteria

- [ ] All 11 domain gateway tools migrated to SDK
- [ ] All mutation operations migrated to SDK
- [ ] 95%+ test coverage maintained
- [ ] No breaking changes to MCP tool contracts
- [ ] Performance equal or better than HTTP client
- [ ] All safety gates respected
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Security audit passed
- [ ] User acceptance testing passed

---

## Appendix

### SDK Method Reference

#### Discovery Domain

| MCP Method           | SDK Method                        | Notes                                   |
| -------------------- | --------------------------------- | --------------------------------------- |
| server_status        | -                                 | Custom implementation using authGetuser |
| list_applications    | `client.discovery.applications()` | -                                       |
| get_current_user     | `client.discovery.authGetuser()`  | -                                       |
| get_sso_login_status | `client.discovery.authLoginsso()` | -                                       |

#### Tickets Domain

| MCP Method          | SDK Method                                | Notes                               |
| ------------------- | ----------------------------------------- | ----------------------------------- |
| get_ticket          | `client.tickets.appIdTicketsId()`         | Requires appId                      |
| list_tickets_feed   | `client.tickets.appIdTicketsFeed()`       | Requires appId, supports pagination |
| get_ticket_workflow | `client.tickets.appIdTicketsIdWorkflow()` | Requires appId                      |
| create_ticket       | `client.tickets.createTicket()`           | Mutation, requires appId            |
| update_ticket       | `client.tickets.updateTicket()`           | Mutation, requires appId            |
| add_comment         | `client.tickets.addTicketComment()`       | Mutation, requires appId            |
| delete_ticket       | `client.tickets.deleteTicket()`           | Mutation, requires appId, confirm   |

#### Helper Functions

| MCP Method              | SDK Helper                           | Notes |
| ----------------------- | ------------------------------------ | ----- |
| run_ticket_report       | `runTicketReport(client, input)`     | -     |
| project_fields          | `projectFields(items, fields)`       | -     |
| bulk_add_users_to_group | `bulkAddUsersToGroup(client, input)` | -     |
| preview_entity          | `previewEntity(entity, options?)`    | -     |

### Configuration Mapping

| MCP Config          | SDK Config              | Notes                                               |
| ------------------- | ----------------------- | --------------------------------------------------- |
| baseUrl             | tenant + environment    | Extract tenant from baseUrl                         |
| authMode            | tokenProvider           | Select loginWithPassword or loginWithServiceAccount |
| username/password   | loginWithPassword       | Standard auth                                       |
| beid/webServicesKey | loginWithServiceAccount | Admin auth                                          |
| timeoutMs           | timeoutMs               | Direct mapping                                      |
| maxRetries          | retryPolicy.maxRetries  | Direct mapping                                      |
| enableWriteTools    | -                       | Safety gate, not SDK config                         |
| enableAdminTools    | runtimeValidationMode   | Maps to 'fail-closed' when true                     |

### Environment Variables

| Variable                          | Required    | Description                                     |
| --------------------------------- | ----------- | ----------------------------------------------- |
| TEAMDYNAMIX_BASE_URL              | Yes         | API base URL                                    |
| TEAMDYNAMIX_AUTH_MODE             | Yes         | 'standard' or 'admin'                           |
| TEAMDYNAMIX_USERNAME              | Conditional | For standard auth                               |
| TEAMDYNAMIX_PASSWORD              | Conditional | For standard auth                               |
| TEAMDYNAMIX_BEID                  | Conditional | For admin auth                                  |
| TEAMDYNAMIX_WEB_SERVICES_KEY      | Conditional | For admin auth                                  |
| TEAMDYNAMIX_DEFAULT_TICKET_APP_ID | No          | Default app ID for tickets                      |
| TEAMDYNAMIX_DEFAULT_ASSET_APP_ID  | No          | Default app ID for assets                       |
| TEAMDYNAMIX_DEFAULT_KB_APP_ID     | No          | Default app ID for KB                           |
| TEAMDYNAMIX_TIMEOUT_MS            | No          | Request timeout (default: 30000)                |
| TEAMDYNAMIX_MAX_RETRIES           | No          | Max retry attempts (default: 3)                 |
| TEAMDYNAMIX_ENABLE_WRITE_TOOLS    | No          | Enable mutations (default: false)               |
| TEAMDYNAMIX_ENABLE_ADMIN_TOOLS    | No          | Enable admin ops (default: false)               |
| TEAMDYNAMIX_USE_SDK               | No          | Use SDK instead of HTTP client (default: false) |

### Glossary

- **MCP**: Model Context Protocol
- **SDK**: Software Development Kit
- **HTTP client**: Custom HTTP implementation being replaced
- **Domain adapter**: Adapter layer mapping MCP tools to SDK methods
- **Feature flag**: Environment variable to enable/disable SDK
- **Mutation**: Write operation (create/update/delete)
- **Read operation**: GET request (read-only)
- **appId**: Application ID required by some TeamDynamix endpoints
- **Tenant**: TeamDynamix subdomain or FQDN
- **BEID**: Business Entity ID (admin auth)
- **WebServicesKey**: Admin authentication key

---

## Revision History

| Version | Date       | Author           | Changes                |
| ------- | ---------- | ---------------- | ---------------------- |
| 1.0     | 2025-01-09 | Daniel Sieradski | Initial migration plan |

---

## Next Steps

1. **Review and approve** this migration plan
2. **Create GitHub issue** to track migration progress
3. **Start Phase 0** (Infrastructure setup)
4. **Set up CI/CD** for continuous testing
5. **Begin domain migrations** in order of complexity

---

## Questions and Open Issues

1. Should we maintain HTTP client fallback indefinitely or remove it in Phase 13?
2. Are there any SDK features we should leverage beyond basic CRUD?
3. Should we implement custom validation on top of SDK's AJV validation?
4. How should we handle SDK version updates in the future?
5. Should we implement rate limiting at the MCP level in addition to SDK's retry?

---

## References

- [TeamDynamix TypeScript SDK Documentation](https://teamdynamix-ts.self.agency/guide/)
- [TeamDynamix Web API Documentation](https://api.teamdynamix.com/help)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Server Repository](https://github.com/selfagency/teamdynamix-mcp)
- [SDK Repository](https://github.com/selfagency/teamdynamix-ts)
