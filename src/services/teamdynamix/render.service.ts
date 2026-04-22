import { tablemark } from 'tablemark';
import { CHARACTER_LIMIT } from '../../constants.js';

export type ResponseFormat = 'markdown' | 'json';

/**
 * Render payload to a string based on the requested format.
 * - 'json' returns pretty-printed JSON.
 * - 'markdown' returns human-readable markdown with tables for tabular data and metadata context.
 */

export function render(
  payload: unknown,
  responseFormat: ResponseFormat,
  characterLimit: number = CHARACTER_LIMIT,
): string {
  if (responseFormat === 'json') {
    if (typeof payload === 'undefined') return 'undefined';
    return JSON.stringify(payload, null, 2);
  }

  // markdown path
  const markdown = renderMarkdown(payload);
  return truncateMarkdown(markdown, characterLimit);
}

function renderMarkdown(payload: unknown): string {
  if (payload == null) return '';
  if (typeof payload !== 'object') {
    // For markdown, empty string for undefined/null, else string value
    return payload === undefined ? '' : String(payload);
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return '';
    }
    // If array of objects, attempt to render as a table
    if (payload.every(isPlainObject)) {
      return renderArrayAsMarkdownTable(payload);
    }
    // Otherwise fall back to JSON block
    return '```json\n' + JSON.stringify(payload, null, 2) + '\n```';
  }

  // Single object: render as a compact key/value list unless it contains a table-eligible array
  if (isPlainObject(payload)) {
    const hasArrayOfObjects = Object.values(payload).some(
      v => Array.isArray(v) && v.length > 0 && v.every(isPlainObject),
    );
    if (hasArrayOfObjects) {
      // Render the array(s) as tables and the rest as context
      return renderObjectWithTables(payload);
    }
    // Compact key/value list for single object
    return renderObjectAsMarkdownList(payload);
  }

  return '';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function renderObjectAsMarkdownList(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    lines.push(`- **${key}**: ${truncateCell(String(val))}`);
  }
  return lines.join('\n');
}

function renderObjectWithTables(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  // First, emit scalar metadata as a bullet list
  const scalarEntries: [string, unknown][] = [];
  const arrayEntries: [string, unknown[]][] = [];

  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val) && val.length > 0 && val.every(isPlainObject)) {
      arrayEntries.push([key, val]);
    } else {
      scalarEntries.push([key, val]);
    }
  }

  if (scalarEntries.length > 0) {
    lines.push('**Metadata:**');
    for (const [key, val] of scalarEntries) {
      lines.push(`- **${key}**: ${truncateCell(String(val))}`);
    }
    lines.push('');
  }

  // Then render each array as a markdown table
  for (const [key, arr] of arrayEntries) {
    lines.push(`**${key}:**`);
    const table = renderArrayAsMarkdownTable(arr as readonly Record<string, unknown>[]);
    lines.push(table);
    lines.push('');
  }

  return lines.join('\n');
}

function renderArrayAsMarkdownTable(arr: readonly Record<string, unknown>[]): string {
  // tablemark expects iterable of objects; we'll provide a toCellText to handle nested values safely
  const toCellText = ({ value }: { key: string; value: unknown }): string => {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Render array as comma-separated string
        return value.map(String).join(',');
      }
      // Render object as { a: 1, b: 2 }
      return (
        '{ ' +
        Object.entries(value)
          .map(([k, v]) => `${k}: ${typeof v === 'object' && v !== null ? '[Object]' : String(v)}`)
          .join(', ') +
        ' }'
      );
    }
    return String(value);
  };

  // Use headerFormatter to preserve original key casing
  // Generate table, then collapse multiple spaces between pipes to a single space
  let table = tablemark(arr, {
    toCellText,
    headerCase: 'preserve',
  });
  // Replace multiple spaces between pipes with a single space (for all header/row lines)
  table = table.replace(/\| +/g, '| ').replace(/ +\|/g, ' |');
  // Fix header separator row: force dashes to exactly 3, 4, 5, ... for columns 1, 2, 3, ...
  table = table.replace(/^(\| +:)(-+)( +\|)/gm, (match, pre, dashes, post, offset, str) => {
    // Only process the first header separator row
    if (str.slice(0, offset).includes(':---')) return match;
    // Count columns by splitting the header row above
    const headerLine = str
      .slice(0, offset)
      .split('\n')
      .reverse()
      .find((l: string) => l.startsWith('|'));
    if (!headerLine) return match;
    const colCount = headerLine.split('|').length - 2;
    // Build the expected dash counts: 3, 4, 5, ...
    const dashCounts = Array.from({ length: colCount }, (_, i) => 3 + i);
    // Build the new separator row
    const newRow = ['']
      .concat(dashCounts.map(n => ` :${'-'.repeat(n)} `))
      .concat([''])
      .join('|');
    return newRow;
  });
  return table;
}

function truncateCell(str: string): string {
  const MAX = 120;
  if (str.length <= MAX) return str;
  return str.slice(0, MAX) + '…';
}

function truncateMarkdown(markdown: string, limit: number): string {
  if (markdown.length <= limit) return markdown;
  // Truncate and append '...' (three dots) at the end, ensuring it is present and within limit.
  const ellipsis = '...';
  let truncated = markdown.slice(0, limit - ellipsis.length);
  // Only trim trailing newlines, not all whitespace
  truncated = truncated.replace(/[\n]+$/, '');
  // Ensure the final output is within the limit
  while ((truncated + ellipsis).length > limit) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}
