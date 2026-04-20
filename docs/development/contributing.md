---
title: Contributing
---

Contributions are welcome. Please follow the guidelines below to keep the codebase consistent and the review process smooth.

## Prerequisites

- Node.js 20 or later
- pnpm 10 or later

## Setup

```bash
git clone https://github.com/selfagency/mcp-server-template.git
cd mcp-server-template
pnpm install
pnpm build
```

Start the development server with hot reload:

```bash
pnpm dev
```

## Before Submitting a PR

Run the full gate:

```bash
pnpm typecheck   # TypeScript strict checks
pnpm lint        # oxlint
pnpm format:check  # oxfmt
pnpm test        # vitest
```

All four must pass. CI runs the same checks.

## Code Style

### Formatter

Use `oxfmt` for all TypeScript and Markdown files:

```bash
pnpm format      # format everything
pnpm format:check  # check without writing
```

Do not use Prettier. Do not introduce ESLint.

### Linter

Use `oxlint`:

```bash
pnpm lint        # check
pnpm lint:fix    # fix auto-fixable issues
```

### TypeScript

- `strict: true` — no exceptions
- No `any` — use `unknown` and narrow immediately if truly needed
- Explicit return types on all exported functions
- Prefer `readonly` and `as const` where appropriate
- `async`/`await` consistently — no `.then()`/`.catch()` chains

### Architecture rules

- Tools delegate to services. Keep tool handlers thin.
- Services own reusable business logic and helper utilities.
- Config is read from `src/config.ts`, not from `process.env` directly.
- Shared Zod schemas live in `src/schemas/`.

## Adding a New Tool

1. **Add Zod schema** in `src/schemas/` (if new shared params are needed)
2. **Add service function** in the relevant `src/services/*.service.ts`
3. **Register tool** in the relevant `src/tools/*.tools.ts`
4. **Update `src/index.ts`** if a new tool file is added
5. **Write tests** in `src/services/__tests__/`
6. **Document** in the corresponding `docs/tools/*.md` page

Follow snake_case naming for tool identifiers.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add file_summary tool
fix: normalize invalid input errors for text_transform
docs: expand resources guide
test: add edge cases for utility service
chore: upgrade MCP SDK
```

Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `ci`

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make your changes following the guidelines above
3. Run the full gate (`typecheck`, `lint`, `format:check`, `test`)
4. Open a PR with a clear description of what changed and why
5. Link any related issues in the PR description

PRs that fail CI, introduce `any`, skip tests, or bypass the formatter will not be merged until fixed.

## Reporting Issues

Use [GitHub Issues](https://github.com/selfagency/mcp-server-template/issues). Include:

- template version
- Node.js version (`node --version`)
- OS and architecture
- Minimal reproduction steps
- Actual vs. expected behaviour
