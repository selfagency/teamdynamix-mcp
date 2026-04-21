import { describe, expect, it } from 'vitest';
import {
  TeamDynamixApplicationSchema,
  TeamDynamixKbArticleSchema,
  TeamDynamixListResponseSchema,
  TeamDynamixSingleResponseSchema,
  TeamDynamixTicketSchema,
  TeamDynamixUserSchema,
} from '../../schemas/index.js';
import {
  AssetSearchSchema,
  KbArticleCreateSchema,
  KbArticleSearchSchema,
  TicketCommentSchema,
  TicketCreateSchema,
  TicketSearchSchema,
  UserSearchSchema,
} from '../../schemas/teamdynamix/index.js';
import {
  TicketPatchSchema,
  TimeEntryQuerySchema,
  TicketTaskCreateSchema,
  ProjectIssueCreateSchema,
  ProjectRiskCreateSchema,
} from '../../schemas/teamdynamix/index.js';

describe('TeamDynamix Response Schemas', () => {
  describe('TeamDynamixApplicationSchema', () => {
    it('should validate a valid application response', () => {
      const validApp = {
        ID: 1,
        Name: 'IT Service Management',
      };
      expect(() => TeamDynamixApplicationSchema.parse(validApp)).not.toThrow();
    });

    it('should reject application with invalid ID', () => {
      const invalidApp = {
        ID: -1,
        Name: 'Invalid App',
      };
      expect(() => TeamDynamixApplicationSchema.parse(invalidApp)).toThrow('ID must be a positive integer');
    });

    it('should reject application with missing ID', () => {
      const noIdApp = {
        Name: 'No ID App',
      };
      expect(() => TeamDynamixApplicationSchema.parse(noIdApp)).toThrow('expected number');
    });

    it('should allow additional fields', () => {
      const appWithExtra = {
        ID: 1,
        Name: 'Test App',
        ExtraField: 'extra value',
        AnotherField: 123,
      };
      expect(() => TeamDynamixApplicationSchema.parse(appWithExtra)).not.toThrow();
    });
  });

  describe('TeamDynamixTicketSchema', () => {
    it('should validate a valid ticket response', () => {
      const validTicket = {
        ID: 42,
        Title: 'Test Ticket',
        Description: 'A test ticket',
        StatusID: 1,
      };
      expect(() => TeamDynamixTicketSchema.parse(validTicket)).not.toThrow();
    });

    it('should allow ticket with minimal fields', () => {
      const minimalTicket = {
        ID: 42,
      };
      expect(() => TeamDynamixTicketSchema.parse(minimalTicket)).not.toThrow();
    });

    it('should reject ticket with non-integer ID', () => {
      const invalidTicket = {
        ID: 'not-a-number',
        Title: 'Bad Ticket',
      };
      expect(() => TeamDynamixTicketSchema.parse(invalidTicket)).toThrow('expected number');
    });
  });

  describe('TeamDynamixKbArticleSchema', () => {
    it('should validate a valid KB article response', () => {
      const validArticle = {
        ID: 100,
        Subject: 'How to Reset Password',
        Body: 'Follow these steps...',
        IsPublished: true,
      };
      expect(() => TeamDynamixKbArticleSchema.parse(validArticle)).not.toThrow();
    });

    it('should allow article with optional fields omitted', () => {
      const minimalArticle = {
        ID: 100,
      };
      expect(() => TeamDynamixKbArticleSchema.parse(minimalArticle)).not.toThrow();
    });
  });

  describe('TeamDynamixUserSchema', () => {
    it('should validate a valid user response', () => {
      const validUser = {
        UID: 'user123',
        FullName: 'John Doe',
        Email: 'john@example.com',
        IsActive: true,
      };
      expect(() => TeamDynamixUserSchema.parse(validUser)).not.toThrow();
    });

    it('should reject user with missing UID', () => {
      const noUidUser = {
        FullName: 'Jane Doe',
        Email: 'jane@example.com',
      };
      expect(() => TeamDynamixUserSchema.parse(noUidUser)).toThrow('required');
    });

    it('should reject user with invalid email format', () => {
      const invalidEmailUser = {
        UID: 'user456',
        Email: 'not-an-email',
      };
      expect(() => TeamDynamixUserSchema.parse(invalidEmailUser)).toThrow('Invalid email');
    });

    it('should allow user with minimal fields', () => {
      const minimalUser = {
        UID: 'user789',
      };
      expect(() => TeamDynamixUserSchema.parse(minimalUser)).not.toThrow();
    });
  });

  describe('TeamDynamixListResponseSchema', () => {
    it('should validate an array of entities', () => {
      const list = [
        { ID: 1, Name: 'Entity 1' },
        { ID: 2, Name: 'Entity 2' },
        { ID: 3, Name: 'Entity 3' },
      ];
      expect(() => TeamDynamixListResponseSchema.parse(list)).not.toThrow();
    });

    it('should validate an empty array', () => {
      const emptyList: unknown[] = [];
      expect(() => TeamDynamixListResponseSchema.parse(emptyList)).not.toThrow();
    });

    it('should reject non-array responses', () => {
      const notArray = { ID: 1, Name: 'Single Entity' };
      expect(() => TeamDynamixListResponseSchema.parse(notArray)).toThrow('expected array');
    });

    it('should allow arrays with mixed field schemas', () => {
      const mixedList = [{ ID: 1, Name: 'Entity A', ExtraField: 'value' }, { ID: 2, CustomField: 'data' }, { ID: 3 }];
      expect(() => TeamDynamixListResponseSchema.parse(mixedList)).not.toThrow();
    });
  });

  describe('TeamDynamixSingleResponseSchema', () => {
    it('should validate a single entity object', () => {
      const entity = {
        ID: 1,
        Name: 'Test Entity',
        Description: 'A test',
      };
      expect(() => TeamDynamixSingleResponseSchema.parse(entity)).not.toThrow();
    });

    it('should validate an empty object', () => {
      const emptyEntity = {};
      expect(() => TeamDynamixSingleResponseSchema.parse(emptyEntity)).not.toThrow();
    });

    it('should reject non-object responses', () => {
      const notObject = ['should', 'be', 'object'];
      expect(() => TeamDynamixSingleResponseSchema.parse(notObject)).toThrow('expected record');
    });

    it('should reject null as single response', () => {
      expect(() => TeamDynamixSingleResponseSchema.parse(null)).toThrow('expected record');
    });

    it('should allow objects with any field types', () => {
      const complexEntity = {
        ID: 1,
        StringField: 'value',
        NumberField: 42,
        BooleanField: true,
        ArrayField: [1, 2, 3],
        ObjectField: { nested: 'value' },
        NullField: null,
      };
      expect(() => TeamDynamixSingleResponseSchema.parse(complexEntity)).not.toThrow();
    });
  });
});

describe('TeamDynamix Input Schema Bounds', () => {
  describe('TicketSearchSchema', () => {
    it('accepts a valid search payload', () => {
      expect(() => TicketSearchSchema.parse({ Keywords: 'printer', MaxResults: 10 })).not.toThrow();
    });

    it('rejects Keywords exceeding 500 characters', () => {
      expect(() => TicketSearchSchema.parse({ Keywords: 'a'.repeat(501) })).toThrow();
    });

    it('accepts Keywords at exactly the 500-character limit', () => {
      expect(() => TicketSearchSchema.parse({ Keywords: 'a'.repeat(500) })).not.toThrow();
    });
  });

  describe('TicketCreateSchema', () => {
    const base = { TypeID: 1, Title: 'Test ticket' };

    it('accepts a valid create payload', () => {
      expect(() => TicketCreateSchema.parse(base)).not.toThrow();
    });

    it('rejects Title exceeding 500 characters', () => {
      expect(() => TicketCreateSchema.parse({ ...base, Title: 'x'.repeat(501) })).toThrow();
    });

    it('accepts Title at exactly the 500-character limit', () => {
      expect(() => TicketCreateSchema.parse({ ...base, Title: 'x'.repeat(500) })).not.toThrow();
    });

    it('rejects Description exceeding 65535 characters', () => {
      expect(() => TicketCreateSchema.parse({ ...base, Description: 'x'.repeat(65536) })).toThrow();
    });

    it('accepts Description at the limit', () => {
      expect(() => TicketCreateSchema.parse({ ...base, Description: 'x'.repeat(65535) })).not.toThrow();
    });
  });

  describe('TicketCommentSchema', () => {
    it('rejects Body exceeding 65535 characters', () => {
      expect(() => TicketCommentSchema.parse({ TicketID: 1, Body: 'x'.repeat(65536) })).toThrow();
    });

    it('accepts Body at the limit', () => {
      expect(() => TicketCommentSchema.parse({ TicketID: 1, Body: 'x'.repeat(65535) })).not.toThrow();
    });
  });

  describe('UserSearchSchema', () => {
    it('rejects SearchText exceeding 500 characters', () => {
      expect(() => UserSearchSchema.parse({ SearchText: 'a'.repeat(501) })).toThrow();
    });

    it('accepts SearchText at the limit', () => {
      expect(() => UserSearchSchema.parse({ SearchText: 'a'.repeat(500) })).not.toThrow();
    });
  });

  describe('KbArticleSearchSchema', () => {
    it('rejects SearchText exceeding 500 characters', () => {
      expect(() => KbArticleSearchSchema.parse({ SearchText: 'x'.repeat(501) })).toThrow();
    });
  });

  describe('KbArticleCreateSchema', () => {
    const base = { Subject: 'How to reset password', Body: '<p>Steps here</p>' };

    it('accepts a valid article payload', () => {
      expect(() => KbArticleCreateSchema.parse(base)).not.toThrow();
    });

    it('rejects Subject exceeding 500 characters', () => {
      expect(() => KbArticleCreateSchema.parse({ ...base, Subject: 'x'.repeat(501) })).toThrow();
    });

    it('rejects Body exceeding 500000 characters', () => {
      expect(() => KbArticleCreateSchema.parse({ ...base, Body: 'x'.repeat(500001) })).toThrow();
    });

    it('rejects Summary exceeding 2000 characters', () => {
      expect(() => KbArticleCreateSchema.parse({ ...base, Summary: 'x'.repeat(2001) })).toThrow();
    });

    it('rejects Tags exceeding 1000 characters', () => {
      expect(() => KbArticleCreateSchema.parse({ ...base, Tags: 'x'.repeat(1001) })).toThrow();
    });
  });

  describe('AssetSearchSchema', () => {
    it('rejects SerialLike exceeding 200 characters', () => {
      expect(() => AssetSearchSchema.parse({ SerialLike: 'x'.repeat(201) })).toThrow();
    });

    it('rejects TagLike exceeding 200 characters', () => {
      expect(() => AssetSearchSchema.parse({ TagLike: 'x'.repeat(201) })).toThrow();
    });

    it('rejects SearchText exceeding 500 characters', () => {
      expect(() => AssetSearchSchema.parse({ SearchText: 'x'.repeat(501) })).toThrow();
    });

    it('accepts valid asset search payload', () => {
      expect(() => AssetSearchSchema.parse({ SerialLike: 'SN123', TagLike: 'ASSET-001' })).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// Security regression tests
// ---------------------------------------------------------------------------

describe('Security: TicketPatchSchema.Attributes bounds', () => {
  it('accepts a valid Attributes map (≤50 keys, keys ≤100 chars, values ≤65535 chars)', () => {
    const attrs = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`Field${i}`, 'value']));
    expect(() => TicketPatchSchema.parse({ TicketID: 1, Attributes: attrs })).not.toThrow();
  });

  it('rejects Attributes map with more than 50 keys (DoS PoC)', () => {
    const attrs = Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`Field${i}`, 'value']));
    expect(() => TicketPatchSchema.parse({ TicketID: 1, Attributes: attrs })).toThrow();
  });

  it('rejects Attributes with a key longer than 100 characters', () => {
    const attrs = { ['k'.repeat(101)]: 'value' };
    expect(() => TicketPatchSchema.parse({ TicketID: 1, Attributes: attrs })).toThrow();
  });

  it('rejects Attributes with a value longer than 65535 characters', () => {
    const attrs = { StatusID: 'x'.repeat(65536) };
    expect(() => TicketPatchSchema.parse({ TicketID: 1, Attributes: attrs })).toThrow();
  });

  it('rejects a 500-key oversized map with long keys and values (original PoC)', () => {
    const attrs = Object.fromEntries(
      Array.from({ length: 500 }, (_, i) => [`FIELD_${String(i).padStart(4, '0')}`, 'x'.repeat(100)]),
    );
    expect(() => TicketPatchSchema.parse({ TicketID: 1, Attributes: attrs })).toThrow();
  });
});

describe('Security: ISO 8601 date field validation', () => {
  it('TicketSearchSchema accepts valid ISO date strings', () => {
    expect(() =>
      TicketSearchSchema.parse({ CreatedDateFrom: '2026-01-01', CreatedDateTo: '2026-12-31T23:59:59Z' }),
    ).not.toThrow();
  });

  it('TicketSearchSchema rejects arbitrary strings as dates', () => {
    expect(() => TicketSearchSchema.parse({ CreatedDateFrom: 'not-a-date' })).toThrow();
  });

  it('TicketSearchSchema rejects injection-style strings', () => {
    expect(() => TicketSearchSchema.parse({ ModifiedDateFrom: "'; DROP TABLE tickets;--" })).toThrow();
  });

  it('TicketTaskCreateSchema accepts valid ISO date', () => {
    expect(() =>
      TicketTaskCreateSchema.parse({ TicketID: 1, Title: 'Task', StartDate: '2026-01-15', EndDate: '2026-02-01' }),
    ).not.toThrow();
  });

  it('TicketTaskCreateSchema rejects invalid date strings', () => {
    expect(() => TicketTaskCreateSchema.parse({ TicketID: 1, Title: 'Task', StartDate: 'tomorrow' })).toThrow();
  });

  it('ProjectIssueCreateSchema rejects invalid DueDate', () => {
    expect(() => ProjectIssueCreateSchema.parse({ Title: 'Issue', DueDate: 'next week' })).toThrow();
  });

  it('ProjectRiskCreateSchema rejects invalid DueDate', () => {
    expect(() => ProjectRiskCreateSchema.parse({ Title: 'Risk', DueDate: 'asap' })).toThrow();
  });

  it('TimeEntryQuerySchema accepts valid ISO dates', () => {
    expect(() => TimeEntryQuerySchema.parse({ StartDate: '2026-01-01', EndDate: '2026-01-31' })).not.toThrow();
  });

  it('TimeEntryQuerySchema rejects non-ISO date strings', () => {
    expect(() => TimeEntryQuerySchema.parse({ StartDate: 'January 1 2026', EndDate: '2026-01-31' })).toThrow();
  });
});
