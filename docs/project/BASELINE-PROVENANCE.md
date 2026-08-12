# Phase 0 Baseline Provenance

**Recorded:** 2026-08-12

**Scope:** Repository provenance and prototype preservation only

## Outer repository before the baseline

- Root: `C:/Users/Aymen/Local Sites/choufi-store/app/public/wp-content/plugins/yaxii-product-workspace`
- Branch: unborn `main`
- Remote: `https://github.com/ghost4tech/yaxii-product-workspace.git`
- Remote state: no advertised refs before the baseline push
- Index state: no tracked files and no gitlink/submodule entry for `apps/product-butler`

## Approved Lovable prototype source

Before flattening, `apps/product-butler` was an independent Git working tree with:

- Remote: `https://github.com/ghost4tech/product-butler.git`
- Branch: `main`
- Upstream: `origin/main`
- Source commit: `9626666001ef0b8713ae2aec632f78fd9301edec`
- Source tree: `2cef9ee189ef01613c02d604bde8e95af8589058`
- Remote parity: local `HEAD` matched the advertised `origin/main` SHA

The approved working tree differed from that commit only by these intentional tracked deletions:

- `.lovable/plan.md`
- `public/favicon.ico`
- `public/placeholder.svg`
- `public/robots.txt`

Those files remain absent. They were not restored during Phase 0.

## Preservation fingerprint

The approved remaining source contained 109 tracked files. The preservation fingerprint is SHA-256
`68c7d2bdbab5fbf604f76cc2066211388e9329362d0dd16842d17f7aae63f40e`.
It was calculated from the sorted `git ls-files -s` entries at the nested source commit after excluding
the four approved deletions, joined with LF line endings and a final LF.

## Flattening contract

After the provenance facts and fingerprint were captured, the nested `apps/product-butler/.git`
directory was moved outside the workspace to a temporary recoverable backup. All approved remaining
prototype files are ordinary files tracked by the outer repository. The original repository remains
restorable from its remote and recorded source commit.

## Post-flatten verification

- The outer index contains 109 prototype files and exactly matches the approved fingerprint.
- All prototype blobs and modes match the approved source. This includes preserving the imported
  executable mode (`100755`) on `bun.lockb`; the file remains a non-canonical preserved artifact.
- No nested `.git`, `.gitmodules`, submodule configuration, or mode `160000` entry exists.
- Canonical `npm ci` was attempted and failed because the imported manifest and lockfile are out of sync.
- A one-off no-lock diagnostic install left `package-lock.json` unchanged; the placeholder test and
  production build passed, while lint reported 8 errors and 7 warnings in imported source.
- Clean-clone and remote-parity evidence is verified after the baseline commit is created.
