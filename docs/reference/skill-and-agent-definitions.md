---
title: Skill and Agent Definitions
---

This page documents the repository-level definitions used by agent workflows.

## Skill definition

- File: `skills/teamdynamix/SKILL.md`
- Purpose: operator-oriented guidance for TeamDynamix workflows
- Core sections:
  - prerequisites and env expectations
  - ID-resolution-first workflow patterns
  - safety and destructive confirmation guidance
  - quick reference tool families

## Agent prompt definition

- File: `prompts/teamdynamix-agent.prompt.md`
- Purpose: behavior guidance for TeamDynamix agent mode
- Core sections:
  - capability summary
  - operating constraints (resolve IDs first, flags, confirmations)
  - common task examples
  - response style

## Alignment policy

When code and docs disagree, implementation in `src/` is authoritative.

The skill and prompt should be updated whenever tool registrations change in:

- `src/tools/*.tools.ts`
- `src/index.ts`

## Current capability alignment highlights

- Ticket contacts are supported and documented: `get/add/remove_ticket_contact`
- Time tools are supported and documented: `list_time_types`, `get_my_time_entries`
- Service catalog supports list/get/search/categories
- Project domain includes read + create issue/risk write tools
