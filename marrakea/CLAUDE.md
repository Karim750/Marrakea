# MARRAKEA Frontend Implementation Rules

You are implementing the MARRAKEA frontend (Next.js App Router + BFF DTOs).
The source of truth is:
- docs/spec.md
- docs/architecture.md
- docs/dtos.md
- docs/seo.md
- docs/checkout.md
- docs/phases.md

Non-negotiables:
- Dumb client: no business logic for price/stock/tax.
- Server Components by default; Client Components only when required.
- Front consumes only DTOs from types/dtos.ts
- Checkout: frontend never computes final price; BFF/webhook is truth.

Workflow:
- Use subagents proactively (architecture, dtos, seo, checkout, perf).
- Always propose a plan before editing many files.
- Prefer small commits and run checks/tests.

