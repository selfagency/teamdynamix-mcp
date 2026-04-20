import { ChildProcess, spawn } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function writeRequest(child: ChildProcess, request: JsonRpcRequest): void {
  child.stdin!.write(JSON.stringify(request) + '\n');
}

function waitForResponse(child: ChildProcess, id: number, timeoutMs = 8000): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for response id=${id}`)), timeoutMs);

    function onData(chunk: Buffer) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let parsed: unknown;
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          continue;
        }
        const response = parsed as JsonRpcResponse;
        if (response && response.id === id) {
          clearTimeout(timer);
          child.stdout!.off('data', onData);
          resolve(response);
        }
      }
    }

    child.stdout!.on('data', onData);
  });
}

let server: ChildProcess;
let requestId = 1;

function nextId() {
  return requestId++;
}

beforeAll(async () => {
  server = spawn('node', ['--import', 'tsx/esm', 'src/index.ts'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const initId = nextId();
  writeRequest(server, {
    jsonrpc: '2.0',
    id: initId,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '0.0.0' },
    },
  });

  const initResponse = await waitForResponse(server, initId);
  if (initResponse.error) {
    throw new Error(`initialize failed: ${initResponse.error.message}`);
  }
}, 15000);

afterAll(() => {
  server?.kill('SIGTERM');
});

describe('MCP server E2E - tools/list', () => {
  it('exposes TeamDynamix tool surface', async () => {
    const id = nextId();
    writeRequest(server, {
      jsonrpc: '2.0',
      id,
      method: 'tools/list',
      params: {},
    });

    const response = await waitForResponse(server, id);
    expect(response.error).toBeUndefined();
    const result = response.result as { tools: Array<{ name: string }> };
    const names = result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain('teamdynamix_discovery');
    expect(names).toContain('teamdynamix_tickets');
    expect(names).toContain('teamdynamix_ticket_relationships');
    expect(names).toContain('teamdynamix_people');
    expect(names).toContain('teamdynamix_knowledge_base');
    expect(names).toContain('teamdynamix_assets');
    expect(names).toContain('teamdynamix_cmdb');
    expect(names).toContain('teamdynamix_services');
    expect(names).toContain('teamdynamix_projects');
    expect(names).toContain('teamdynamix_time');
    expect(names).toContain('teamdynamix_reference_data');
  });
});

describe('MCP server E2E - teamdynamix_discovery server_status action', () => {
  it('returns status even when not configured', async () => {
    const id = nextId();
    writeRequest(server, {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: 'teamdynamix_discovery',
        arguments: {
          action: 'server_status',
          payload: {},
          response_format: 'json',
        },
      },
    });

    const response = await waitForResponse(server, id);
    expect(response.error).toBeUndefined();
    const result = response.result as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text) as { gateway: string; actions: unknown };
    expect(parsed.gateway).toBe('discovery');
    expect(parsed.actions).toBeDefined();
  });
});

describe('MCP server E2E - debug log redaction', () => {
  it('does not print raw credentials in debug startup logs', async () => {
    let debugStderr = '';
    const debugServer = spawn('node', ['--import', 'tsx/esm', 'src/index.ts'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_LOG_LEVEL: 'debug',
        TEAMDYNAMIX_BASE_URL: 'https://example.teamdynamix.com/TDWebApi',
        TEAMDYNAMIX_AUTH_MODE: 'standard',
        TEAMDYNAMIX_USERNAME: 'demo@example.com',
        TEAMDYNAMIX_PASSWORD: 'very-secret-password',
      },
    });

    debugServer.stderr?.on('data', (chunk: Buffer) => {
      debugStderr += chunk.toString();
    });

    const id = 10001;
    writeRequest(debugServer, {
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '0.0.0' },
      },
    });

    const initResponse = await waitForResponse(debugServer, id);
    expect(initResponse.error).toBeUndefined();

    await new Promise(resolve => setTimeout(resolve, 30));
    debugServer.kill('SIGTERM');

    expect(debugStderr).toContain('[teamdynamix-mcp] sanitized config:');
    expect(debugStderr).toContain('[configured]');
    expect(debugStderr).not.toContain('very-secret-password');
  });
});
