# Yaxii Product Workspace — Feature Tiers

**Status:** Product authority

## Tier model

- **Free** — complete core entry experience and awareness product.
- **Pro** — repetition, advanced productivity, scale, AI assistance, and safe batching.
- **Agency** — multiple stores, clients, teams, and centralized operations.
- **Future/HOLD** — valid ideas not yet justified or architecturally ready.
- **Hidden/Deferred** — prototype surfaces that should not appear in Free production.

## Feature matrix

| Capability | Free | Pro | Agency | Notes |
|---|:---:|:---:|:---:|---|
| Simple product create/edit | ✓ | | | Core |
| Duplicate/prefill/trash | ✓ | | | Core |
| Essential Woo fields | ✓ | | | Core |
| Categories/tags/media | ✓ | | | Core |
| Basic global/custom attributes | ✓ | | | Core |
| Basic variable CRUD | ✓ | | | Must not be crippled |
| Basic variation price/SKU/stock/image | ✓ | | | Core |
| Save & Next | ✓ | | | Signature workflow |
| Focus Mode | ✓ | | | Signature workflow |
| Compact/Comfortable density | ✓ | | | |
| Queue + search/filter | ✓ | | | Operation-backed |
| Draft recovery | ✓ | | | |
| Repeat values | ✓ | | | Acquisition value |
| Product defaults | ✓ | | | |
| Keyboard/command menu | ✓ | | | |
| Dark mode/reduced motion | ✓ | | | |
| Mobile simple entry | ✓ | | | |
| EN/FR/AR + RTL | ✓ | | | |
| Manual safe retry | ✓ | | | Reliability is not premium |
| Named templates/presets | | ✓ | shared packs later | Strong Pro v1 |
| Selective template apply | | ✓ | ✓ | |
| Advanced variation matrix | basic only | ✓ | ✓ | Strong Pro v1 |
| Bulk price/stock/SKU/image | | ✓ | ✓ | |
| SKU rules/collision preview | | ✓ | ✓ | |
| Advanced combination tooling | | ✓ | ✓ | |
| Batch create/update | | ✓ | ✓ | After core |
| Dry run/sample diff | | ✓ | ✓ | Required for safe batching |
| Resumable jobs | | ✓ | ✓ | |
| Per-item logs/failure export | | ✓ | ✓ | |
| Saved recipes | | ✓ | ✓ | |
| Scheduled local jobs | | later | ✓ | Only after durable jobs |
| Operational reports | basic state | later | ✓ | Real data only |
| AI descriptions/copy | | later | ✓ | Future Pro suite |
| AI translation/tags/categories | | later | ✓ | Review-first |
| AI image generation/enhancement | | later | ✓ | External service/cost |
| Multi-store portfolio | | | ✓ | Separate threat model |
| Cross-store templates/products | | | ✓ | |
| Client approvals | | | ✓ | |
| Team roles/invitations | WP caps only | | ✓ | Agency identity model |
| Durable org audit history | recent ops | | ✓ | |
| Fleet jobs/status | | | ✓ | |
| Store health | | | later | Truthful monitoring only |
| General automation builder | | | | Do not build in foreseeable v1 |
| Vanity analytics | | | | Do not build |

## Hide from Free production

Keep files if useful, but hide:

- Analytics.
- Stores.
- Team.
- License.
- AI.
- CSV/import demo.
- Store health.
- Fake connection/sync controls.
- Fake Free/Pro toggles.
- Fake usage meter/commercial claims.

## Pro v1 recommendation

Start with only:

1. Templates/presets.
2. Advanced variation matrix/bulk variation tools.

Then add:

3. Safe batch create/update.
4. Saved mappings/recipes.
5. Durable jobs and operational reporting.

AI comes later after provider, cost, privacy, quality, and review flow are designed.

## Agency recommendation

Agency is not just a higher site limit. It needs a secure store connection lifecycle, tenant isolation, identity/permissions, audit history, job orchestration, and compatibility/support policy.
