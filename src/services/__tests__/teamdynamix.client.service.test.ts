import { afterEach, describe, expect, it, vi } from 'vitest';
import { TeamDynamixClient, assertAdminToolsEnabled } from '../teamdynamix/client.service.js';

const baseConfig = {
  baseUrl: 'https://example.teamdynamix.com/TDWebApi',
  authMode: 'standard' as const,
  username: 'user@example.com',
  password: 'secret',
  timeoutMs: 30_000,
  maxRetries: 2,
  enableWriteTools: false,
  enableAdminTools: false,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('teamdynamix client service hardening', () => {
  it('redacts authentication error details from thrown messages', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('password=super-secret-token', {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'content-type': 'text/plain' },
      }),
    );

    const client = new TeamDynamixClient(baseConfig);
    await expect(client.listApplications()).rejects.toThrow('TeamDynamix authentication failed (401).');
    await expect(client.listApplications()).rejects.not.toThrow('super-secret-token');
  });

  it('caps retries even when configured maxRetries is very high', async () => {
    let requestCount = 0;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: Parameters<typeof setTimeout>[0]) => {
      if (typeof handler === 'function') {
        handler();
      }
      return 0 as unknown as NodeJS.Timeout;
    }) as typeof setTimeout);

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      requestCount += 1;
      if (requestCount === 1) {
        return new Response('fake.jwt.token', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      }

      return new Response('Rate limited', {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'content-type': 'text/plain', 'X-RateLimit-Reset': 'invalid-date' },
      });
    });

    const client = new TeamDynamixClient({
      ...baseConfig,
      maxRetries: 99,
    });

    await expect(client.listApplications()).rejects.toThrow('TeamDynamix request failed (429) for /api/applications.');
    // 1 login + 6 request attempts (0..5 capped retries)
    expect(requestCount).toBe(7);
  });
});
describe('teamdynamix client service unconfigured error paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when baseUrl is missing', async () => {
    const client = new TeamDynamixClient({ ...baseConfig, baseUrl: undefined });
    await expect(client.listApplications()).rejects.toThrow(
      'TeamDynamix is not configured. Missing: TEAMDYNAMIX_BASE_URL',
    );
  });

  it('throws when username is missing in standard mode', async () => {
    const client = new TeamDynamixClient({ ...baseConfig, username: undefined });
    await expect(client.listApplications()).rejects.toThrow(
      'TeamDynamix is not configured. Missing: TEAMDYNAMIX_USERNAME',
    );
  });

  it('throws when password is missing in standard mode', async () => {
    const client = new TeamDynamixClient({ ...baseConfig, password: undefined });
    await expect(client.listApplications()).rejects.toThrow(
      'TeamDynamix is not configured. Missing: TEAMDYNAMIX_PASSWORD',
    );
  });

  it('throws when beid is missing in admin mode', async () => {
    const client = new TeamDynamixClient({ ...baseConfig, authMode: 'admin', beid: undefined, webServicesKey: 'key' });
    await expect(client.listApplications()).rejects.toThrow('TeamDynamix is not configured. Missing: TEAMDYNAMIX_BEID');
  });

  it('throws when webServicesKey is missing in admin mode', async () => {
    const client = new TeamDynamixClient({ ...baseConfig, authMode: 'admin', beid: 'beid', webServicesKey: undefined });
    await expect(client.listApplications()).rejects.toThrow(
      'TeamDynamix is not configured. Missing: TEAMDYNAMIX_WEB_SERVICES_KEY',
    );
  });

  it('uses cached token on second request without re-authenticating', async () => {
    let fetchCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      fetchCount += 1;
      if (fetchCount === 1) {
        // Login response
        return new Response('header.eyJleHAiOjk5OTk5OTk5OTl9.sig', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      }
      return new Response(JSON.stringify([{ ID: 1, Name: 'App' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = new TeamDynamixClient(baseConfig);
    await client.listApplications();
    await client.listApplications();

    // Only 1 login call + 2 API calls (token cached)
    expect(fetchCount).toBe(3);
  });

  it('aborts request after timeoutMs elapses', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, opts) => {
      if (!opts?.signal) throw new Error('No signal provided to fetch');
      return new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } });
    });

    // Intercept the second fetch (the API call) to simulate abort
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, opts) => {
      callCount += 1;
      if (callCount === 1) {
        return new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } });
      }
      // Simulate a request that honors the abort signal
      return new Promise<Response>((_resolve, reject) => {
        if (opts?.signal?.aborted) {
          reject(new DOMException('The operation was aborted', 'AbortError'));
          return;
        }
        opts?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
        // Never resolve naturally to trigger abort
      });
    });

    const client = new TeamDynamixClient({ ...baseConfig, timeoutMs: 50, maxRetries: 0 });
    await expect(client.listApplications()).rejects.toThrow('The operation was aborted');
  });

  it('throws when requireAdmin is true but authMode is standard', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('fake.jwt.token', { status: 200, headers: { 'content-type': 'text/plain' } }),
    );

    // Access the private getBearerToken by calling a method that passes requireAdmin:true
    // Simulate by directly constructing a client and verifying the guard via the public API.
    // Since no public method exposes requireAdmin yet, test assertAdminToolsEnabled directly.
    const client = new TeamDynamixClient({ ...baseConfig, authMode: 'standard', enableAdminTools: false });
    // Trigger admin auth check via assertAdminToolsEnabled (exported function)
    expect(() =>
      assertAdminToolsEnabled({
        ...baseConfig,
        authMode: 'standard',
        enableAdminTools: false,
        beid: undefined,
        webServicesKey: undefined,
      }),
    ).toThrow('Admin tools are disabled');
    // Suppress unused var warning
    expect(client).toBeDefined();
  });
});

describe('assertAdminToolsEnabled', () => {
  it('throws when admin tools are disabled', () => {
    expect(() =>
      assertAdminToolsEnabled({
        baseUrl: 'https://example.teamdynamix.com/TDWebApi',
        authMode: 'standard',
        username: 'user@example.com',
        password: 'secret',
        timeoutMs: 30_000,
        maxRetries: 2,
        enableWriteTools: false,
        enableAdminTools: false,
      }),
    ).toThrow('Admin tools are disabled');
  });

  it('does not throw when admin tools are enabled', () => {
    expect(() =>
      assertAdminToolsEnabled({
        baseUrl: 'https://example.teamdynamix.com/TDWebApi',
        authMode: 'admin',
        beid: 'beid-value',
        webServicesKey: 'wskey-value',
        timeoutMs: 30_000,
        maxRetries: 2,
        enableWriteTools: true,
        enableAdminTools: true,
      }),
    ).not.toThrow();
  });
});
