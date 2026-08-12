# Approved Architecture Decisions

**Decision date:** 2026-08-12

**Implementation status:** Phase 1 frontend boundary implemented; Phase 2 REST and WooCommerce services deferred

## Current-store WooCommerce boundary

Yaxii Product Workspace manages the WooCommerce store on the same WordPress installation where the
plugin is installed. The approved production flow is:

`React -> same-origin Yaxii WordPress REST endpoints -> PHP application services -> WooCommerce CRUD -> current store`

The local Free product will not require a “Connect WooCommerce” flow. React must not contain WooCommerce
consumer keys, call `/wc/v3` directly, or depend on wildcard CORS. WordPress authentication, REST nonces,
capability checks, validation, and WooCommerce access stay server-side.

Phase 1 implements the component/client/repository/adapter frontend boundary and keeps product writes
unavailable. It does not register REST routes or WooCommerce application services.

## WooCommerce dependency safety

Future plugin implementation must treat missing or inactive WooCommerce as a bounded unavailable state,
never as a fatal site error. It must:

- declare the appropriate WooCommerce dependency for the supported WordPress/WooCommerce matrix;
- guard Woo-dependent bootstrapping at runtime;
- avoid loading Woo-specific classes and services while WooCommerce is unavailable;
- show a bounded admin dependency/unavailable state.

Phase 1 implements the guarded admin bootstrap and bounded unavailable shell. Product CRUD compatibility
mechanisms remain Phase 2 work.

## Localization scope

Early engineering phases must make the application translation-ready, RTL-safe, locale-aware, and
compatible with English, French, and Arabic. They do not require a complete translation of the Lovable
application. Full French/Arabic content and visual translation polishing are deferred to later release
work and may use Lovable where useful.

Phase 1 now supplies WordPress locale/direction bootstrap, a central message boundary, locale-aware number
and date formatters, logical-direction layout rules, and root/portal direction inheritance. English remains
the working interface language.
