import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerUtilityTools } from '../../src/tools/utility.tools.js';

function createTestServer() {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  registerUtilityTools(server);
  return server;
}

async function callTool(server: McpServer, name: string, args: Record<string, unknown>) {
  const tools = (server as any)._registeredTools as Record<string, any>;
  const tool = tools?.[name];
  if (!tool) {
    throw new Error(`Tool not registered: ${name}`);
  }
  return await tool.handler(args, {} as any);
}

let server: McpServer;

beforeEach(() => {
  server = createTestServer();
});

describe('echo tool', () => {
  it('returns provided text', async () => {
    const result = await callTool(server, 'echo', { text: 'hello', response_format: 'json' });
    expect(result.content[0].type).toBe('text');
    expect(result.structuredContent.text).toBe('hello');
  });
});

describe('text_transform tool', () => {
  it('returns uppercase result', async () => {
    const result = await callTool(server, 'text_transform', {
      text: 'hello world',
      mode: 'uppercase',
      response_format: 'json',
    });
    expect(result.structuredContent.transformed).toBe('HELLO WORLD');
  });

  it('returns slug result', async () => {
    const result = await callTool(server, 'text_transform', {
      text: 'Hello, Template Server!',
      mode: 'slug',
      response_format: 'json',
    });
    expect(result.structuredContent.transformed).toBe('hello-template-server');
  });
});

describe('current_time tool', () => {
  it('returns current time fields', async () => {
    const result = await callTool(server, 'current_time', {
      time_zone: 'UTC',
      response_format: 'json',
    });
    expect(result.structuredContent.iso).toMatch(/Z$/);
    expect(result.structuredContent.timeZoneUsed).toBe('UTC');
  });
});

describe('system_info tool', () => {
  it('returns system details', async () => {
    const result = await callTool(server, 'system_info', { response_format: 'json' });
    expect(result.structuredContent.cpuCount).toBeGreaterThan(0);
    expect(String(result.structuredContent.nodeVersion)).toMatch(/^v/);
  });
});
