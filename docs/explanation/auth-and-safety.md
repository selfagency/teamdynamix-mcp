---
title: Auth and Safety Model
---

## Auth model

Two authentication modes are supported:

- `standard`: username/password
- `admin`: BEID/WebServicesKey

The selected mode determines which credential set is required for readiness.

## JWT expiry assumption

The client reads the JWT `exp` claim to decide when to refresh cached tokens.

- This is used for cache expiry only.
- Signature verification is not performed client-side.
- TeamDynamix remains the source of truth for token validity on each API request.

## Why write tools are gated

TeamDynamix operations can create or modify production ITSM records. Write operations are disabled by default to prevent accidental mutation from exploratory prompts.

## Why destructive confirmation exists

Unlinking contacts/assets from tickets is easy to invoke accidentally in freeform conversations. Requiring `confirm: true` adds a deliberate, explicit checkpoint.

## Principle

The safety design prioritizes:

1. safe defaults
2. explicit escalation to mutation
3. schema-level protection before side effects
