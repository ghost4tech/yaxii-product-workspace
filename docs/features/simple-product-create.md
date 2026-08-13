# Simple Product Create

**Status:** Implemented in Phase 2; owner visual acceptance pending

## Purpose and workflow

An authorized WordPress user can submit the approved Lovable `Save & next` action to create a
simple product in the WooCommerce store on the same WordPress installation. The existing form,
Essentials/Extended layout, Focus Mode, queue, responsive composition, themes, density, dialogs,
and keyboard shortcut remain the presentation layer.

The Phase 2 request supports product name, SKU, regular and optional sale price, basic stock,
one selected category, descriptions, up to 10 existing WordPress image attachment IDs, catalog
visibility, tax status, and Draft or Publish intent.

## Application flow

`Lovable form -> useProductCreate -> WorkspaceClient -> WordPressWorkspaceRepository -> POST /products -> CreateProductService -> WooProductGateway -> WC_Product_Simple::save()`

The client sends an `Idempotency-Key` UUID and the WordPress REST nonce. The server revalidates the
allowlisted request, capabilities, SKU, category terms, and media attachments before invoking the
WooCommerce CRUD object. Client capabilities only control the button state; they do not authorize
the write.

## Observable behavior

- `Save & next` and Ctrl/Cmd+Enter invoke the same guarded submit path.
- A synchronous in-flight lock and the disabled loading control prevent accidental double submit.
- A successful server result creates or updates the matching queue row with the real operation ID
  and WooCommerce product ID.
- Published products appear as Synced; Draft products appear as Draft.
- After success, the form clears. When `Keep values after save` is enabled, category, price, sale
  price, and stock remain for the next entry.
- Validation or write failure retains the draft, maps supported server field errors into the form,
  and never displays success.
- A lost response retains both the form and the idempotency identity. Submitting the unchanged
  payload again reconciles the original command rather than issuing a blind create.
- Category choices come from a bounded same-origin search. Clicking the approved image control in
  WordPress opens the native media library and records attachment IDs.

## Security and persistence

The REST route requires cookie authentication, a valid `X-WP-Nonce`, a non-public
`permission_callback`, and server capability checks. Publish also requires `publish_products`.
Inputs are allowlisted, validated, normalized, and sanitized before WooCommerce receives them.
Products are written only through `WC_Product_Simple` setters and `save()`.

The browser stores no WooCommerce keys and never calls `/wc/v3`. Product results are not persisted
as a browser catalog. Draft preferences remain the only bounded browser persistence.

## Phase 2 limits

- Variable products are visible as preserved Lovable source but cannot be submitted in Phase 2.
- Sale schedule dates are not persisted; entering them blocks the write with a truthful message.
- Dragged or locally browsed browser files are not uploaded implicitly. Images must have a current
  WordPress attachment ID before submission.
- `pending` product status is not in the Phase 2 contract; users must choose Draft or Publish.
- Product editing, deletion, and retry controls are not server-connected in this phase.
- Full French and Arabic copy remains deferred. New operation copy is centralized behind the
  existing locale selection boundary, and root/portal direction continues to support RTL.

## Evidence

PHP integration coverage exercises Draft and Publish persistence, capability denial, malformed
input, duplicate SKU, invalid references, idempotent replay/conflict, operation lookup, bounded
categories, invalid nonce behavior, and zero-write failure paths. Frontend tests cover DTO and
field-error mapping, saving state, double-submit prevention, queue results, draft preservation,
uncertain response reuse, reconciliation, and the keyboard shortcut.

LocalWP runtime checks created real disposable Draft and Published products, inspected canonical
WooCommerce values, proved replay used one product ID and conflict returned 409, then deleted the
products. Authenticated browser visual verification remains pending because no browser backend was
available in the execution session.
