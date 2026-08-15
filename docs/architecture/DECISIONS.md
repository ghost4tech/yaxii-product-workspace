# Approved Architecture Decisions

**Decision date:** 2026-08-12

**Implementation status:** Not implemented in Phase 0

## Current-store WooCommerce boundary

Yaxii Product Workspace manages the WooCommerce store on the same WordPress installation where the
plugin is installed. The approved production flow is:

`React -> same-origin Yaxii WordPress REST endpoints -> PHP application services -> WooCommerce CRUD -> current store`

The local Free product will not require a “Connect WooCommerce” flow. React must not contain WooCommerce
consumer keys, call `/wc/v3` directly, or depend on wildcard CORS. WordPress authentication, REST nonces,
capability checks, validation, and WooCommerce access stay server-side.

## WooCommerce dependency safety

Future plugin implementation must treat missing or inactive WooCommerce as a bounded unavailable state,
never as a fatal site error. It must:

- declare the appropriate WooCommerce dependency for the supported WordPress/WooCommerce matrix;
- guard Woo-dependent bootstrapping at runtime;
- avoid loading Woo-specific classes and services while WooCommerce is unavailable;
- show a bounded admin dependency/unavailable state.

The exact bootstrap and compatibility mechanisms belong to their implementation phase.

## Localization scope

Early engineering phases must make the application translation-ready, RTL-safe, locale-aware, and
compatible with English, French, and Arabic. They do not require a complete translation of the Lovable
application. Full French/Arabic content and visual translation polishing are deferred to later release
work and may use Lovable where useful.
