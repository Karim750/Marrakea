# Orchestrator — MARRAKEA BFF (Consolidated)

Build the BFF using 4 subagents:

1. **ContractLead** — Defines the authoritative API contract
2. **PlatformEngineer** — Implements infrastructure, middleware, and HTTP clients
3. **CommerceIntegrator** — Implements catalog, checkout, and account modules
4. **ContentIntegrator** — Implements blog and contact modules

---

## Non-negotiables

- Implementation must match `/spec/00-contract.md`
- Runtime DTO validation (Zod) on all responses
- Standard error format everywhere
- Cache-Control rules per contract
- Avoid N+1 on catalog list; use batch hydrate if possible, else dedupe+short cache
- Ghost product policy: drop from list, 404 on detail

---

## Execution Order

```
1. ContractLead      → produces /spec/00-contract.md + openapi/bff.yaml
2. PlatformEngineer  → produces src/shared/* + src/config/* + src/main.ts
3. CommerceIntegrator + ContentIntegrator (parallel)
                     → produce src/modules/*
4. Integration       → E2E testing + Postman collection
```

---

## Deliverables

| Artifact | Owner |
|----------|-------|
| `/spec/00-contract.md` | ContractLead |
| `/spec/04-edge-cases.md` | ContractLead |
| `openapi/bff.yaml` | ContractLead |
| `docs/contract-decisions.md` | ContractLead |
| `src/shared/*` | PlatformEngineer |
| `src/config/*` | PlatformEngineer |
| `src/main.ts` | PlatformEngineer |
| `src/modules/catalog/*` | CommerceIntegrator |
| `src/modules/checkout/*` | CommerceIntegrator |
| `src/modules/account/*` | CommerceIntegrator |
| `src/modules/blog/*` | ContentIntegrator |
| `src/modules/contact/*` | ContentIntegrator |
| `postman/bff.collection.json` | Integration |
| `postman/bff.environment.json` | Integration |

---

## Coordination Rules

1. **Contract is law** — All subagents must read and conform to `/spec/00-contract.md`
2. **No API drift** — If implementation requires contract changes, escalate to ContractLead
3. **Shared DTOs** — All Zod schemas live in `src/shared/dtos/` and are imported by modules
4. **Error format** — Use `src/shared/middleware/errorHandler.ts` for all error responses
5. **Cache headers** — Use `src/shared/cache/cacheHeaders.ts` helper consistently

---

## Quality Gates

Before marking complete:

- [ ] All endpoints match OpenAPI spec
- [ ] Zod validation on every response DTO
- [ ] Error responses follow standard format
- [ ] Cache-Control headers set per contract
- [ ] No N+1 queries in catalog list
- [ ] Ghost products handled correctly
- [ ] Unit tests for mappings pass
- [ ] E2E tests via Postman pass
