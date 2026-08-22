# Yaxii Product Workspace — Release Profile

Product: Yaxii Product Workspace
Slug: yaxii-product-workspace
Type: Free WordPress.org WooCommerce plugin

Internal repository:
ghost4tech/yaxii-product-workspace-internal

Public repository:
ghost4tech/yaxii-product-workspace

WordPress.org SVN:
https://plugins.svn.wordpress.org/yaxii-product-workspace

Development authority:
Private internal repository

Public source:
Public `dev`

Release-facing Git:
Public `main`

WordPress.org runtime:
SVN trunk + version tag

Frontend:
React / Vite

Translation:
WordPress gettext + wp.i18n + wp_set_script_translations
WordPress.org language packs for public translations

Release exclusions:

- frontend source app
- tests
- internal docs
- agent files
- .env
- node_modules
- PO/MO
- development translation JSON

Release requirements:

- compiled frontend runtime assets
- POT
- PHP runtime
- Composer runtime
- readme
- licenses/notices

Minimum:
WordPress 7.0+
PHP 8.1+
WooCommerce required

Current public release:
1.0.0

WordPress.org SVN release revision:
3657382
