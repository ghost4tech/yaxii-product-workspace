# CLAUDE.md — Yaxii Product Workspace

@AGENTS.md

## Claude Code working agreement

This file intentionally stays small. `AGENTS.md` is the shared engineering contract for this repository and is imported above.

### Before substantial work

- Inspect the repository, current Git state, relevant code, tests, and existing documentation before proposing changes.
- Use the applicable installed WordPress Agent Skills instead of guessing WordPress/WooCommerce conventions.
- For multi-step or risky work, make a short implementation plan first and keep the scope limited to the requested MVP slice.
- Preserve the approved Lovable UX unless the task explicitly changes it.
- Never infer that a mocked or visually complete prototype feature is production-ready.

### During implementation

- Prefer the smallest clean solution that satisfies the requirement.
- Do not introduce speculative Pro/Agency architecture into Free MVP work.
- Do not delete existing prototype files or screens unless the owner explicitly approves deletion.
- Do not hide failures behind fallback success states, broad catches, or optimistic UI that cannot be reconciled with the server.
- Keep documentation and tests aligned with behavior as the feature is implemented, not as an afterthought.

### Review discipline

Before presenting implementation work as complete:

1. Review the actual diff and check for unintended scope changes.
2. Run the relevant tests/static checks available in the repository.
3. Run the relevant guard skills:
   - `clean-code-guard` for production code.
   - `wp-guard` for WordPress code.
   - `woo-guard` for WooCommerce code.
   - `test-guard` for tests.
   - `docs-guard` for documentation.
4. Fix actionable findings before completion unless explicitly documented as accepted debt.
5. Re-run affected checks after fixes.

### Completion report

Report concisely:

- what changed;
- important architectural decisions;
- tests/checks actually run and their result;
- guard skills run and their result;
- docs created/updated;
- remaining limitations or risks;
- current Git branch and commit SHA when applicable.

Never claim a test, runtime flow, integration, or review passed unless it was actually executed.
