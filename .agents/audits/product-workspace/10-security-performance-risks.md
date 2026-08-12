# Security and performance risks

## Risk register

| Priority | Risk | Current evidence | Required control |
|---:|---|---|---|
| Critical | Woo consumer secret in browser/localStorage | Direct Basic Auth service; persisted `wooConfig` | Remove path; same-origin nonce-authenticated plugin REST + PHP Woo CRUD. |
| Critical | Client-controlled entitlement/license | persisted tier, header/shortcut bypass, fake key | Server-authoritative entitlement and endpoint enforcement; dev preview excluded from production. |
| Critical | Unauthenticated/unauthorized future writes | standalone app has no WP auth/capabilities | Cookie+REST nonce authentication and per-operation/object capability checks. |
| Critical | Duplicate/partial product writes | retry calls create; variation failures hidden | Idempotency keys, operation records, prevalidation, partial result model, reconciliation. |
| High | Cross-store data/credential confusion | active mock store does not scope queue/config/categories | Remove multi-store from local v1; explicit site/tenant scoping in future. |
| High | False success and unsafe operator decisions | team email, store health, license, AI/CSV, retry toasts | Mutation results only from services; terminal states and error recovery. |
| High | XSS/sanitization surface in product content | descriptions will accept content; dependency advisories include router/build issues | Server allowlist/sanitization, safe rendering, dependency upgrades, no raw HTML in app. |
| High | Large destructive batch/import | not implemented but marketed | dry run, scope summary, caps, capability recheck, job queue, cancellation boundaries, logs. |
| High | RTL/i18n/security message ambiguity | hardcoded English/currency/dates | localized stable errors, correct direction/formatting; never localize machine codes. |
| Medium | Browser persistence privacy/data leakage | products/drafts/categories/user-like data persist indefinitely | minimize, version, TTL, clear-on-user change/logout where applicable; no secrets. |
| Medium | Dependency/build reproducibility | `npm ci` fails; 21 audit advisories in installed tree | reconcile lock, upgrade/test, pin supported toolchain, CI gates/SBOM. |
| Medium | Remote fonts/privacy/CSP | Google Fonts requests | self-host/system fonts; compatible CSP. |

## Authentication and nonce boundary

Inside wp-admin, WordPress cookie authentication plus `wp_rest` nonce is the correct browser boundary. WordPress notes that without a nonce the current REST user becomes unauthenticated even if logged in ([official authentication handbook](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)).

- Bootstrap/WordPress supplies the REST root and nonce; do not hardcode `/wp-json` assumptions.
- Send nonce in `X-WP-Nonce` on same-origin requests.
- Nonce verifies request intent/session; it does **not** grant permission. Every route has a real `permission_callback` and application service rechecks object/action context.
- Return 401/403 distinctly so React can offer reload/session recovery rather than retry writes blindly.
- Do not put nonce, capabilities or entitlement into long-lived localStorage.

## Write-capability mapping

### Product create

- Require product creation/edit collection capability.
- If requested status is publish/private, enforce the corresponding capability.
- Validate type against enabled/supported product types.
- Validate field sizes, price decimal precision, finite quantities, sale date ordering and content policy.
- Resolve defaults on the server; client defaults are suggestions.
- Require idempotency key and bound payload/product size.

### Product edit

- Load the product first; check ability to edit that concrete object.
- Reject stale version/modified token with 409 and return a safe conflict summary.
- Allowlist editable fields and supported type transitions.
- Preserve fields omitted by PATCH; clearing requires explicit null/empty semantics.
- Extension-owned fields are read-only/unknown unless an adapter declares support.

### Product trash/delete

- Check delete capability on the concrete product.
- Trash by default; no force-delete in v1 API.
- UI distinguishes deleting an unsaved queue entry from trashing a store product.
- Return the resulting state and audit actor/time.

### SKU

- Normalize according to Woo conventions, enforce length/character policy only where supported, and check uniqueness at write time.
- Recheck within the write path because client-side availability can race.
- Treat duplicate SKU as 409/field error; never auto-change silently unless the user selected an explicit SKU rule.
- Batch-generated SKUs need preview and collision policy.

### Taxonomy assignment/creation

- Allowlist product taxonomy routes; never accept arbitrary taxonomy/meta queries.
- Assignment checks registered taxonomy `assign_terms` capability and valid accessible term IDs.
- Creation checks taxonomy management capability; sanitize name/slug/parent; handle existing-term races.
- Global attribute creation is a higher-impact separate operation, not implicit while typing.

### Media

- Upload requires `upload_files`; enforce WordPress MIME/size checks and attachment errors.
- Referenced IDs must be valid attachments of allowed MIME and usable under policy.
- Set alt text through authorized attachment operations; sanitize captions.
- Avoid base64 JSON uploads and unbounded simultaneous files.
- Object URLs remain browser-only and are revoked when removed/replaced/unmounted.

### Variations

- Validate referenced parent/product type, attribute keys/terms and unique selection combinations.
- Cap synchronous combination count and payload size before any write.
- Check every variation SKU and return per-combination errors.
- Represent partial completion; do not mark parent operation fully succeeded.
- Idempotency relates client combination IDs to created variation IDs for safe retry.

### Duplicate requests/retry

- `Idempotency-Key` + payload hash + user/site/operation binding.
- Same key/same payload returns previous result; same key/different payload returns conflict.
- Operation lookup reconciles timeouts where the browser did not receive the response.
- Retry targets an operation, not a generic create endpoint.
- Never automatically retry non-idempotent writes at the generic HTTP client layer.

### Bulk actions/import

- Capability check at plan creation and again during execution.
- File type/size/row/column limits; parse defensively; spreadsheet formula injection protection on exports.
- Mapping allowlist; custom meta import disabled by default and capability/plugin policy controlled.
- Dry run/sample diff, explicit counts, target store, update-vs-create matching policy and confirmation.
- Chunked server job, bounded concurrency, resumable cursor, per-row log, cancellation semantics and retention.
- Uploaded file stored outside public execution, randomized name, access controlled, deleted by retention policy.
- No `ALLOW_UNFILTERED_UPLOADS` recommendation in product UI.

### Remote images, if introduced

Not present in the prototype UI; core CSV may use URLs. A Yaxii implementation would need SSRF defenses: allow only HTTP(S), resolve/re-resolve DNS, block loopback/private/link-local/metadata ranges, limit redirects/size/time/content type, stream to safe temp storage, scan/validate image, and execute server-side asynchronously. Treat as Future/HOLD until requirements justify the support burden.

### Automation/jobs

- Server-owned recipe/action allowlist; no arbitrary callbacks/URLs/PHP.
- Actor, approval scope and capability captured; recheck relevant access at execution.
- Lease/lock, max attempts, exponential retry, dead-letter/manual review.
- Mass changes require preview and explicit product/store scope.
- Logs redact descriptions/secrets where not required and have retention controls.
- Scheduler failure/traffic-dependent WP-Cron state must be visible; Action Scheduler is preferred for durable jobs.

### Multi-store/team, if introduced

- Separate threat model for tenancy, credential storage/encryption, key rotation/revocation, transport, replay protection and compromised-site containment.
- Never keep remote consumer secrets in the React runtime or localStorage.
- Define whether identity is WordPress-local or service-wide; invitations require verified email lifecycle.
- Roles must map to enforceable server permissions and store scope; display-only roles are prohibited.
- Agency activity needs immutable-enough audit records and client data isolation tests.

## Prototype assumptions to remove

- Wildcard CORS as a “fix.”
- Consumer keys as an in-admin connection mechanism for the same site.
- `connected: true` as trustworthy state.
- Client tier and pattern-matched key as authorization.
- Store URL as safe source for admin/external navigation without validation.
- Toast emission as evidence an email/sync/import/AI action happened.
- A local count as enforceable monthly usage.
- Error strings from remote APIs as safe user/log content.

## Performance findings

### Current bottlenecks

- `fetchCategories` loops through **all** category pages before returning; no cancellation and no incremental results.
- Entire product queue is persisted/filtered/grouped/sorted in the browser; “Load more” is only `slice`.
- Analytics imports a chart library and all mock datasets into the initial bundle; routes are not lazy.
- Build emits one ~1.146 MB minified JS chunk (~328 KB gzip) and warns above 500 KB.
- Variation generation performs a Cartesian product in memory, then sequential HTTP requests, with sequential media uploads.
- Product image uploads occur before product creation and failures can be silently omitted from payload.
- Every form change writes the entire draft object to localStorage through Zustand persistence.
- No request cancellation, debounce at service boundary, retry policy, cache invalidation strategy or concurrency control exists.
- Mock random generation complicates repeatable performance/QA measurements.

### Large product lists

- Server-side search/filter/order/pagination.
- Return compact list DTOs, not full descriptions/variations.
- TanStack Query with stable keys and bounded cache.
- Virtualize only when a viewport needs hundreds of rows; pagination/cursor remains the server boundary.
- Debounce search around 200–300ms and cancel superseded requests.
- Do not calculate catalog totals by loading every product.

### Categories/tags/attributes

- Paged typeahead with recent selections and cached popular terms.
- Hierarchy loaded on demand or in bounded trees; category counts optional.
- Cache invalidated after term creation, with ETag/last-modified if beneficial.
- Global attributes list is usually small; terms can still be paged for large vocabularies.

### Variation matrices

- Compute projected combination count before materializing rows.
- Set a synchronous UI/server limit; warn early about exponential growth.
- Virtualize matrix rows on desktop for large sets.
- Bulk edits operate on normalized patches/rules, not rerendering/writing every cell immediately.
- Submit one cohesive command or chunked job, not N browser requests.
- Controlled server concurrency and per-item results; media deduplicated/reused by ID.

### Media

- Thumbnail-sized responsive previews; lazy loading outside viewport.
- Upload with bounded concurrency (for example 2–3), cancellation and real progress.
- Deduplicate by attachment ID/hash only if safe and useful.
- Do not retain raw files in global stores longer than necessary.
- Use WordPress image sizes, not original full-size URLs in queue rows.

### Autosave/drafts

- Debounce browser draft serialization and exclude nonserializable files.
- Version/TTL drafts; compress only if measured, not by default.
- Server autosave, if introduced, needs revision/conflict semantics and should not write products on every keystroke.
- Flush at explicit lifecycle points (`visibilitychange`) carefully; do not rely only on unload.

### Duplication/bulk/templates

- Prefill duplication is a single product read plus local transform.
- Batch duplication/import uses background jobs and controlled chunks.
- Template application resolves missing terms/attributes once per plan, not per rendered field.
- Cache template lists; version resources to avoid editing stale definitions.

## Performance acceptance gates

- Initial core workspace chunk budget set before implementation; analytics/Pro routes lazy-loaded.
- Product list remains responsive with a representative 10k+ catalog because only one page is loaded.
- Category/attribute search first useful response target measured on realistic hosting.
- Simple create has one product operation request excluding deliberate media uploads.
- Variable create does not issue per-variation browser requests.
- 100+ combination matrix scroll/edit measured on target tablet/laptop; larger sets route to a job or are explicitly unsupported.
- Network requests cancel on query change/unmount; no state updates after abort.
- Browser storage stays bounded and contains no catalog/credential database.

## Dependency/build supply-chain gate

The audit install was non-reproducible with `npm ci`, and `npm audit` reported 21 advisories on 2026-08-11 (including critical/high findings in tooling/runtime dependency chains). Before production:

1. Reconcile `package.json` and lockfile using an intentional dependency update in its own review.
2. Remove unused Radix/shadcn packages/components and Lovable-only tooling.
3. Upgrade React Router/Vite/Vitest/PostCSS and transitive trees as compatible; verify advisories against the actual shipped/runtime surface.
4. Run clean `npm ci`, strict typecheck, lint, tests and production build in CI.
5. Record bundle composition and an SBOM/license review.

No dependency mutation or automated audit fix was performed in this audit.
