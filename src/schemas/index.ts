import { z } from 'zod';

export const ResponseFormatSchema = z
  .enum(['markdown', 'json'])
  .default('markdown')
  .describe('Output format for the response.');

export const TextTransformModeSchema = z
  .enum(['uppercase', 'lowercase', 'trim', 'slug'])
  .describe('Transformation mode to apply to the input text.');

// Export TeamDynamix domain response schemas from teamdynamix subdirectory
export {
  TeamDynamixApplicationSchema,
  TeamDynamixAssetSchema,
  TeamDynamixEntitySchema,
  TeamDynamixGroupSchema,
  TeamDynamixKbArticleSchema,
  TeamDynamixListResponseSchema,
  TeamDynamixNamedEntitySchema,
  TeamDynamixProjectSchema,
  TeamDynamixSingleResponseSchema,
  TeamDynamixTicketSchema,
  TeamDynamixUserSchema,
} from './teamdynamix/index.js';
