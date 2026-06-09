import { loginWithPassword, loginWithServiceAccount, createTokenProviderFromJWT } from '@selfagency/teamdynamix-ts';
import type { TeamDynamixConfig } from '../types.js';

/**
 * Creates a token provider function for the SDK client.
 *
 * Supports two auth modes:
 * - Standard: username/password
 * - Admin: BEID/WebServicesKey
 */
export function createTokenProvider(config: TeamDynamixConfig, tenant: string): () => string | Promise<string> {
  if (config.authMode === 'admin') {
    if (!config.beid || !config.webServicesKey) {
      throw new Error('BEID and WebServicesKey are required for admin authentication');
    }

    return loginWithServiceAccount({
      tenant,
      beid: config.beid,
      webServicesKey: config.webServicesKey,
    });
  }

  if (!config.username || !config.password) {
    throw new Error('Username and password are required for standard authentication');
  }

  return loginWithPassword({
    tenant,
    username: config.username,
    password: config.password,
  });
}

/**
 * Creates a token provider from a pre-acquired JWT.
 */
export function createJwtTokenProvider(jwt: string): () => string {
  return createTokenProviderFromJWT(jwt);
}
