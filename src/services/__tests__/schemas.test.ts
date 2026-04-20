import { describe, it, expect } from 'vitest';
import {
  TeamDynamixApplicationSchema,
  TeamDynamixTicketSchema,
  TeamDynamixKbArticleSchema,
  TeamDynamixListResponseSchema,
  TeamDynamixSingleResponseSchema,
  TeamDynamixUserSchema,
} from '../../schemas/index.js';

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
      expect(() => TeamDynamixApplicationSchema.parse(noIdApp)).toThrow('Required');
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
      expect(() => TeamDynamixTicketSchema.parse(invalidTicket)).toThrow('Expected number');
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
      expect(() => TeamDynamixListResponseSchema.parse(notArray)).toThrow('Expected array');
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
      expect(() => TeamDynamixSingleResponseSchema.parse(notObject)).toThrow('Expected object');
    });

    it('should reject null as single response', () => {
      expect(() => TeamDynamixSingleResponseSchema.parse(null)).toThrow('Expected object');
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
