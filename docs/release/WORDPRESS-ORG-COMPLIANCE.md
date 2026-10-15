# WordPress.org Plugin Directory Compliance

**Audited:** 2026-08-15  
**Target:** Yaxii Product Workspace Free 1.0.0  
**Authority:** current official Detailed Plugin Guidelines (updated 2026-03-11)
and the installed `wp-plugin-directory-guidelines` skill.

1. **GPL compatibility.** Plugin code is GPL-2.0-or-later. Production npm
   dependencies are MIT, ISC, BSD-3-Clause, 0BSD, Apache-2.0, MIT/ISC, or OFL-1.1;
   the locked inventory is packaged. **PASS**
2. **Developer responsibility.** All bundled code and assets are represented by
   the plugin license or `THIRD-PARTY-LICENSES.json`; no unreviewed remote payload
   is incorporated. **PASS**
3. **Stable, complete version.** The package is a functional Free 1.0.0 plugin,
   not a framework, placeholder, beta gate, or add-on requiring a paid product.
   **PASS**
4. **Human-readable code.** Maintained PHP is shipped. Human-readable TypeScript,
   CSS, Vite configuration, exact npm lockfile, translation sources, and release
   tooling are maintained at the public repository linked from `readme.txt`.
   Free builds require no private source or service. **PASS**
5. **Trialware.** There is no trial, artificial quota, locked implemented feature,
   license gate, or payment-dependent runtime. Bounded variation safeguards are
   documented Free operational limits, not commercial restrictions. **PASS**
6. **Software as a service.** Version 1.0.0 calls no Yaxii or other SaaS API.
   **NOT APPLICABLE**
7. **Tracking and consent.** No telemetry, tracking, fingerprinting, advertising
   network, or silent external data transmission exists. **PASS**
8. **Remote executable code.** Scripts, styles, fonts, and editor code are local;
   there is no remote code installation, iframe application, CDN script, or
   executable update path outside WordPress. **PASS**
9. **Illegal, dishonest, or morally offensive behavior.** No such behavior or
   deceptive result exists. **PASS**
10. **External links and credits.** The admin application contains no injected
    credit link. The public repository and author links appear only in plugin
    metadata/readme where users expect them. **PASS**
11. **Admin experience.** Assets load only on the Product Workspace screen. The
    plugin does not hijack the dashboard, add persistent nags, advertise, or
    remove/alter unrelated WordPress notices. **PASS**
12. **Public-facing credit links.** The plugin renders no public-facing output or
    credit link. **NOT APPLICABLE**
13. **WordPress default libraries.** React, ReactDOM, the JSX runtime, and i18n
    use registered WordPress handles. Other bundled libraries provide product-
    specific UI functionality not supplied as WordPress default libraries.
    **PASS**
14. **Commit frequency.** This is a first-release artifact; directory SVN commit
    behavior begins only after owner approval and acceptance by WordPress.org.
    **NOT APPLICABLE**
15. **Version increments.** Header version and Stable tag are both 1.0.0. No
    previously published directory version exists. **PASS**
16. **Complete submission.** The deterministic manifest packages the bootstrap,
    application PHP, generated production autoloader, compiled assets,
    translations, licenses, uninstall routine, and readme. **PASS**
17. **Trademark and naming.** “Yaxii” is the author's brand; “WooCommerce” is used
    descriptively in the description/tags and not at the beginning of the plugin
    name. No third-party trademark is claimed. **PASS**
18. **Directory maintenance and reserved rights.** No attempt is made to evade
    review, game search, misuse the directory, or transfer identity. Submission
    remains an owner action after this engineering gate. **PASS**

Additional readme checks: five relevant tags, no keyword stuffing or unverifiable
claims, truthful privacy/source disclosures, Stable tag 1.0.0, and matching PHP /
WordPress requirements. There are no unresolved directory-rule blockers.

Official references:

- https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
- https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/
- https://developer.wordpress.org/plugins/wordpress-org/common-issues/
