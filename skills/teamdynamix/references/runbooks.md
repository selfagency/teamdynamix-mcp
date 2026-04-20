# TeamDynamix Workflow Runbooks

Use these runbooks for common operator tasks.

## 1) Ticket triage + update

- Objective: find target ticket, inspect full context, apply update safely, verify result.

1. Discover filters and IDs:
   - `teamdynamix_discovery` + `action: "list_ticket_statuses"`
   - `teamdynamix_tickets` + `action: "list_ticket_priorities"`
   - `teamdynamix_people` + `action: "search_users"`

2. Search candidates:
   - `teamdynamix_tickets` + `action: "search_tickets"`

3. Load full ticket:
   - `teamdynamix_tickets` + `action: "get_ticket"`

4. Optional activity history:
   - `teamdynamix_tickets` + `action: "get_ticket_feed"`

5. Write update (requires write flag):
   - `teamdynamix_tickets` + `action: "update_ticket"`

6. Add note if needed:
   - `teamdynamix_tickets` + `action: "add_ticket_comment"`

7. Verify:
   - re-run `teamdynamix_tickets` with `action: "get_ticket"`
   - and/or `teamdynamix_tickets` with `action: "get_ticket_feed"`

Success checks:

- Target ticket ID confirmed.
- Updated fields present on re-read.
- Feed note visible (if added).

## 2) Ticket relationship management (tasks, contacts, assets)

- Objective: add/remove task/contact/asset links on a ticket and verify state.

1. Resolve ticket and related IDs.

2. Tasks:
   - list: `teamdynamix_ticket_relationships` + `action: "get_ticket_tasks"`
   - create: `teamdynamix_ticket_relationships` + `action: "create_ticket_task"` (write flag)

3. Contacts:
   - list: `teamdynamix_ticket_relationships` + `action: "get_ticket_contacts"`
   - add: `teamdynamix_ticket_relationships` + `action: "add_ticket_contact"` (write flag)
   - remove: `teamdynamix_ticket_relationships` + `action: "remove_ticket_contact"`
     (write flag + `confirm: true`)

4. Assets:
   - list: `teamdynamix_ticket_relationships` + `action: "list_ticket_assets"`
   - add: `teamdynamix_ticket_relationships` + `action: "add_ticket_asset"` (write flag)
   - remove: `teamdynamix_ticket_relationships` + `action: "remove_ticket_asset"`
     (write flag + `confirm: true`)

5. Verify by re-listing tasks/contacts/assets.

Success checks:

- Requested links appear/disappear in corresponding list output.

## 3) KB article maintenance

- Objective: find or create KB content and keep category assignment correct.

1. Discover categories: `teamdynamix_knowledge_base` + `action: "list_kb_categories"`
2. Search candidates: `teamdynamix_knowledge_base` + `action: "search_kb_articles"`
3. Load full article: `teamdynamix_knowledge_base` + `action: "get_kb_article"`
4. Create or update:
   - create: `teamdynamix_knowledge_base` + `action: "create_kb_article"` (write flag)
   - update: `teamdynamix_knowledge_base` + `action: "update_kb_article"` (write flag)

5. Verify by re-reading article.

Success checks:

- Article content/category fields match requested state.

## 4) Asset/CI linking workflow

- Objective: locate asset/CI context and link to ticket workflows.

1. Asset search/read:
   - `teamdynamix_assets` + `action: "search_assets"`
   - `teamdynamix_assets` + `action: "get_asset"`

2. CI search/read:
   - `teamdynamix_cmdb` + `action: "search_cis"`
   - `teamdynamix_cmdb` + `action: "get_ci"`

3. Validate CI metadata:
   - `teamdynamix_cmdb` + `action: "list_ci_types"`
   - `teamdynamix_cmdb` + `action: "list_ci_relationship_types"`

4. Link asset to ticket if requested:
   - `teamdynamix_ticket_relationships` + `action: "add_ticket_asset"`
     (write flag)

5. Verify by listing ticket assets.

## 5) Project issue/risk workflow

- Objective: track project execution issues and risks.

1. Find project:
   - `teamdynamix_projects` + `action: "search_projects"`
   - `teamdynamix_projects` + `action: "get_project"`

2. Inspect existing records:
   - `teamdynamix_projects` + `action: "get_project_issues"`
   - `teamdynamix_projects` + `action: "get_project_risks"`

3. Create new records (write flag):
   - `teamdynamix_projects` + `action: "create_project_issue"`
   - `teamdynamix_projects` + `action: "create_project_risk"`

4. Verify by re-listing issues/risks.

## 6) Time reporting workflow

- Objective: retrieve time type metadata and user entries for date ranges.

1. `teamdynamix_time` + `action: "list_time_types"`
2. `teamdynamix_time` + `action: "get_my_time_entries"`
   with `StartDate` and `EndDate`
3. Validate entries against expected date window and count.

## Error branches

- 401 -> credentials/auth mode invalid; stop and report required variables.
- 404 -> wrong app/context/object ID; re-run discovery.
- 429 -> rely on server backoff; avoid manual tight retry loops.
- Write/Admin disabled -> report exact flag needed and stop mutating path.
