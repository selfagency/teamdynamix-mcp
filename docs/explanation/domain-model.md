---
title: Domain and Data Model
---

This server maps TeamDynamix domains to MCP tool families.

## Core domains

- Tickets
- Ticket relationships (tasks, contacts, assets)
- Knowledge Base
- Assets
- CMDB / configuration items
- People and groups
- Services
- Projects
- Time
- Enumerations (accounts, locations, roles, attributes)

## Relationship examples

- Ticket ↔ Task (`get/create_ticket_task`)
- Ticket ↔ Contact (`get/add/remove_ticket_contact`)
- Ticket ↔ Asset (`list/add/remove_ticket_asset`)
- Project ↔ Issue/Risk (`get/create_project_issue`, `get/create_project_risk`)

## Why enumeration tools matter

Many write operations require IDs that are tenant-specific. Enumeration/search tools are therefore first-class and should be called before write operations.
