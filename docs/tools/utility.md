---
title: Utility Tools
---

The starter template includes practical read-only tools that demonstrate validation, structured outputs, and consistent error handling.

## `template_ping`

- Purpose: sanity check server connectivity
- Input:
  - `message` (optional string, default `pong`)
- Output:
  - `content` text line
  - `structuredContent` with `{ ok, message }`

## `echo`

- Purpose: return user-provided text unchanged
- Input:
  - `text` (required string)
  - `response_format` (`markdown` or `json`)
- Output:
  - `content`
  - `structuredContent` with `{ text }`

## `text_transform`

- Purpose: transform text using common operations
- Input:
  - `text` (required string)
  - `mode` (`uppercase`, `lowercase`, `trim`, `slug`)
  - `response_format`
- Output:
  - `content`
  - `structuredContent` with `{ original, transformed, mode }`

## `current_time`

- Purpose: return server time with optional timezone rendering
- Input:
  - `time_zone` (optional IANA timezone)
  - `response_format`
- Output:
  - `content`
  - `structuredContent` with `{ iso, locale, timeZoneUsed }`

## `system_info`

- Purpose: non-sensitive runtime diagnostics
- Input:
  - `response_format`
- Output:
  - `content`
  - `structuredContent` with platform, Node version, CPU count, uptime, and memory fields
