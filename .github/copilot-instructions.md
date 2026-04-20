# GitHub Copilot Instructions

You are assisting on a TypeScript Model Context Protocol (MCP) server template project.

## Project goals

- Build a reliable, composable, production-minded MCP server baseline.
- Keep the MCP surface small, explicit, and well validated.
- Optimize for correctness, safety, and observability over cleverness.
- Keep domain logic separate from MCP transport wiring.

## MCP architecture rules

- Follow MCP TypeScript SDK conventions already present in the repo.
- Unless explicitly opted into SDK v2, target stable SDK v1 APIs.
- Use snake_case tool names with clear action verbs.
- Use Zod schemas for all tool inputs.
- Keep tool handlers thin; place business logic in service modules.
- Use resources for URI-addressable read-only data.
- Use tools for operations driven by request input or side effects.
- When returning large outputs, apply `CHARACTER_LIMIT` and truncate safely.
- Prefer markdown for human-readable responses and JSON when machine-friendly shape is needed.

## TypeScript standards

- Use strict TypeScript patterns.
- Prefer explicit return types on exported functions.
- Avoid `any`; use `unknown` only when narrowed immediately.
- Prefer `readonly` and `as const` where appropriate.
- Keep functions small and single-purpose.
- Use `async`/`await` consistently for I/O.

## Error handling rules

- Return clear, actionable error messages.
- Distinguish invalid input, permission issues, missing resources, and unknown failures.
- Never swallow errors silently.
- Preserve enough context for debugging without leaking secrets.

## Formatting and linting

- Use `oxlint` for linting.
- Use `oxfmt` for formatting.
- Do not introduce ESLint or Prettier unless explicitly required.
- Keep diffs focused and minimal.

## Build and development

- Use `tsx` for development execution.
- Use `tsup` for production bundles.
- Keep workflow fast and reproducible.
- Run typecheck/lint/tests before finalizing changes.

## Security and safety

- Validate all external input.
- If tools accept paths, validate and prevent traversal.
- Redact sensitive output and avoid returning credentials/secrets.
- Gate destructive operations behind explicit confirmation and/or opt-in flags.

## Documentation

- Keep README and docs aligned with actual tool names and behavior.
- Document extension patterns for adding tools/resources/prompts.
