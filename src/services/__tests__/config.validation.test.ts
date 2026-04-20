import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getTeamDynamixConfig } from '../../config.js';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env['TEAMDYNAMIX_BASE_URL'] = 'https://example.teamdynamix.com/TDWebApi';
  process.env['TEAMDYNAMIX_AUTH_MODE'] = 'standard';
  process.env['TEAMDYNAMIX_USERNAME'] = 'demo@example.com';
  process.env['TEAMDYNAMIX_PASSWORD'] = 'secret';
  process.env['TEAMDYNAMIX_MAX_RETRIES'] = '2';
});

afterEach(() => {
  Object.assign(process.env, originalEnv);
});

describe('config validation hardening', () => {
  it('rejects non-https TEAMDYNAMIX_BASE_URL', () => {
    process.env['TEAMDYNAMIX_BASE_URL'] = 'http://example.teamdynamix.com/TDWebApi';
    expect(() => getTeamDynamixConfig()).toThrow('TEAMDYNAMIX_BASE_URL must be an https URL.');
  });

  it('rejects TEAMDYNAMIX_MAX_RETRIES greater than 5', () => {
    process.env['TEAMDYNAMIX_MAX_RETRIES'] = '6';
    expect(() => getTeamDynamixConfig()).toThrow('TEAMDYNAMIX_MAX_RETRIES must be between 0 and 5.');
  });

  it('accepts valid https base url and bounded retries', () => {
    process.env['TEAMDYNAMIX_BASE_URL'] = 'https://example.teamdynamix.com/TDWebApi';
    process.env['TEAMDYNAMIX_MAX_RETRIES'] = '5';

    const config = getTeamDynamixConfig();
    expect(config.baseUrl).toBe('https://example.teamdynamix.com/TDWebApi');
    expect(config.maxRetries).toBe(5);
  });
});
