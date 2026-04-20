import { afterEach, describe, expect, it, vi } from 'vitest';
import { TeamDynamixClient } from '../teamdynamix/client.service.js';

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
