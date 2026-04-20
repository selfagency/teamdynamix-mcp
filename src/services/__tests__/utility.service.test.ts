import { describe, expect, it } from 'vitest';
import { getCurrentTime, getSystemInfo, transformText } from '../utility.service.js';

describe('utility.service', () => {
  it('transforms text to uppercase', () => {
    const result = transformText('hello world', 'uppercase');
    expect(result.transformed).toBe('HELLO WORLD');
  });

  it('transforms text to slug', () => {
    const result = transformText('  Hello, MCP Template!  ', 'slug');
    expect(result.transformed).toBe('hello-mcp-template');
  });

  it('returns current time with iso and locale values', () => {
    const result = getCurrentTime('UTC');
    expect(result.iso).toMatch(/Z$/);
    expect(result.timeZoneUsed).toBe('UTC');
    expect(result.locale.length).toBeGreaterThan(0);
  });

  it('returns system info with expected fields', () => {
    const result = getSystemInfo();
    expect(result.cpuCount).toBeGreaterThan(0);
    expect(result.nodeVersion).toMatch(/^v/);
    expect(result.memoryTotalBytes).toBeGreaterThan(0);
  });
});
