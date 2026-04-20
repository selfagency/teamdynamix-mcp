import os from 'node:os';
import { CHARACTER_LIMIT } from '../constants.js';
import type { SystemInfo } from '../types.js';

function truncate(text: string): string {
  return text.length > CHARACTER_LIMIT
    ? `${text.slice(0, CHARACTER_LIMIT)}\n\n[truncated to ${CHARACTER_LIMIT} characters]`
    : text;
}

export function transformText(
  text: string,
  mode: 'uppercase' | 'lowercase' | 'trim' | 'slug',
): { original: string; transformed: string; mode: string } {
  const transformed =
    mode === 'uppercase'
      ? text.toUpperCase()
      : mode === 'lowercase'
        ? text.toLowerCase()
        : mode === 'trim'
          ? text.trim()
          : text
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-');

  return {
    original: truncate(text),
    transformed: truncate(transformed),
    mode,
  };
}

export function getCurrentTime(timeZone?: string): {
  iso: string;
  locale: string;
  timeZoneUsed: string;
} {
  const now = new Date();
  const timeZoneUsed = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: timeZoneUsed,
  }).format(now);

  return {
    iso: now.toISOString(),
    locale,
    timeZoneUsed,
  };
}

export function getSystemInfo(): SystemInfo {
  return {
    platform: process.platform,
    release: os.release(),
    nodeVersion: process.version,
    cpuCount: os.cpus().length,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryTotalBytes: os.totalmem(),
    memoryFreeBytes: os.freemem(),
  };
}
