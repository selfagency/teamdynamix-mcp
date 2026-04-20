import { z } from 'zod';

export const BasePathSchema = z
  .string()
  .min(1)
  .optional()
  .describe(
    'Absolute path for tool operations. ' +
      'If omitted, falls back to the server default set via MCP_BASE_PATH or --base-path.',
  );

export const TextSchema = z.string().min(1, 'text is required').max(20_000);

export const PaginationSchema = z
  .object({
    limit: z.number().int().min(1).max(200).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .strict();

export const ConfirmSchema = z.boolean().default(false);

export const ResponseFormatSchema = z
  .enum(['markdown', 'json'])
  .default('markdown')
  .describe('Output format for the response.');

export const TextTransformModeSchema = z
  .enum(['uppercase', 'lowercase', 'trim', 'slug'])
  .describe('Transformation mode to apply to the input text.');
