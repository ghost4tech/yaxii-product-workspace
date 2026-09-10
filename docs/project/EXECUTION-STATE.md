# Execution State

**Updated:** 2026-09-10

**Current work:** 1.1.2 released; translation-project follow-up remains

**Acceptance state:** 1.1.2 RELEASED AND PUBLIC-DOWNLOAD VERIFIED

## Repository authority

- Private engineering authority: `https://github.com/ghost4tech/yaxii-product-workspace-internal.git`
- Public curated Free source: `https://github.com/ghost4tech/yaxii-product-workspace.git`
- Private historical archive: `https://github.com/ghost4tech/yaxii-product-workspace-history.git`
- Active branch: `release/1.1.2-woocommerce-interoperability`
- Private branch baseline: `b041e5d904c804b5acb1bcac4a641411e02467af`

Active development and release branches belong only in the private internal repository. Public
`dev` and `main` are curated exports, not development targets. Private Git history must never be
merged into a public branch. The history repository is not part of normal development.

## 1.1.2 scope

- Native and Workspace-created Simple and Variable products share one compatibility path.
- Find Product resolves a variation SKU to its supported parent and accepts ordinary WooCommerce
  data without Yaxii-owned metadata.
- Variable hydration preserves global/custom attributes and uses child-owned edit-context values.
- WooCommerce list/editor entry points and one read-only Product Workspace deep-link contract are
  implemented.
- Product Workspace exposes a compact return link to the native WooCommerce editor.
- Unsupported product types receive a bounded state and are not expanded into 1.1.2 support.

Implementation details and regression scope are in
`docs/features/woocommerce-interoperability.md`. Gate and runtime evidence are recorded in
`docs/project/RELEASE-1.1.2-IMPLEMENTATION-EVIDENCE.md`.

## Release boundary

The runtime version is `1.1.2`. The owner accepted implementation commit
`f1dd985b609f36a29c4840e1b7d39c3162a57cc3`. All material release gates passed; public `dev` is
`ecdfcec840a0adac9ca85cd48bdce7d4734ebca6`, public `main` is
`c0dce6cb567e717abbad1ee1cbf672a52378ba78`, WordPress.org SVN revision `3690446` is serving the
verified release, and public tag `v1.1.2` targets public `main`. Full evidence is in
`docs/project/RELEASE-1.1.2-EVIDENCE.md`.
