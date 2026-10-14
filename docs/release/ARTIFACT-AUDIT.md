# Release Artifact Audit

The exact ZIP is generated exclusively from `release-manifest.json`. After the
source checkpoint it is inspected file by file and scanned for secrets,
absolute paths, localhost URLs, debug code, release-blocking TODO/FIXME markers,
Lovable metadata, fake products/mock data, Pro/Agency implementation, test
credentials, source maps, temporary files, agent instructions, developer audit
reports, unsupported licenses, and remote executable-code loading.

The final file count, size, SHA-256, generated asset hashes, and scan result are
recorded in `RELEASE-1.0.0.md` and the generated `dist/*.manifest.json`.
