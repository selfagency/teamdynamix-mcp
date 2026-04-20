# TeamDynamix Gotchas

Capture high-value corrections that prevent repeated mistakes.

## Core gotchas

- Search/list responses may be partial. Follow with `get_*` before making write decisions.
- Name-based assumptions are unsafe. Always resolve numeric IDs/GUIDs via lookup tools.
- Write operations fail hard unless `TEAMDYNAMIX_ENABLE_WRITE_TOOLS=true`.
- Destructive relationship removals require `confirm: true`.
- 429 handling is implemented server-side; avoid custom retry storms.

## Frequent mistakes and fixes

### Mistake: Updating a ticket using guessed status name

**Fix:** Resolve status ID via `teamdynamix_list_ticket_statuses` first.

### Mistake: Attempting KB update with category label text

**Fix:** Use `teamdynamix_list_kb_categories` to map label -> numeric `CategoryID`.

### Mistake: Using stale or wrong user identifier

**Fix:** Re-run `teamdynamix_search_users`; use returned GUID exactly.

### Mistake: Removing contact/asset without confirm gate

**Fix:** Provide `confirm: true` on remove tool calls.

### Mistake: Assuming "product types" tool exists

**Fix:** Use `teamdynamix_list_product_models`.

## Pre-write checklist

- [ ] Correct app/project/ticket context resolved
- [ ] IDs/GUIDs discovered and confirmed
- [ ] Safety gate for write/admin satisfied
- [ ] Destructive confirmation present if needed
- [ ] Verification read step planned (re-get/re-list)
