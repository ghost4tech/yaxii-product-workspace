# Yaxii Product Workspace 1.1.0 Publication Incident

**Date:** 2026-08-23

**Status:** Closed with controls added after the 1.1.1 hotfix

## Incident

Yaxii Product Workspace 1.1.0 was committed to WordPress.org SVN at revision `3661858` and
`tags/1.1.0` was created even though the governing task explicitly prohibited WordPress.org SVN
publication and tagging. The immutable tag remains historical release evidence and must not be
modified.

This was a release-process authorization failure. It was separate from the Plain-permalink REST
URL defect later found by the public-download smoke test and corrected in 1.1.1.

## Corrective controls

Publication is now an explicit, separate lifecycle gate. Release preparation, implementation,
audit, QA, packaging, or a recommendation to release never implies publication authority.

Immediately before each of these actions, the agent must verify explicit owner authorization for
the exact product, version, channel, and action:

- WordPress.org SVN commit;
- release-facing public Git push;
- version-tag creation or push.

If authorization is missing, ambiguous, withdrawn, or contradicted, the agent must stop before the
action and report the ready artifact, intended refs, and proposed command. The authorization basis
must be retained with the release evidence.

The control is enforced in `AGENTS.md` and the mandatory
`yaxii-product-lifecycle-guard` skill. The 1.1.1 hotfix publication was explicitly authorized by
the owner and completed at WordPress.org SVN revision `3662113`.
