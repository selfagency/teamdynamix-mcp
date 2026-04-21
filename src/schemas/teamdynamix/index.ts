import { z } from 'zod';
import { ResponseFormatSchema } from '../index.js';

export const TeamDynamixAppIdSchema = z.number().int().positive().describe('TeamDynamix application ID.');

export const TeamDynamixGuidSchema = z.string().uuid().describe('TeamDynamix GUID identifier.');

export const TeamDynamixResponseFormatSchema = ResponseFormatSchema;

// ---------------------------------------------------------------------------
// Ticket schemas
// ---------------------------------------------------------------------------

export const TicketSearchSchema = z.object({
  Keywords: z.string().max(500).optional().describe('Full-text search term.'),
  MaxResults: z.number().int().min(1).max(1000).optional().default(50).describe('Maximum results to return (1–1000).'),
  StatusIDs: z.array(z.number().int()).optional().describe('Filter by ticket status IDs.'),
  TypeIDs: z.array(z.number().int()).optional().describe('Filter by ticket type IDs.'),
  PriorityIDs: z.array(z.number().int()).optional().describe('Filter by ticket priority IDs.'),
  UrgencyIDs: z.array(z.number().int()).optional().describe('Filter by ticket urgency IDs.'),
  ImpactIDs: z.array(z.number().int()).optional().describe('Filter by ticket impact IDs.'),
  AccountIDs: z.array(z.number().int()).optional().describe('Filter by account/department IDs.'),
  ResponsibleGroupIDs: z.array(z.number().int()).optional().describe('Filter by responsible group IDs.'),
  ResponsibleUids: z.array(z.string().uuid()).optional().describe('Filter by responsible user GUIDs.'),
  RequestorUids: z.array(z.string().uuid()).optional().describe('Filter by requestor user GUIDs.'),
  CreatedDateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('ISO 8601 start date for creation date filter.'),
  CreatedDateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('ISO 8601 end date for creation date filter.'),
  ModifiedDateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('ISO 8601 start date for last-modified filter.'),
  ModifiedDateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('ISO 8601 end date for last-modified filter.'),
  ClosedDateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('ISO 8601 start date for closed date filter.'),
  ClosedDateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('ISO 8601 end date for closed date filter.'),
  SortBy: z.string().max(100).optional().describe('Field name to sort results by.'),
  SortOrder: z.enum(['A', 'D']).optional().describe('Sort order: A = ascending, D = descending.'),
});

export const TicketCreateSchema = z.object({
  TypeID: z.number().int().positive().describe('Ticket type ID.'),
  Title: z.string().min(1).max(500).describe('Ticket title/subject.'),
  AccountID: z.number().int().positive().optional().describe('Account/department ID.'),
  StatusID: z.number().int().nonnegative().optional().describe('Initial ticket status ID.'),
  PriorityID: z.number().int().nonnegative().optional().describe('Ticket priority ID.'),
  UrgencyID: z.number().int().nonnegative().optional().describe('Ticket urgency ID.'),
  ImpactID: z.number().int().nonnegative().optional().describe('Ticket impact ID.'),
  SourceID: z.number().int().nonnegative().optional().describe('Ticket source ID.'),
  Description: z.string().max(65535).optional().describe('Full description/body of the ticket (HTML supported).'),
  RequestorUID: z.string().uuid().optional().describe('GUID of the requestor.'),
  ResponsibleUID: z.string().uuid().optional().describe('GUID of the responsible technician.'),
  ResponsibleGroupID: z.number().int().positive().optional().describe('Responsible group ID.'),
  FormID: z.number().int().positive().optional().describe('Ticket form ID.'),
  Attributes: z
    .array(
      z.object({
        ID: z.number().int(),
        Value: z.string(),
      }),
    )
    .optional()
    .describe('Custom attribute values.'),
});

export const TicketPatchSchema = z.object({
  TicketID: z.number().int().positive().describe('Ticket ID to update.'),
  Attributes: z
    .record(z.string().max(100), z.string().max(65535))
    .refine(obj => Object.keys(obj).length <= 50, { message: 'Attributes may contain at most 50 fields per update.' })
    .describe(
      'Fields to update as key/value pairs. Keys must be valid ticket field names (e.g. "StatusID", "Title", "ResponsibleUID"). Maximum 50 fields per update.',
    ),
  NotifyRequestor: z.boolean().optional().default(false).describe('Notify the requestor of the change.'),
  NotifyResponsible: z.boolean().optional().default(false).describe('Notify the responsible technician of the change.'),
  Comments: z.string().max(65535).optional().describe('Comment to attach to this update.'),
  IsPrivate: z.boolean().optional().default(false).describe('Whether the comment is private.'),
});

export const TicketCommentSchema = z.object({
  TicketID: z.number().int().positive().describe('Ticket ID to comment on.'),
  Body: z.string().min(1).max(65535).describe('Comment body (HTML supported).'),
  IsPrivate: z.boolean().optional().default(false).describe('Whether this comment is private.'),
  NotifyRequestor: z.boolean().optional().default(false).describe('Notify the requestor.'),
  NotifyResponsible: z.boolean().optional().default(false).describe('Notify the responsible technician.'),
});

// ---------------------------------------------------------------------------
// People & Groups schemas
// ---------------------------------------------------------------------------

export const UserSearchSchema = z.object({
  SearchText: z.string().max(500).optional().describe('Name, username, or email to search for.'),
  IsActive: z.boolean().optional().describe('Filter by active (true) or inactive (false) users.'),
  IsEmployee: z.boolean().optional().describe('Filter to employees only.'),
  AppID: z.number().int().positive().optional().describe('Scope search to a specific application.'),
  MaxResults: z.number().int().min(1).max(1000).optional().default(25).describe('Maximum results (1–1000).'),
});

export const GroupSearchSchema = z.object({
  NameLike: z.string().max(500).optional().describe('Partial group name to search.'),
  IsActive: z.boolean().optional().describe('Filter by active (true) or inactive (false) groups.'),
  AppID: z.number().int().positive().optional().describe('Scope search to a specific application.'),
});

// ---------------------------------------------------------------------------
// Knowledge Base schemas
// ---------------------------------------------------------------------------

export const KbArticleSearchSchema = z.object({
  SearchText: z.string().max(500).optional().describe('Full-text search within articles.'),
  CategoryID: z.number().int().positive().optional().describe('Filter by KB category ID.'),
  IsPublished: z.boolean().optional().describe('Filter to published articles only.'),
  MaxResults: z.number().int().min(1).max(500).optional().default(25).describe('Maximum results (1–500).'),
});

// ---------------------------------------------------------------------------
// Asset / CMDB schemas
// ---------------------------------------------------------------------------

export const AssetSearchSchema = z.object({
  SerialLike: z.string().max(200).optional().describe('Partial serial number to match.'),
  TagLike: z.string().max(200).optional().describe('Partial asset tag to match.'),
  SearchText: z.string().max(500).optional().describe('General text search across asset fields.'),
  StatusIDs: z.array(z.number().int()).optional().describe('Filter by asset status IDs.'),
  OwnerUID: z.string().uuid().optional().describe('Filter by asset owner GUID.'),
  UsingDepartmentID: z.number().int().positive().optional().describe('Filter by using department ID.'),
  MaxResults: z.number().int().min(1).max(1000).optional().default(25).describe('Maximum results (1–1000).'),
});

// ---------------------------------------------------------------------------
// Service Catalog schemas
// ---------------------------------------------------------------------------

export const ServiceSearchSchema = z.object({
  SearchText: z.string().max(500).optional().describe('Full-text search across service fields.'),
  IsActive: z.boolean().optional().describe('Filter to active services only.'),
  CategoryID: z.number().int().positive().optional().describe('Filter by service category ID.'),
  MaxResults: z.number().int().min(1).max(500).optional().default(25).describe('Maximum results (1–500).'),
});

// ---------------------------------------------------------------------------
// Project schemas
// ---------------------------------------------------------------------------

export const ProjectSearchSchema = z.object({
  NameLike: z.string().max(500).optional().describe('Partial project name to search.'),
  TypeIDs: z.array(z.number().int()).optional().describe('Filter by project type IDs.'),
  IsActive: z.boolean().optional().describe('Filter to active projects.'),
  ManagerUID: z.string().uuid().optional().describe('Filter by project manager GUID.'),
  MaxResults: z.number().int().min(1).max(500).optional().default(25).describe('Maximum results (1–500).'),
});

// ---------------------------------------------------------------------------
// Ticket Task schemas
// ---------------------------------------------------------------------------

export const TicketTaskCreateSchema = z.object({
  TicketID: z.number().int().positive().describe('Parent ticket ID.'),
  Title: z.string().min(1).max(500).describe('Task title.'),
  Description: z.string().max(65535).optional().describe('Task description.'),
  IsActive: z.boolean().optional().default(true).describe('Whether the task is active.'),
  AssignedUID: z.string().uuid().optional().describe('GUID of the assigned user.'),
  AssignedGroupID: z.number().int().positive().optional().describe('Assigned group ID.'),
  EstimatedMinutes: z.number().int().nonnegative().optional().describe('Estimated minutes to complete.'),
  StartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('Task start date (ISO 8601).'),
  EndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('Task due date (ISO 8601).'),
});

// ---------------------------------------------------------------------------
// Knowledge Base Article CRUD schemas
// ---------------------------------------------------------------------------

export const KbArticleCreateSchema = z.object({
  Subject: z.string().min(1).max(500).describe('Article title/subject.'),
  Body: z.string().min(1).max(500000).describe('Article body content (HTML supported).'),
  Summary: z.string().max(2000).optional().describe('Short article summary.'),
  CategoryID: z.number().int().positive().optional().describe('KB category ID.'),
  IsPublished: z.boolean().optional().default(false).describe('Whether to publish the article immediately.'),
  Tags: z.string().max(1000).optional().describe('Comma-separated tags for the article.'),
});

export const KbArticleUpdateSchema = KbArticleCreateSchema.partial().extend({
  ArticleID: z.number().int().positive().describe('KB article ID to update.'),
});

// ---------------------------------------------------------------------------
// CI / CMDB search schema
// ---------------------------------------------------------------------------

export const CiSearchSchema = z.object({
  SearchText: z.string().max(500).optional().describe('Full-text search across CI fields.'),
  TypeIDs: z.array(z.number().int()).optional().describe('Filter by CI type IDs.'),
  OwnerUID: z.string().uuid().optional().describe('Filter by owner GUID.'),
  MaxResults: z.number().int().min(1).max(1000).optional().default(25).describe('Maximum results (1–1000).'),
});

// ---------------------------------------------------------------------------
// Custom attribute component IDs (TeamDynamix constants)
// ---------------------------------------------------------------------------

export const CustomAttributeComponentIdSchema = z
  .number()
  .int()
  .positive()
  .describe(
    'TeamDynamix component ID for the attribute context. Common values: 9 = Ticket, 27 = Asset, 63 = KB Article, 31 = Person.',
  );

// ---------------------------------------------------------------------------
// Project subdomain schemas
// ---------------------------------------------------------------------------

export const ProjectIssueCreateSchema = z.object({
  Title: z.string().min(1).max(500).describe('Issue title.'),
  Description: z.string().max(65535).optional().describe('Issue description.'),
  AssignedUID: z.string().uuid().optional().describe('GUID of the assigned user.'),
  StatusID: z.number().int().nonnegative().optional().describe('Issue status ID.'),
  PriorityID: z.number().int().nonnegative().optional().describe('Issue priority ID.'),
  DueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('Issue due date (ISO 8601).'),
});

export const ProjectRiskCreateSchema = z.object({
  Title: z.string().min(1).max(500).describe('Risk title.'),
  Description: z.string().max(65535).optional().describe('Risk description.'),
  AssignedUID: z.string().uuid().optional().describe('GUID of the risk owner.'),
  StatusID: z.number().int().nonnegative().optional().describe('Risk status ID.'),
  Probability: z.number().int().min(1).max(100).optional().describe('Probability percentage (1–100).'),
  Impact: z.number().int().min(1).max(5).optional().describe('Impact level (1 = low, 5 = critical).'),
  DueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .optional()
    .describe('Risk resolution due date (ISO 8601).'),
});

export const TimeEntryQuerySchema = z.object({
  StartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .describe('Start date for time entries query (ISO 8601 date, e.g. 2026-01-01).'),
  EndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/)
    .describe('End date for time entries query (ISO 8601 date, e.g. 2026-01-31).'),
});

// ---------------------------------------------------------------------------
// TeamDynamix Domain Response Schemas
// ---------------------------------------------------------------------------
// Runtime validation schemas for API responses. These ensure response structure
// integrity at runtime and provide clear error messages for malformed data.

/**
 * Base schema for TeamDynamix entities with flexible additional fields.
 */
export const TeamDynamixEntitySchema = z
  .record(z.string(), z.unknown())
  .describe('Base TeamDynamix entity with flexible additional fields');

/**
 * Named entity schema (ID + Name + any other fields).
 * Used for entities like Applications, Tickets, Assets, etc.
 */
export const TeamDynamixNamedEntitySchema = z
  .object({
    ID: z.number().int().positive('ID must be a positive integer'),
    Name: z.string().optional(),
  })
  .catchall(z.unknown())
  .describe('TeamDynamix entity with ID and optional Name');

/**
 * Application response schema.
 */
export const TeamDynamixApplicationSchema = TeamDynamixNamedEntitySchema.extend({
  Name: z.string().optional(),
}).describe('TeamDynamix Application entity');

/**
 * Ticket response schema.
 */
export const TeamDynamixTicketSchema = TeamDynamixNamedEntitySchema.extend({
  Title: z.string().optional(),
  Description: z.string().optional(),
  StatusID: z.number().int().optional(),
  TypeID: z.number().int().optional(),
}).describe('TeamDynamix Ticket entity');

/**
 * KB Article response schema.
 */
export const TeamDynamixKbArticleSchema = TeamDynamixNamedEntitySchema.extend({
  Subject: z.string().optional(),
  Body: z.string().optional(),
  IsPublished: z.boolean().optional(),
}).describe('TeamDynamix Knowledge Base Article entity');

/**
 * Asset response schema.
 */
export const TeamDynamixAssetSchema = TeamDynamixNamedEntitySchema.extend({
  Tag: z.string().optional(),
  StatusID: z.number().int().optional(),
}).describe('TeamDynamix Asset entity');

/**
 * Project response schema.
 */
export const TeamDynamixProjectSchema = TeamDynamixNamedEntitySchema.extend({
  Status: z.string().optional(),
}).describe('TeamDynamix Project entity');

/**
 * Group response schema.
 */
export const TeamDynamixGroupSchema = TeamDynamixNamedEntitySchema.extend({
  Description: z.string().optional(),
}).describe('TeamDynamix Group entity');

/**
 * User response schema.
 */
export const TeamDynamixUserSchema = z
  .object({
    UID: z.string({ error: 'User UID is required' }),
    FullName: z.string().optional(),
    Email: z.string().email().optional(),
    IsActive: z.boolean().optional(),
  })
  .catchall(z.unknown())
  .describe('TeamDynamix User entity');

/**
 * Generic array response schema (for list/search operations).
 */
export const TeamDynamixListResponseSchema = z
  .array(z.record(z.string(), z.unknown()))
  .describe('Array of TeamDynamix entities');

/**
 * Generic single response schema (for read/create/update operations).
 */
export const TeamDynamixSingleResponseSchema = z
  .record(z.string(), z.unknown())
  .describe('Single TeamDynamix entity response');
