# Release Performance Audit

**Measured:** 2026-08-15 on LocalWP, WordPress 7.0.4, WooCommerce 10.9.4,
PHP 8.3.23, warm application process.

## Frontend

Plugin assets are enqueued only when `page=yaxii-product-workspace`. React,
ReactDOM, JSX runtime, and i18n are provided by WordPress handles instead of a
second bundled copy. The prior 544 kB TipTap vendor warning was investigated and
eliminated without redesign: the editor chunk is 406.72 kB after WordPress React
externalization. Current minified JavaScript chunks are approximately 210.26 kB
(main), 260.39 kB (vendor), 136 kB (UI), and 406.72 kB (editor), plus scoped CSS
and self-hosted fonts. No source maps ship.

The editor remains part of the entry workflow, so speculative lazy-loading was
not introduced for release. The measured externalization is the safe meaningful
win; further splitting would add lifecycle risk without proving user benefit.

## Server reads

`tools/performance-probe.php` measured authenticated REST dispatch:

| Route | Bound | Queries | Elapsed |
|---|---:|---:|---:|
| Products | 20/page | 108 | 48.82 ms |
| Categories | 50/page, root | 3 | 1.63 ms |
| Operations | 20/page | 3 | 2.80 ms |
| Operation summary | one aggregate | 1 | 1.10 ms |

The product resource is query-heavier because it returns editable WooCommerce
objects, but it is paginated and never loads the full catalog into the browser.
Enabling WordPress term/meta cache priming was tested (108 queries, 49.61 ms) and
reverted because it did not improve this route.

Search is server-paginated and client requests are debounced/cancelable.
Category, queue, and KPI queries are bounded. Variation plans are capped at five
attributes, twenty options per attribute, and fifty combinations; a save uses a
single application request rather than one browser request per variation.

No release-blocking performance defect was measured. Product-query count remains
a known non-blocking profiling target for a future evidence-led optimization.
