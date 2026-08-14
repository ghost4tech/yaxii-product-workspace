# Phase 4.5 Lovable V2 integration map

The source under `apps/product-butler-v2` is the approved presentation authority. The production application under `apps/product-butler` and the PHP application/REST/WooCommerce layers remain the behavior authority.

| Lovable V2 surface | Existing production capability | Integration scope | Contract work |
| --- | --- | --- | --- |
| `CategoryTreeSelect` | Product requests and canonical products already use multiple `category_ids`; WooCommerce CRUD already validates and round-trips them. | Reuse the V2 tree, checkboxes, collapse/expand, search, recents, chips, removal, and count presentation. | Extend category reads with bounded roots, lazy paged children, selected-ID hydration, and search ancestor context. Do not change product writes. |
| `RichTextEditor` and `DescriptionFields` | `description` and `short_description` already round-trip through WooCommerce; PHP applies `wp_kses_post()` before persistence. | Reuse the V2 TipTap toolbar, prose styles, compact Short/Full switch, and extended side-by-side layout. | Add durable WordPress media upload/selection for inserted images; reject temporary blob/base64 persistence. |
| V2 `ImageUpload` | Product gallery order is already `image_ids`; the first ID is the featured image, remaining IDs are the gallery, and edit hydration returns real attachment IDs/URLs. | Reuse the V2 empty dropzone, drag overlay, compact add action, tighter gallery, reorder, Make main, and remove interactions. | Direct file drops must create WordPress attachments before entering submit-ready state. Existing product contract stays unchanged. |
| Editing banner and `Update product` state | Phase 3 loads canonical products, enforces product type/version conflicts, updates instead of creating, and supports cancel/reset/trash. | Reuse the V2 banner, Cancel action, and update label while retaining the production controller. | None. |
| `SaveSuccess` | Create/update hooks already expose server-authoritative canonical products and partial/failure states. | Show the V2 success surface only after a real successful create/update response; dismiss immediately on user action and avoid an artificial blocking delay. | Add controller outcome callbacks only; no fake local success or backend change. |
| `HelpTip`, `Explain`, `showTooltips` | Theme/density/focus preferences already have a bounded local UI-preference store; workflow defaults remain server-backed. | Reuse the V2 tooltip components and Settings toggle. Tooltips remain Free. | Local UI preference only; no entitlement or product API change. |
| V2 Attributes -> Preview -> Variations | Phase 4 owns real global attribute IDs/taxonomies/term IDs, custom attributes, stable concrete combinations, per-variation fields/images, 5/20/50 limits, validation, idempotency, partial recovery, and reconciliation. | Reuse the V2 step strip, badges, chips/swatches where real term data exists, custom chip entry, preview, generate/regenerate, limit state, compact/advanced rows, Set all price, Auto SKU, and missing-price state. | Adapt V2 components directly to Phase 4 `VariableAttribute`/`VariationCombination`; never use V2 mock attributes or its duplicate combination domain. Direct variation-image picks must return WordPress attachment IDs. |

## Scope boundary

- `apps/product-butler-v2` remains the source reference and is not the production runtime.
- Production does not import `mockData`, direct WooCommerce browser credentials, fake products, fake categories, fake attributes, local-only product success, or client-controlled entitlement.
- Existing product, operation, idempotency, recovery, capability, and WooCommerce contracts are preserved unless a row above explicitly identifies an additive contract change.
