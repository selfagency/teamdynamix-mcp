import { describe, expect, it } from 'vitest';
import { createMcpSdkClient } from '../sdk-client.factory.js';

// These are integration tests that require network access to a TeamDynamix instance.
// They verify the SDK client can be created and has the expected shape.
// Skip by default — run with `pnpm test:integration` against a real instance.

describe.runIf(!!process.env['TEAMDYNAMIX_BASE_URL'])('SDK Client Factory', () => {
  it('should create a scoped client instance', async () => {
    const config = {
      baseUrl: process.env['TEAMDYNAMIX_BASE_URL']!,
      authMode: (process.env['TEAMDYNAMIX_AUTH_MODE'] as 'standard' | 'admin') ?? 'standard',
      username: process.env['TEAMDYNAMIX_USERNAME'],
      password: process.env['TEAMDYNAMIX_PASSWORD'],
      beid: process.env['TEAMDYNAMIX_BEID'],
      webServicesKey: process.env['TEAMDYNAMIX_WEB_SERVICES_KEY'],
      timeoutMs: 30_000,
      maxRetries: 3,
      enableWriteTools: false,
      enableAdminTools: false,
    };

    const client = await createMcpSdkClient(config);

    expect(client).toBeDefined();
    expect(typeof client.discovery).toBe('object');
    expect(typeof client.tickets).toBe('object');
    expect(typeof client.referenceData).toBe('object');
    expect(typeof client.helpers).toBe('object');
    expect(typeof client.registry).toBe('object');
  });

  it('should resolve ticket lookup context', async () => {
    const config = {
      baseUrl: process.env['TEAMDYNAMIX_BASE_URL']!,
      authMode: (process.env['TEAMDYNAMIX_AUTH_MODE'] as 'standard' | 'admin') ?? 'standard',
      username: process.env['TEAMDYNAMIX_USERNAME'],
      password: process.env['TEAMDYNAMIX_PASSWORD'],
      beid: process.env['TEAMDYNAMIX_BEID'],
      webServicesKey: process.env['TEAMDYNAMIX_WEB_SERVICES_KEY'],
      timeoutMs: 30_000,
      maxRetries: 3,
      enableWriteTools: false,
      enableAdminTools: false,
    };

    const client = await createMcpSdkClient(config);
    const context = await client.helpers.resolveTicketLookupContext({
      appId: 0, // Will fail without real appId, but tests the plumbing
    });

    expect(context).toBeDefined();
  });
});
