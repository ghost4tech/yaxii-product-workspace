# Yaxii Product Workspace Frontend

This directory contains the approved Lovable presentation and the production-safe adapter boundary
used by the WordPress plugin. The Lovable application is the production presentation layer; do not
replace it with a parallel recreation.

Run canonical frontend commands from this directory. See
[Development Tooling](../../docs/development/TOOLING.md) for the supported commands and
[Frontend Production Boundary](../../docs/architecture/FRONTEND-PRODUCTION-BOUNDARY.md) for the
architecture and deferred-source rules.

The local Vite adapter has no WooCommerce writes and no mock catalog. WordPress production assets are
built to `../../assets/build`.
