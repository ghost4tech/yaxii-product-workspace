# Proposed PHP architecture

## Architectural stance

Use a modular monolith inside one WordPress plugin. The product is not helped by microservices or dozens of tiny REST endpoints. Keep WooCommerce at the infrastructure boundary, put use-case orchestration in application services, and use small immutable commands/results where they improve validation and tests.

The design must fit WordPress lifecycles without becoming a collection of global hooks and static service locators.

## Proposed layout

```text
yaxii-product-workspace.php
composer.json
src/
  Plugin.php
  Container/
    Container.php
    ServiceProvider.php

  Admin/
    WorkspacePage.php
    AssetLoader.php
    BootstrapData.php

  Http/
    Rest/
      RouteRegistrar.php
      BootstrapController.php
      ProductController.php
      TaxonomyController.php
      AttributeController.php
      PreferencesController.php
      OperationController.php
      TemplateController.php        # Pro, later
      ImportController.php          # Pro, later
      JobController.php             # Pro, later
      Request/
      Resource/
    Security/
      CapabilityPolicy.php
      Nonce/Auth integration        # WP owns cookie+nonce auth

  Application/
    Bootstrap/
      GetBootstrap.php
    Product/
      CreateProduct.php
      UpdateProduct.php
      GetProduct.php
      QueryProducts.php
      TrashProduct.php
      PrefillDuplicate.php
      Command/
      Result/
    Variation/
      CreateVariableProduct.php
      UpdateVariations.php
      ValidateCombinationSet.php
    Taxonomy/
      SearchTerms.php
      CreateTerm.php
      QueryAttributes.php
    Media/
      ResolveAttachments.php
    Preferences/
      GetUserPreferences.php
      SaveUserPreferences.php
    Operations/
      IdempotencyService.php
      OperationLog.php
      RetryOperation.php
    Templates/                    # Pro, later
    Imports/                      # Pro, later
    Jobs/                         # Pro, later

  Domain/
    Product/
      ProductType.php
      ProductDraft.php             # if useful; avoid mirroring all WC classes
      Price.php
      Sku.php
      PublicationStatus.php
      ValidationError.php
    Variation/
      AttributeSelection.php
      VariationCombination.php
      CombinationSet.php
    Templates/                    # later

  Infrastructure/
    WooCommerce/
      ProductFactory.php
      ProductMapper.php
      ProductQueryAdapter.php
      AttributeAdapter.php
      StoreConfiguration.php
    WordPress/
      TaxonomyAdapter.php
      MediaAdapter.php
      CurrentUser.php
      UserMetaPreferences.php
      Clock.php
    Persistence/
      IdempotencyStore.php
      OperationStore.php
      TemplateStore.php             # later
      JobStore.php                  # later
    Queue/
      ActionSchedulerAdapter.php    # later

  Licensing/                       # separate edition/module boundary
  Support/
tests/
  Unit/
  Integration/
  Rest/
```

Do not create empty layers simply to match this tree. Add modules when their use case begins. Free v1 initially needs Bootstrap, Product, Taxonomy, Media, Preferences and minimal Operations.

## Module responsibilities

### Plugin/Admin

- Register the admin page and REST routes at correct hooks.
- Verify WooCommerce availability/version before booting product services.
- Enqueue the exact built assets only on the workspace screen.
- Render one root and safe initial bootstrap.
- Show a server-rendered compatibility/capability failure if React cannot start.

### HTTP/REST

- Parse and normalize request payloads into commands.
- Declare JSON schemas/arguments where practical.
- Call a permission policy before application handlers. WordPress requires `permission_callback` for endpoints; permissions must be separate from the main callback ([REST route guidance](https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/)).
- Convert typed application results/exceptions into consistent resources/errors.
- No Woo CRUD logic in controllers.

### Application services

- One service per meaningful operation: create/update/query/term creation/preferences/retry.
- Orchestrate validation, capability context, idempotency, Woo adapter calls, taxonomy/media assignment and operation logging.
- Define transaction/compensation behavior for multi-step variable products. WordPress/Woo does not provide a simple cross-object database transaction; validate first, track created IDs, and represent partial failure honestly.
- Return typed results, never booleans plus ambiguous error strings.

### Domain services/value objects

Use only where invariants are real:

- Price decimal normalization and currency precision.
- SKU normalization/uniqueness request.
- Variation combination uniqueness/limit.
- Publication-state intent.
- Validation error paths.

Do not reimplement WooCommerce's whole product domain. Woo CRUD objects remain the authoritative persistence/business API for products.

### Infrastructure adapters

- Map commands to the correct `WC_Product_*` subtype and setters.
- Query through Woo APIs, not direct SQL/post meta.
- Resolve taxonomies through registered taxonomy objects and APIs.
- Resolve/validate attachment IDs through WordPress media APIs.
- Store preferences in user meta behind a small interface.
- Use a custom table only for data that needs high-volume querying/retention (operations/jobs/templates depending on requirements).

## Dependency injection

- Build a small explicit container at plugin boot; constructor injection for application services/controllers.
- Register interfaces to WordPress/Woo adapters in one composition root.
- Avoid hidden global singleton access inside services.
- WordPress functions may remain inside narrow adapters; unit tests mock interfaces, integration tests use real WP/Woo factories.
- Keep container APIs internal; do not expose a public service locator.

## Repository policy

Repositories are justified only when they abstract plugin-owned persistence or a useful query boundary:

- `OperationStore`, `IdempotencyStore`, `TemplateStore`, `JobStore`: justified.
- `UserPreferencesStore`: small interface justified for tests/storage migration.
- A generic `ProductRepository` that merely wraps every `WC_Product` method: likely unnecessary. Prefer focused `ProductQueryAdapter`, factory/mapper and Woo CRUD in application services.
- Never introduce repositories merely to hide WordPress functions one-for-one.

## Product write lifecycle

### Simple create

1. Permission policy verifies `edit_products`; requested publish status also requires publish capability.
2. Controller validates shape and builds `CreateProductCommand`.
3. Idempotency service reserves/checks `(user, route, key, payload hash)`.
4. Application validator checks fields, SKU, referenced term/media IDs and store configuration.
5. Product factory creates `WC_Product_Simple`; mapper applies setters.
6. Save product, then apply taxonomy/media relationships through supported APIs.
7. Record result IDs/status and return `ProductResource`.
8. Repeated identical key returns the same result; conflicting payload/key returns 409.

### Variable create

1. Validate all attributes/options/combinations and cap combination count before writes.
2. Resolve global attributes/terms and custom attributes.
3. Create/save `WC_Product_Variable` with product-level data/attributes.
4. Create each `WC_Product_Variation`, capture per-item result.
5. Synchronize parent variable data through the supported Woo lifecycle.
6. Return complete success or explicit partial result with parent/variation IDs and recovery operation. Never return success while hiding failed variations.

For large combination sets, plan a job rather than holding a REST request open.

### Update

- Load existing product; authorize against that object.
- Check client version/modified token.
- Reject unsupported type transitions unless a dedicated conversion use case exists.
- Apply only supplied fields; distinguish absent vs clear.
- Return updated canonical resource.

## Validation

- REST shape/types/enums and maximum sizes.
- Application invariants: required fields by type, sale date order, finite non-negative quantities as applicable, unique combination keys, allowed attachment/term IDs.
- Woo-specific validation through CRUD APIs and SKU lookup.
- Sanitize text at the correct boundary, but do not silently destroy legitimate product HTML. Define allowed HTML and use WordPress sanitization deliberately.
- Return errors as stable codes plus field paths and localized user messages; logs keep safe technical context.
- Client Zod improves immediacy but never replaces server validation.

## Capability enforcement

- Collection create/query: appropriate product capabilities (`edit_products`; only reveal products the user may read/edit).
- Item edit/delete: meta capability check against the concrete product ID (`edit_post`/`delete_post` semantics or Woo-registered equivalents via `current_user_can`).
- Publish/private status: enforce corresponding publication/read-private capabilities.
- Media: `upload_files` for upload; verify the user can use referenced attachments and that MIME/ownership policy is satisfied.
- Terms: resolve the registered taxonomy's `assign_terms`/`manage_terms`/`edit_terms` capabilities rather than assuming administrators.
- Preferences: current user only unless an explicit admin policy endpoint exists.
- Bulk/jobs/templates: both entitlement and WordPress capability; server rechecks when background work executes.

Never trust capability arrays or tier values sent by React.

## Idempotency and operation records

At minimum persist:

```text
idempotency key
user/site/operation
payload hash
state
result object IDs
safe error code
created/updated/expiry
```

Use a custom table if write volume/query/retry requires it. A transient alone can expire mid-retry and does not provide a durable audit. Establish retention and privacy rules.

## Error model

```text
code: stable machine code
message: localized safe summary
status: HTTP status
fields: map of field paths to errors
operation_id: for support/retry
retryable: boolean
details: safe structured context, never secrets
```

Suggested HTTP semantics: 400 malformed, 401 unauthenticated, 403 unauthorized, 404 missing, 409 conflict/idempotency/version/SKU, 422 valid shape but domain validation failure, 429 bounded operation limit, 5xx unexpected/transient server failure.

## Plugin-owned persistence choices

- User UI/preferences: one versioned user-meta value is adequate initially.
- Templates: custom post type is possible, but a custom table may better support ownership/versioning/search without front-end exposure; decide from requirements.
- Operation/jobs: custom tables are likely justified for status queries, retries and retention.
- Settings/feature flags: options only for small store-wide configuration.
- Never store unsanitized consumer secrets for local same-site operation because none are needed.

## Free/Pro code boundary

- Core interfaces and server enforcement live in Free.
- Pro registers additional services/routes/UI chunks through explicit module providers.
- Free must not contain dead premium implementations unlocked only by a JS flag.
- Entitlement checks occur at both route/application boundary; background runners recheck policy appropriate to already-approved work.
- Agency remains a separate module/product boundary until its threat model exists.

## Testability

- Unit-test value objects, validators, mappers and combination rules without WordPress.
- Integration-test application services with Woo factories and real database cleanup.
- REST-test authentication, permission callbacks, schema errors, idempotency and resource shape.
- Test HPOS is not directly central to product CRUD, but supported Woo versions and common extensions/product types need a declared compatibility matrix.
- Include multisite only if explicitly supported; do not imply network/multi-store support from a standard single-site install.
