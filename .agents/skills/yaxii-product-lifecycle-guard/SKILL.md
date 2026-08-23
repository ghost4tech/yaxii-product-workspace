---
name: yaxii-product-lifecycle-guard
description: >
  Lifecycle, release, repository, compliance, localization, packaging, publication,
  and post-release guard for Yaxii WordPress/WooCommerce products. Use whenever
  planning or implementing a feature, bug fix, version, release, WordPress.org
  publication, public-repo sync, translation, product listing, or post-release work.
  Its job is to preserve lessons from previous releases, identify the correct next
  workflow step, prevent premature releases/tags/pushes, and adapt the process to
  each Yaxii product.
license: Internal Yaxii engineering guidance.
---

# Yaxii Product Lifecycle Guard

## Purpose

This skill prevents Yaxii from solving the same release/process problem repeatedly.

Treat every Yaxii product as a lifecycle, not a collection of isolated coding tasks.

Whenever work affects a Yaxii product, think beyond the immediate implementation and ask:

- What state is this product currently in?
- What must happen before this work is considered complete?
- What previous release/compliance lessons must carry forward?
- What is the next logical gate after this task?
- Is there known unfinished work that makes a release premature?
- Will this change affect packaging, translations, public source, WordPress.org, documentation, assets, or version metadata?
- What should be recorded now so a future agent does not have to rediscover it?

The goal is not bureaucracy.

The goal is to make Yaxii releases:

- repeatable;
- safe;
- fast;
- compliant;
- reproducible;
- easier to maintain;
- resistant to forgotten release steps.

---

# 1. When this skill applies

Use this skill whenever a task involves or may affect:

- new Yaxii products;
- feature implementation;
- UX work;
- bug fixes;
- security fixes;
- release preparation;
- version bumps;
- changelogs;
- WordPress.org;
- SVN;
- public Git repositories;
- private/internal repositories;
- release ZIPs;
- packaging;
- translations;
- localization;
- Plugin Check;
- compatibility testing;
- screenshots/icons/banners;
- yaxii.dev product publication;
- public launch;
- post-release verification;
- hotfixes;
- release branches;
- tags;
- merging;
- repository restructuring.

Skip detailed release checks for genuinely isolated backend experiments or research, but still consider whether the result changes the product lifecycle.

---

# 2. Establish product context first

Before making release-sensitive decisions, identify:

- Product name
- Current released version
- Version being developed
- Current branch
- Repository role
- Distribution channels
- WordPress.org slug, if applicable
- Minimum WordPress/PHP/WooCommerce requirements
- Whether the product is Free, Premium, Add-on, Theme, or internal/client-specific
- Known open bugs
- Known deferred work
- Current release state

Never guess these when repository evidence exists.

Prefer repository documentation, Git refs, release evidence, and actual package metadata over stale conversation summaries.

---

# 3. Repository authority

Yaxii may use multiple repositories for one product.

Always determine their roles before pushing.

Typical pattern:

PRIVATE INTERNAL
→ engineering authority
→ full source
→ internal documentation
→ agent instructions
→ future/private work

PUBLIC DEV
→ curated human-readable Free source
→ build tooling
→ public development source where applicable

PUBLIC MAIN
→ curated release-facing tree

WORDPRESS.ORG SVN
→ distributed WordPress.org runtime package + directory assets

Never assume a remote called `origin` is the correct destination.

Before every release-sensitive push:

1. inspect `git remote -v`;
2. verify the remote URL;
3. verify expected remote SHA using `git ls-remote`;
4. verify branch purpose;
5. only then push.

Feature/release-development branches belong in the private internal repository unless explicitly designed otherwise.

Never expose private/internal history through a public feature branch.

---

# 4. Preserve historical release lessons

Before beginning a new version, audit the previous final release for fixes that must carry forward.

Examples:

- WordPress.org compliance fixes;
- packaging exclusions;
- build-script fixes;
- security fixes;
- prefixes/namespaces;
- translation rules;
- uninstall behavior;
- dependency metadata;
- Plugin Check fixes;
- privacy disclosures;
- source/build disclosure;
- runtime asset staging;
- repository-boundary rules.

Do not assume a feature branch created before the previous release automatically contains later compliance fixes.

If histories diverged:

- compare the actual trees;
- surgically port missing changes;
- do not blindly merge unrelated histories;
- preserve both the new version work and final previous-release corrections.

A new version must never regress compliance already solved in an older version.

---

# 5. Use lifecycle checkpoints

Meaningful work should produce explicit checkpoints.

Typical version lifecycle:

## A. Baseline

Establish clean branch and known source state.

## B. Feature / UX implementation

Implement approved scope.

## C. Owner review

Verify visual/product behavior before finalizing.

## D. Known-bug audit

Before release, review known bugs and merchant feedback.

## E. Compliance carry-forward

Ensure previous release fixes remain present.

## F. Release hardening

Tests, compatibility, packaging, privacy, performance, security.

## G. Version finalization

Version numbers, changelog, stable tag, manifests.

## H. Release artifact

Build deterministically from clean source.

## I. Public-source synchronization

Export only the intended public tree.

## J. Distribution

WordPress.org SVN / Yaxii platform / private updater as applicable.

## K. Post-release verification

Install the version from its REAL distribution channel and smoke-test it.

## L. Closeout

Record hashes, tags, revisions, release evidence, remaining known issues.

Do not skip directly from implementation to publication.

## Publication authorization gate

Release preparation, implementation, audit, QA, packaging, or a recommendation to release does
not authorize publication. Immediately before each irreversible release action, verify that the
owner has explicitly authorized the exact product, version, channel, and action in the current
task or a later owner message.

This separate authorization is required immediately before:

- committing to WordPress.org SVN;
- pushing a release-facing public Git branch or commit;
- creating or pushing a version tag.

If that authorization is absent, ambiguous, withdrawn, or contradicted by the task, stop before
the action. Report the ready artifact, intended refs, and exact pending command instead. Never
infer publication authority from an implementation, audit, release-candidate, or end-to-end QA
request. Record the authorization basis with the release evidence.

---

# 6. Do not release with unresolved known blockers

Before recommending a release, explicitly ask:

- Are there known reproducible bugs?
- Are there unfinished fixes already intended for this version?
- Are compliance tasks incomplete?
- Are translations broken?
- Are packaging gates incomplete?
- Is the release artifact unverified?
- Is there an accepted UX phase that still needs functional validation?

If yes, distinguish:

### Blocker

Must be fixed before release.

Examples:

- data corruption;
- fatal errors;
- broken product creation;
- security issue;
- known critical workflow failure;
- compliance violation;
- release packaging missing runtime code.

### Non-blocker

Can intentionally ship and be documented.

Examples:

- minor cosmetic issue;
- optional asset imperfection;
- future enhancement;
- harmless UI polish.

Do not silently classify issues. State the reasoning.

---

# 7. Version tags are release artifacts

Never create a final semantic version tag merely because one phase is complete.

For example:

Do not create:
`v1.1.0`

after UX work if bug fixes, QA, packaging, or release hardening remain.

Use commits/branches as checkpoints.

Create the version tag only when the complete release is final and the product's workflow says tagging is appropriate.

Premature tags create false release history.

---

# 8. Release packages are not development trees

Always distinguish:

DEVELOPMENT SOURCE
from
DISTRIBUTED RUNTIME PACKAGE.

A Yaxii WordPress.org runtime package may intentionally exclude:

- frontend TypeScript/React source;
- tests;
- node_modules;
- internal docs;
- agent files;
- private references;
- .env;
- development-only translation artifacts;
- build caches;
- prototype applications.

But it must include everything required at runtime:

- PHP runtime code;
- required Composer runtime;
- compiled JS/CSS;
- runtime data/config;
- readme/license/notices;
- required runtime assets.

Human-readable source may be supplied through a documented public source repository where allowed.

Never copy the whole development directory into a release package.

Use an explicit release manifest.

---

# 9. Never manually patch final ZIPs

Final release artifacts must come from the release process.

Avoid manually editing/repacking a ZIP after validation.

A manually edited ZIP breaks:

- reproducibility;
- manifest hashes;
- provenance;
- source/package equivalence.

If metadata must change:

1. change source;
2. rebuild;
3. rerun relevant validation;
4. generate a new hash;
5. update release evidence.

The final hash must identify the exact artifact distributed to users.

---

# 10. Deterministic release requirement

For important releases:

- build from a clean checkout;
- account for Windows CRLF/autocrlf issues;
- avoid untracked source dependencies;
- rebuild independently where practical;
- compare hashes.

Prefer at least two clean-build reproductions for WordPress.org/public releases.

If byte-identical reproduction is expected but fails, investigate before publishing.

---

# 11. WordPress.org compliance guard

For WordPress.org products, audit before every meaningful release.

Check:

- GPL compatibility;
- no prohibited trialware;
- no locally locked premium functionality;
- no license key unlocking bundled Free code;
- serviceware rules;
- prefixes/namespaces;
- capabilities;
- nonces;
- sanitization;
- validation;
- escaping;
- REST permissions;
- dependency declaration;
- uninstall/privacy behavior;
- readme format;
- Tested up to;
- Stable tag;
- Contributors;
- source/build availability;
- third-party licenses;
- Plugin Check;
- package boundary.

Never assume passing a previous review means future versions automatically comply.

---

# 12. Free vs Pro rule

For WordPress.org Free products:

Free must be genuinely functional.

Do not include premium implementation inside the WordPress.org plugin and lock it behind:

- license;
- payment;
- account;
- trial;
- quota intended for upgrade;
- entitlement.

Future paid functionality should normally live in a separate add-on/private product.

Technical safety limits are allowed only when genuinely technical and applied universally.

Never describe a universal technical safeguard as:

- Free limit;
- Free plan limit;
- upgrade to increase;
- premium restriction;

unless that architecture is actually permitted and intended for a distribution channel outside WordPress.org.

Use truthful wording such as:

- maximum supported in a single save;
- per-operation safety boundary;

only when technically accurate.

---

# 13. Translation lifecycle

Development translation assets and WordPress.org distribution are different concerns.

Development may retain:

- POT;
- PO;
- MO;
- WordPress-compatible JSON;
- translation-generation tooling.

WordPress.org runtime packaging should follow current WordPress.org policy.

For directory-hosted plugins:

- do not reintroduce bundled PO/MO after the Plugin Team requested their removal;
- use WordPress-native gettext/wp.i18n;
- use `wp_set_script_translations()`;
- use WordPress user locale;
- rely on WordPress.org language packs for production translation distribution where applicable.

Keep translation source in development so it can be maintained and imported into translate.wordpress.org.

Always test:

- English fallback;
- French if supported;
- Arabic if supported;
- RTL;
- lazy/static chunks;
- dialogs/popovers;
- editor surfaces;
- user locale rather than only site locale.

Do not claim a translation is publicly available until the language pack is actually distributed.

---

# 14. Translation build integrity

React/Vite optimization can silently break WordPress translation extraction.

Release gates for localized Yaxii React products should verify:

- all expected gettext calls remain extractable after production build;
- literal gettext usage survives minification;
- extraction count matches expected catalog count;
- translated surfaces load after navigation;
- no raw keys appear;
- missing language packs fall back cleanly to English.

Do not assume a development translation proves the production build is translatable.

---

# 15. WordPress.org release layout

Typical SVN structure:

/
trunk/
tags/
assets/

`trunk/`
contains current plugin runtime.

`tags/x.y.z/`
contains immutable release version.

`assets/`
contains WordPress.org listing assets such as:

- icons;
- banners;
- screenshots.

Do not confuse top-level WordPress.org `/assets` with the plugin's internal runtime `/assets`.

Existing version tags should remain untouched.

For 1.1.0:

- update trunk;
- create tags/1.1.0;
- preserve tags/1.0.0.

---

# 16. WordPress.org assets guard

Listing assets are independent of runtime releases.

Use correct filenames, for example:

- icon-128x128.png
- icon-256x256.png
- banner-772x250.png
- banner-1544x500.png
- screenshot-1.png
- screenshot-2.png

Directory assets belong in top-level SVN `/assets`.

They must not accidentally enter the plugin ZIP.

An asset-only improvement does not necessarily require a new plugin version.

---

# 17. Readme / discoverability lifecycle

Before a major public launch or meaningful positioning change, review:

- short description;
- tags;
- Description;
- feature structure;
- FAQs;
- screenshots/captions;
- Installation;
- Privacy;
- Changelog;
- Tested up to;
- Stable tag.

Optimize for legitimate search intent.

Do not keyword-stuff.

Do not invent ranking rules.

Describe what the current version actually does.

Do not advertise future features as current capabilities.

---

# 18. Yaxii platform publication

WordPress.org publication and yaxii.dev publication are separate lifecycle steps.

For Free lead-generation products on yaxii.dev:

- clearly state Free status;
- account-gated Yaxii download may be used for lead capture;
- do not imply Yaxii registration is technically required by the plugin when it is not;
- if also on WordPress.org, be transparent about availability there;
- connect downloads to the Yaxii account/product ecosystem where useful.

Prepare:

- product metadata;
- features;
- requirements;
- changelog;
- FAQs;
- screenshots;
- SEO title/meta;
- EN/FR/AR content as appropriate.

---

# 19. Post-release verification

A release is not finished when the upload/commit succeeds.

Install/update from the REAL public channel.

For WordPress.org:

- wait for directory processing;
- install from WordPress.org itself;
- verify activation;
- verify critical workflows;
- inspect PHP logs;
- inspect browser console/network;
- compare packaged file tree where useful;
- verify public page/version/assets/readme.

For Yaxii distribution:

- download through the actual customer/account flow;
- install the delivered package;
- verify checksum/package version;
- verify licensing/update behavior where applicable.

Only then close the release.

---

# 20. Release evidence

Every production release should leave enough evidence that another agent can answer:

- What source produced this release?
- What was published?
- Which tests passed?
- What is the artifact hash?
- Which public Git SHA corresponds to it?
- Which WordPress.org SVN revision/tag corresponds to it?
- What known issues remain?
- What must the next version carry forward?

Record relevant values in project release documentation.

Do not rely only on chat history.

---

# 21. Carry-forward checklist for every new version

When starting version N+1, explicitly verify carry-forward of:

- compliance fixes from N;
- security fixes;
- build/release manifest;
- package exclusions;
- translation architecture;
- current dependencies;
- WordPress/WooCommerce compatibility metadata;
- uninstall behavior;
- privacy;
- source/public repo rules;
- Plugin Check fixes.

This should happen before release hardening, not after a reviewer discovers regressions.

---

# 22. Customize per Yaxii product

This skill is generic.

Before applying detailed release rules, inspect the product's own documentation.

Prefer a product-specific profile when available, such as:

`docs/product/PRODUCT-RELEASE-PROFILE.md`

The profile may define:

- product name;
- slug;
- product type;
- current version;
- internal repo;
- public repo;
- SVN URL;
- distribution channels;
- build command;
- release directory;
- package exclusions;
- minimum versions;
- translation strategy;
- testing matrix;
- licensing model;
- release asset requirements.

Product-specific rules override generic examples in this skill.

Never copy another product's:

- paths;
- slug;
- SVN URL;
- version;
- repository;
- .env values;
- release directories;

without verifying and adapting them.

---

# 23. Proactive workflow behavior

Do not wait for the owner to remember every next step.

When completing a task, briefly determine whether there is an obvious lifecycle follow-up.

Examples:

After UX implementation:
→ recommend browser QA before commit.

After UX approval:
→ recommend checkpoint commit, then known-bug audit.

Before release:
→ check known bugs and compliance carry-forward.

After version code is complete:
→ recommend version bump/changelog/release hardening.

After WordPress.org approval:
→ recommend SVN publication + directory assets.

After WordPress.org release:
→ recommend public-channel install smoke test.

After translation architecture:
→ remind about translate.wordpress.org language-pack publication.

After a Free plugin launch:
→ consider yaxii.dev listing, docs, SEO, launch content, and lead capture.

Do not create unnecessary work.
Recommend only the next steps that materially reduce risk or improve the product/business.

---

# 24. Ruthless release rule

Do not call something "ready" merely because implementation is finished.

"Ready to release" means:

- intended scope complete;
- known blockers resolved;
- previous compliance preserved;
- tests pass;
- runtime QA passes;
- package audited;
- metadata/version correct;
- release source identified;
- artifact reproducible;
- distribution plan ready.

If one of these is intentionally deferred, explicitly classify it as non-blocking and explain why.

---

# 25. Avoid overengineering

This guard must not become bureaucracy.

For every proposed step ask:

Does this materially improve:

- safety;
- reliability;
- compliance;
- reproducibility;
- customer trust;
- release speed next time?

If no, skip it.

Prefer reusable automation/checks over repetitive manual procedures.

If the same release mistake or manual check happens twice, consider turning it into:

- a release script;
- CI check;
- guard;
- test;
- repository documentation;
- reusable skill rule.

The system should become better after every release.

---

# 26. Final principle

Every Yaxii release should make the next release easier.

When a new lesson is discovered:

1. fix the immediate issue;
2. identify the class of failure;
3. automate or document prevention;
4. carry the lesson into future versions/products.

Never solve an important release/process problem only once.
