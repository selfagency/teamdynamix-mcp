import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerTeamDynamixDiscoveryTools } from '../../src/tools/teamdynamix.discovery.tools.js';
import { registerTeamDynamixKbTools } from '../../src/tools/teamdynamix.kb.tools.js';
import { registerTeamDynamixTicketTools } from '../../src/tools/teamdynamix.tickets.tools.js';

function createTestServer() {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  registerTeamDynamixDiscoveryTools(server);
  registerTeamDynamixTicketTools(server);
  registerTeamDynamixKbTools(server);
  return server;
}

async function callTool(server: McpServer, name: string, args: Record<string, unknown>) {
  const tools = (server as any)._registeredTools as Record<
    string,
    { handler: (args: Record<string, unknown>) => Promise<unknown> }
  >;
  const tool = tools?.[name];
  if (!tool) {
    throw new Error(`Tool not registered: ${name}`);
  }
  return await tool.handler(args);
}

let server: McpServer;
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env['TEAMDYNAMIX_BASE_URL'] = 'https://example.teamdynamix.com/TDWebApi';
  process.env['TEAMDYNAMIX_AUTH_MODE'] = 'standard';
  process.env['TEAMDYNAMIX_USERNAME'] = 'demo@example.com';
  process.env['TEAMDYNAMIX_PASSWORD'] = 'secret';
  process.env['TEAMDYNAMIX_DEFAULT_TICKET_APP_ID'] = '123';
  process.env['TEAMDYNAMIX_ENABLE_WRITE_TOOLS'] = 'true';
  server = createTestServer();
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.assign(process.env, originalEnv);
});

describe('teamdynamix discovery tools', () => {
  it('returns sanitized server status', async () => {
    const result = (await callTool(server, 'teamdynamix_server_status', {
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.discoveryTools).toBeDefined();
  });

  it('loads the current TeamDynamix user', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ UID: '123', FullName: 'Demo User' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const result = (await callTool(server, 'teamdynamix_get_current_user', {
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.FullName).toBe('Demo User');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('lists TeamDynamix applications', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ ID: 1, Name: 'TDTickets' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const result = (await callTool(server, 'teamdynamix_list_applications', {
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.count).toBe(1);
  });

  it('lists ticket statuses for an application', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ ID: 10, Name: 'Open' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const result = (await callTool(server, 'teamdynamix_list_ticket_statuses', {
      app_id: 123,
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.appId).toBe(123);
    expect(result.structuredContent.count).toBe(1);
  });
});

describe('teamdynamix ticket tools', () => {
  function mockAuth() {
    return new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } });
  }

  function jsonResponse(data: unknown) {
    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  it('fetches a ticket by ID', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(jsonResponse({ ID: 9001, Title: 'Test ticket' }));

    const result = (await callTool(server, 'teamdynamix_get_ticket', {
      app_id: 123,
      ticket_id: 9001,
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.ID).toBe(9001);
  });

  it('searches tickets', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(jsonResponse([{ ID: 1 }, { ID: 2 }]));

    const result = (await callTool(server, 'teamdynamix_search_tickets', {
      app_id: 123,
      search: { Keywords: 'broken', MaxResults: 10 },
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.count).toBe(2);
  });

  it('creates a ticket', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(jsonResponse({ ID: 42, Title: 'New ticket', TypeID: 5 }));

    const result = (await callTool(server, 'teamdynamix_create_ticket', {
      app_id: 123,
      ticket: { TypeID: 5, Title: 'New ticket' },
      notify_requestor: false,
      notify_responsible: false,
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.ID).toBe(42);
  });

  it('adds a comment to a ticket', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(jsonResponse({ ID: 99, Body: 'Fixed.' }));

    const result = (await callTool(server, 'teamdynamix_add_ticket_comment', {
      app_id: 123,
      comment: { TicketID: 9001, Body: 'Fixed.' },
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.Body).toBe('Fixed.');
  });

  it('retrieves ticket feed', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(
        jsonResponse([
          { ID: 1, Body: 'Opened' },
          { ID: 2, Body: 'Updated' },
        ]),
      );

    const result = (await callTool(server, 'teamdynamix_get_ticket_feed', {
      app_id: 123,
      ticket_id: 9001,
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    const entries = result.structuredContent.entries as unknown[];
    expect(entries).toHaveLength(2);
  });

  it('lists ticket types', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(
        jsonResponse([
          { ID: 1, Name: 'Incident' },
          { ID: 2, Name: 'Request' },
        ]),
      );

    const result = (await callTool(server, 'teamdynamix_list_ticket_types', {
      app_id: 123,
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    const types = result.structuredContent.types as unknown[];
    expect(types).toHaveLength(2);
  });
});

describe('teamdynamix knowledge base tools', () => {
  function mockAuth() {
    return new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } });
  }

  function jsonResponse(data: unknown) {
    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  it('creates a KB article when write tools are enabled', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(jsonResponse({ ID: 3001, Subject: 'VPN Troubleshooting' }));

    const result = (await callTool(server, 'teamdynamix_create_kb_article', {
      app_id: 123,
      article: {
        Subject: 'VPN Troubleshooting',
        Body: '<p>Step-by-step guidance</p>',
        IsPublished: false,
      },
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.ID).toBe(3001);
  });

  it('updates a KB article when write tools are enabled', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockAuth())
      .mockResolvedValueOnce(jsonResponse({ ID: 3001, Subject: 'VPN Troubleshooting (Updated)' }));

    const result = (await callTool(server, 'teamdynamix_update_kb_article', {
      app_id: 123,
      article: {
        ArticleID: 3001,
        Subject: 'VPN Troubleshooting (Updated)',
      },
      response_format: 'json',
    })) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent.Subject).toBe('VPN Troubleshooting (Updated)');
  });
});
