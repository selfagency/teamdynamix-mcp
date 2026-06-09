/**
 * Type definitions for the TeamDynamix SDK client.
 *
 * Re-exports SDK types for use across the MCP server.
 */

export type {
  TeamDynamixSdk,
  TeamDynamixClientConfig,
  RetryPolicy,
  RuntimeValidationMode,
  SdkRequestOptions,
  SdkRouteDefinition,
  SdkDomainName,
  ReportPage,
  BulkResult,
} from '@selfagency/teamdynamix-ts';

export { projectFields, previewEntity, runTicketReport, bulkAddUsersToGroup } from '@selfagency/teamdynamix-ts';
