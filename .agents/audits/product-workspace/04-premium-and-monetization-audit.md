# Premium, monetization and automation audit

## Current gate mechanism

All premium enforcement is presentation-only:

- `tierStore` contains a persisted `free | pro` value.
- Header buttons, `Ctrl+B`, the command menu, fake license activation, and both upgrade CTAs can set Pro locally.
- Route elements themselves are reachable; pages render `ProLock` based on the same client value.
- No server entitlement, signed payload, capability, plan refresh, offline grace, site binding, seat limit or tamper boundary exists.

This is acceptable for visual prototyping only. It must be compile-time/dev-only in the integrated product. Server endpoints must authorize entitlements independently; hiding buttons is never enforcement.

The upgrade modal's `$19/mo billed annually`, renewal date, seats, unlimited claims and priority support are prototype copy, not validated commercial decisions. This audit does not endorse them.

## Complete current premium list

| Locked/claimed feature | Problem/target | Merchant value | Agency value | Complexity/support | Revenue potential | Core-essential? | Recommended tier | Judgment |
|---|---|---:|---:|---|---:|---:|---|---|
| 50 products/month → unlimited | Monetizes usage volume | High if catalog grows | High | Metering, edge cases, trust/support | Medium | Product creation is core | **Remove current lock**; consider Pro job/scale limits, not a punitive manual-entry meter | A hard manual-creation ceiling weakens WordPress.org value and is trivially bypassed locally. |
| Multi-store management | Switch and operate across stores | Low/medium | Very high | Credential/tenant isolation, version/plugin variance, conflicts, support | High if done well | No | **Agency / Future** | Natural agency upgrade, but the prototype has no architecture. |
| Advanced analytics | Throughput, failures, team productivity | Low for occasional merchant | Medium/high | Event schema, retention, correctness, privacy, charts | Medium | No | **Future Pro/Agency** | Do not ship invented “time saved/revenue” metrics. Start with truthful operational logs. |
| CSV import/export | Bulk catalog changes | Medium/high | High | Mapping, validation, batching, rollback, images, extension fields | Medium | Basic capability already exists in Woo core | **Free: link/hand-off to core; Pro: recipes/dry run/resume/extension mappings** | Locking a generic upload is a weak proposition. Woo core imports/exports large volumes, attributes, categories and images ([official docs](https://woocommerce.com/document/product-csv-importer-exporter/)). |
| AI descriptions | Faster copy drafting | Medium in some verticals | Medium | Provider cost, quality, locale, disclosure, moderation, SEO sameness, support | Uncertain | No | **Future experiment** | Not a v1 differentiator; never imply generation without a provider/result review flow. |
| Team members/roles | Shared catalog operations | Low for solo merchant | High | Identity, invitation email, WP users, capabilities, audit, conflicts | High for agency | No | **Agency / Future** | Good agency problem, currently fake. Local WP-user collaboration may be Free if it only respects existing capabilities. |
| Scheduled sync & automatic retries | Hands-off reliable bulk jobs | Low for occasional manual entry | High | Queue runner, locks, retries, idempotency, logs, alerts, cron reliability | High | Reliable immediate retry is core | **Free: safe manual retry; Pro: scheduled/resumable jobs; Agency: cross-store jobs** | Natural scale upgrade only after durable infrastructure. |
| Priority support | Faster help | Medium | High | Staffing/SLA | Medium | No | **Commercial decision** | Do not promise before capacity/SLA exists. |
| Store health/latency | Diagnose connections | Low in same-site plugin | High for remote fleet | Monitoring, false alarms, privacy, infrastructure | Medium | No | **Agency / Future** | Same-site v1 does not need “connection health.” |
| Team analytics | Measure operator throughput | Low | Medium/high | Attribution, fairness/privacy, events | Medium | No | **Agency / Future** | Risky vanity metric unless it drives troubleshooting/capacity. |
| License/seat dashboard | Manage entitlement | None by itself | Medium | Billing/licensing integration, lifecycle, support | Enabling only | No | **Pro/Agency infrastructure** | Replace mock entirely; not a customer-facing differentiator. |

## Locks that are wrong

1. **Basic product volume as a hard local monthly limit.** Free must remain genuinely useful. Monetize scale operations—batching, templates, complex matrix tools and multi-site jobs—not the right to keep entering ordinary products.
2. **Generic CSV import/export as wholly Pro.** WooCommerce ships a capable core importer/exporter. Paid value must be safer workflow and advanced mapping, not access to file upload.
3. **Analytics before operational history.** A locked glossy dashboard advertises data the product does not collect. Core users need truthful queue results and failure logs first.
4. **All team concepts as one Pro lock.** Respecting existing WordPress users/capabilities is core security, not a premium feature. Cross-store seats, invitations, client roles and retained audit trails can be Agency.
5. **Automatic retry bundled without free safe retry.** A user must be able to recover an ordinary failed write in Free. Pro can schedule and orchestrate large job recovery.

Basic simple and variable product creation, essential attributes/variations, edit, media, taxonomy selection, validation, and safe retry must not be premium.

## Recommended freemium boundary

### Free — excellent core

- Complete simple-product create/edit/duplicate.
- Basic variable-product creation with global/custom attributes and explicit variation combinations.
- Essential pricing/inventory/shipping/tax/media/category/tag/status/visibility fields.
- Draft recovery, repeat values, queue, search/filter, honest errors, manual retry/undo.
- Dark mode, compact density, keyboard flow, mobile simple entry, EN/FR/AR and RTL.
- Existing WordPress-user capability enforcement.
- Clear hand-off to WooCommerce core CSV import/export.

### Pro — repetition and scale

- Named templates/presets with selective field application.
- Advanced variation matrix: bulk fill, copy down/across, SKU generation rules, image assignment, combination preview and limits.
- Batch create/update with validation preview, dry run, chunked processing, resumability and logs.
- Advanced mappings/import recipes for extension fields when compatibility can be supported.
- Scheduled local jobs and notifications only after the durable queue is proven.
- Useful operational reports derived from real job events.

### Agency — multiple stores and people

- Secure store portfolio/connection lifecycle.
- Cross-store template packs and controlled replication/migration.
- Client/store scoping, roles, approvals and durable audit history.
- Fleet job scheduling, status and failure triage.
- Never expose raw remote credentials to the browser; use site-local adapters or a deliberately secured service.

## Features to remove from the current production candidate

- Free/Pro header switch, `Ctrl+B`, command-menu plan toggle and locally persisted trial.
- Fake key pattern and hardcoded active-license facts.
- Fake email, sync, health, latency, revenue, time-saved, renewal and seat claims.
- “Install WP CORS” / wildcard CORS guidance and direct credential form for a same-site WordPress plugin.
- “Unlimited stores/products” and support promises until entitlement and operational capacity are defined.

The corresponding designs may stay in an internal prototype/storybook, clearly labeled fixtures.

## Automation inventory

There is no automation builder or real scheduled workflow. Current automation-like surfaces are:

| Surface | Trigger | Conditions | Action | Current state | Classification |
|---|---|---|---|---|---|
| Immediate sync on save | Valid form submission | `wooConfig.connected` | Direct create/media/variation requests | Executable but unsafe/unverified | Unsafe prototype automation |
| Manual retry | User selects failed row | Row status `error` | Set pending; optionally call create again | Partial; may do nothing or duplicate | Unsafe until idempotent |
| Auto-generate variations | Product setting + variable data | Any options present | Cartesian combination and sequential POSTs | UI blocked; algorithm semantically wrong for multi-attribute prices | Unsafe/incomplete |
| Scheduled sync | None designed | None | Mentioned only | Copy/lock only | Concept |
| Automatic retry | None designed | None | Mentioned/metric only | Copy/static data | Concept |
| AI description generation | Button | Pro client flag | Toast | No provider/result | Feature-bloat demonstration |

## Automation engineering requirements

Any future job must specify:

- **Trigger:** explicit manual submit, schedule, import completion or retry—not vague “automation.”
- **Conditions:** store/site, product status, row version, entitlement, user capability, job size and maintenance state.
- **Action:** cohesive application operation using Woo CRUD, with validated field allowlist.
- **Required data:** product/variation IDs, source revision, intended payload hash, actor, locale/store config, idempotency key.
- **Execution:** Action Scheduler is preferable for durable WooCommerce-adjacent background jobs; WP-Cron only initiates due work and is traffic-dependent.
- **Queue:** per-item states (`queued/running/succeeded/failed/cancelled/partial`), leases/locks, bounded batches and controlled concurrency.
- **Failure:** structured error codes, safe redaction, per-item result, partial-success representation, user-visible next action.
- **Retry:** exponential delay for transient errors, max attempts, non-retryable classification, dead-letter/manual review.
- **Idempotency:** request/job keys and detection of already-created products; never retry blind create calls.
- **Logging:** actor, operation, IDs, timing, attempts and sanitized result; retention controls.
- **Safety:** dry run for mass changes, diff preview, scope summary, explicit confirmation, backup guidance and reversible changes where feasible.

## Minimal automation roadmap

1. **Free v1:** synchronous/simple-product writes with idempotency; manual retry of known failed operations; no scheduler.
2. **Pro after v1:** chunked batch/import job with dry run, progress, resume and logs. This solves a clear repetitive workflow.
3. **Later Pro:** scheduled execution of saved local recipes only after job reliability is proven.
4. **Agency:** cross-store replication/sync with per-store results, approval and conflict policy.

Do not build generic “when X then Y” catalog automation in the foreseeable v1 roadmap. It creates a wide destructive surface and high support burden without evidence from this prototype that users need it.
