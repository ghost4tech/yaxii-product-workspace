# Yaxii Product Workspace — Product Reference

**Status:** Product baseline

**Decision date:** 2026-08-12

**Canonical location:** `docs/product/`

## Documents

- `PRODUCT-STRATEGY.md` — target users, positioning, business goals, and Free/Pro decision rules.
- `FREE-V1-SCOPE.md` — exact scope authority for the first WordPress.org release.
- `FEATURE-TIERS.md` — Free, Pro, Agency, Future, and Hidden/Deferred ownership.
- `ROADMAP.md` — implementation and commercial roadmap.

## How to use these files

Before implementing product behavior, agents should read:

1. `FREE-V1-SCOPE.md`
2. `FEATURE-TIERS.md`
3. the relevant implementation documentation under `docs/features/`

These files define **what belongs in the product**. Feature docs define **how shipped behavior actually works**.

## Change policy

- Do not silently move features between tiers.
- Do not delete existing Lovable prototype files merely because a feature is deferred.
- Deferred screens may remain in source but should be hidden from the production Free experience.
- Update these documents when an owner-approved product decision changes.
- Never document planned behavior as shipped behavior.
