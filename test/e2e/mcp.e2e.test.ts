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
    stdio: ['pipe', 'pipe', 'inherit'],
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

describe('MCP server E2E - template_ping', () => {
  it('responds with default message', async () => {
    const id = nextId();
    writeRequest(server, {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: 'template_ping',
        arguments: { message: 'pong' },
      },
    });

    const response = await waitForResponse(server, id);
    expect(response.error).toBeUndefined();
    const result = response.result as { content: Array<{ type: string; text: string }> };
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('pong');
  });
});

describe('MCP server E2E - tools/list', () => {
  it('returns utility tools', async () => {
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
    expect(names).toContain('template_ping');
    expect(names).toContain('echo');
    expect(names).toContain('text_transform');
    expect(names).toContain('current_time');
    expect(names).toContain('system_info');
  });
});

describe('MCP server E2E - tool invocation', () => {
  it('transforms text', async () => {
    const id = nextId();
    writeRequest(server, {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: 'text_transform',
        arguments: {
          text: 'hello template',
          mode: 'uppercase',
          response_format: 'json',
        },
      },
    });

    const response = await waitForResponse(server, id);
    expect(response.error).toBeUndefined();
    const result = response.result as { structuredContent: { transformed: string } };
    expect(result.structuredContent.transformed).toBe('HELLO TEMPLATE');
  });
});
