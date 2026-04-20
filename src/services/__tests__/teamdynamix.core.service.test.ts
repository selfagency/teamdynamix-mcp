import { describe, expect, it } from 'vitest';
import {
  buildTeamDynamixJsonPatchDocument,
  decodeJwtExpiryEpochSeconds,
  parseRateLimit,
  redactTeamDynamixConfig,
  toTeamDynamixDateOnly,
  toTeamDynamixDateTime,
} from '../teamdynamix/core.service.js';

describe('teamdynamix core service', () => {
  it('serializes UTC datetime values', () => {
    expect(toTeamDynamixDateTime('2026-04-20T12:34:56-04:00')).toBe('2026-04-20T16:34:56.000Z');
  });

  it('serializes date-only values', () => {
    expect(toTeamDynamixDateOnly('2026-04-20T12:34:56Z')).toBe('2026-04-20');
  });

  it('builds normalized TeamDynamix JSON Patch documents', () => {
    expect(
      buildTeamDynamixJsonPatchDocument([
        { op: 'add', path: 'Title', value: 'Updated Title' },
        { op: 'remove', path: '/Attributes/1234' },
      ]),
    ).toEqual([
      { op: 'add', path: '/title', value: 'Updated Title' },
      { op: 'remove', path: '/attributes/1234' },
    ]);
  });

  it('parses TeamDynamix rate limit headers', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': '10',
      'X-RateLimit-Reset': 'Tue, 20 Apr 2026 12:00:10 GMT',
    });

    const rateLimit = parseRateLimit(headers, Date.parse('Tue, 20 Apr 2026 12:00:00 GMT'));
    expect(rateLimit.limit).toBe(60);
    expect(rateLimit.remaining).toBe(10);
    expect(rateLimit.waitMs).toBe(10_000);
  });

  it('uses minimum wait when reset header is invalid', () => {
    const headers = new Headers({
      'X-RateLimit-Reset': 'not-a-date',
    });

    const rateLimit = parseRateLimit(headers, Date.parse('Tue, 20 Apr 2026 12:00:00 GMT'));
    expect(rateLimit.waitMs).toBe(5_000);
  });

  it('caps maximum wait for far future reset headers', () => {
    const headers = new Headers({
      'X-RateLimit-Reset': 'Tue, 20 Apr 2026 12:10:00 GMT',
    });

    const rateLimit = parseRateLimit(headers, Date.parse('Tue, 20 Apr 2026 12:00:00 GMT'));
    expect(rateLimit.waitMs).toBe(30_000);
  });

  it('redacts sensitive TeamDynamix config values', () => {
    const redacted = redactTeamDynamixConfig({
      baseUrl: 'https://example.teamdynamix.com/TDWebApi',
      authMode: 'admin',
      username: 'demo',
      password: 'secret',
      beid: 'beid',
      webServicesKey: 'key',
      timeoutMs: 30_000,
      maxRetries: 2,
      enableWriteTools: false,
      enableAdminTools: true,
    });

    expect(redacted.password).toBe('[configured]');
    expect(redacted.webServicesKey).toBe('[configured]');
  });

  it('decodes JWT expiry claim when present', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'eyJleHAiOjE5MDAwMDAwMDAsInN1YiI6InRlc3QifQ.' + 'signature';

    expect(decodeJwtExpiryEpochSeconds(token)).toBe(1_900_000_000);
  });
});
