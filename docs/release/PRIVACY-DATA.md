# Privacy, Retention, and Uninstall

Yaxii Product Workspace 1.0.0 has no telemetry, tracking, advertising, license
call, external API, or remote data service.

## Stored data

- `{prefix}ypw_operations`: site/user-scoped operation identity, status,
  request hash, result/error data, timestamps, and product relationship used for
  idempotency, recovery, and the queue.
- `ypw_operation_schema_version`: the installed operation-ledger schema version.
- User meta `ypw_workspace_preferences_v1`: theme, density, and bounded workspace
  preferences.
- Browser `sessionStorage` key `ypw.product-draft.v2`: a versioned draft capped
  at 300,000 bytes for the current browser tab/session. Browsers clear this on
  their own session lifecycle; a site-side uninstall cannot reach browser data.
- Internal product/variation meta `_ypw_operation_id`, `_ypw_attribute_keys`, and
  `_ypw_combination_id`: write reconciliation and variable-product mapping.

Normal WooCommerce products, variations, categories, tags, global attributes,
terms, and media are merchant catalog data, not disposable plugin-owned records.

## Deactivation

Deactivation stops the plugin without deleting data. This avoids unexpected
merchant history or preference loss and permits safe reactivation.

## Uninstall

`uninstall.php` removes the plugin operation table, schema option, all workspace
preference user meta, and the three internal Yaxii marker meta keys on each site.
On multisite it visits each site's own tables/options. It never deletes
WooCommerce products, variations, terms, attributes, or media.

Uninstall cannot delete session storage already present in a user's open browser
tab. Users can close the tab/browser session or clear site storage to remove it.
