# Product Workspace Frontend

This package builds the Yaxii Product Workspace React application mounted by the WordPress plugin. The
maintained Phase 1 entrypoint is `src/main.tsx`, and its production implementation lives under
`src/production`.

The imported Lovable prototype remains elsewhere under `src` as preserved product and UX reference. It is
not part of the WordPress production execution graph.

## Development

Use npm from this directory:

```sh
npm ci
npm run dev
```

The standalone development host uses deterministic queue fixtures that are visibly labelled as non-store
data. It does not connect to WooCommerce.

Run the authoritative frontend gate with:

```sh
npm run check
```

That command runs strict TypeScript, ESLint, the maintained-file line limit, Vitest, the production Vite
build, and the built-boundary scan. The build writes the manifest and hashed assets to the plugin-level
`assets/build` directory.

See `../../docs/development/TOOLING.md` and `../../docs/architecture/FRONTEND-PRODUCTION-BOUNDARY.md` for the
complete command and architecture contracts.
