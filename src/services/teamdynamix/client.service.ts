// Backward-compatible re-export.
// All tool files import from this module.
export {
  createConfiguredTeamDynamixClient,
  assertWriteToolsEnabled,
  assertDeleteToolsEnabled,
  UnifiedTeamDynamixClient,
} from './client.factory.js';
