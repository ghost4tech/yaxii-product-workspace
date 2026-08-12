# Feature matrix

Status: A functional frontend-local; B UI-complete but mocked; C partial; D decorative/dead; E concept only. “Functional” never implies a verified WooCommerce backend.

| Feature | Current location | Functional status | Mock dependency | WooCommerce mapping | Complexity | User value | Agency value | Recommended tier | Keep/Improve/Remove | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Application shell/navigation | Global `AppShell` | A | Active store/tier are mock | Admin screen only | Medium | High | Medium | Free | Improve | Keep visual system; WordPress-safe router/bootstrap. |
| Simple product entry | `/` form | C | Category data/queue fixtures | `WC_Product_Simple` CRUD | High | Very high | High | Free | Improve | Core vertical slice. |
| Product name | `/` Essentials | A | None | Product name | Low | Very high | High | Free | Keep | Server validation still required. |
| Product type | `/` variable switch | C | None | Simple/Variable subtype | High | High | High | Free | Improve | Use discriminated model. |
| Regular price | `/` Essentials | A | `$` display assumptions | Regular price | Medium | Very high | High | Free | Improve | Store precision/currency formatting. |
| Sale price/schedule | `/` Extended | A | None | Sale price/dates | Medium | High | Medium | Free | Improve | Define timezone and validation. |
| SKU | `/` Extended | A | None | Product SKU | Medium | High | High | Free | Improve | Add uniqueness/collision handling. |
| Stock quantity | `/` Extended | A | None | Manage stock/quantity/status | Medium | High | High | Free | Improve | Current global-default semantics unclear. |
| Descriptions | `/` Extended | A | AI claim is mock | Product descriptions | Medium | High | Medium | Free | Improve | Define HTML/editor/sanitization. |
| Status/visibility | Settings only | C | None | Product status/catalog visibility | Medium | Very high | High | Free | Improve | Must be per product, capability-aware. |
| Tax status | Settings only | C | None | Tax status | Medium | High | High | Free | Improve | Add per-product and tax class. |
| Shipping fields | Absent | E | None | Weight/dimensions/class | Medium | High | High | Free | Add | Required physical-product coverage. |
| Categories | `/` picker | C | Starts empty | `product_cat` terms | Medium | Very high | High | Free | Improve | Paged search/hierarchy/create policy. |
| Tags | Absent | E | None | `product_tag` terms | Low | Medium | Medium | Free | Add | Basic catalog field. |
| Product-local attributes | Variable editor | C | None | `WC_Product_Attribute` | High | High | High | Free | Redesign | Current add button broken. |
| Global attributes/terms | Absent | E | None | `pa_*` taxonomies/terms | High | Very high | High | Free | Add | Prefer reusable global attributes. |
| Basic variation combinations | `/` variable area | C | None | `WC_Product_Variation` | Very high | Very high | High | Free | Redesign | Current option model is semantically wrong. |
| Advanced variation matrix | Not genuinely present | E | Marketing implication | Batch variation operations | Very high | High | High | Pro | Add later | Bulk fill/rules/virtualization. |
| Product gallery | `/` image picker | C | Browser object URLs | WP attachments + gallery IDs | High | High | High | Free | Improve | Media frame/upload/alt/accessibility. |
| Variation image | Variable option editor | C | Unreachable flow | Variation attachment ID | Medium | Medium | High | Free basic | Redesign | Attach to concrete combination. |
| Draft autosave | Global draft store | C | localStorage | Browser-only draft | Medium | High | Medium | Free | Improve | Version/TTL, exclude File/secrets. |
| Save & next | `/` | C | Local queue when offline | Create operation | High | Very high | High | Free | Keep/Improve | Honest server result required. |
| Form clear | `/` | A | None | Browser-only | Low | Medium | Low | Free | Keep | Centralize keyboard behavior. |
| Keep values after save | Settings + Entry | C | localStorage | Browser/user preference | Medium | Very high | High | Free | Improve | Explicit retained-field contract. |
| Product edit | Queue menu | D | Toast only | GET/PATCH product | High | Very high | Very high | Free | Replace | Mandatory. |
| Duplicate latest | Command/shortcut | C | Local queue | Read + frontend prefill or duplicate service | Medium | High | High | Free | Improve | Arbitrary row action; preview copy. |
| Trash/delete | Queue menu | A local | Local products | Trash product for persisted item | Medium | High | High | Free | Improve | Distinguish queue removal vs store trash. |
| Undo delete | Header/shortcut | A local | Local single slot | Browser undo or restore service | Medium | Medium | Medium | Free | Keep/Improve | Recovery semantics depend on delete type. |
| Queue status list | `/` Queue | A local | Random seeded products | Operation/recent product resources | High | Very high | High | Free | Keep/Improve | Server-authoritative states. |
| Queue search/filter | `/` Queue | A local | Fixture list | Server query filters | Medium | High | High | Free | Keep/Improve | Debounce/cancel/paginate. |
| Queue load more | `/` Queue | C | Full local array | Server pagination/cursor | Medium | Medium | High | Free | Replace internals | Current slice is not real paging. |
| Retry sync | Error row menu | C | Mock error; direct create | Retry operation | High | High | High | Free manual | Redesign | Idempotent; current disconnected path lies. |
| Open in Woo admin | Queue row | C | Persisted URL/ID | Validated same-site edit URL | Low | Medium | High | Free | Improve | Server returns URL. |
| KPI strip | `/` top | C | Random/local queue | Operation aggregates | Medium | Medium | Medium | Free basic | Improve | Truthful denominator/labels. |
| Command menu | Global | A | Tier action is mock | Browser navigation/actions | Medium | High | Medium | Free | Keep/Improve | Remove plan bypass. |
| Keyboard shortcuts | Global/form/queue | C | None | Browser-only | Medium | High | Medium | Free | Improve | Central registry, test focus conflicts. |
| Theme light/dark/system | Settings/global | A | None | WP user preference | Medium | High | Medium | Free | Keep | Token-based; server/user persistence. |
| Compact density | Settings/global | A | None | WP user preference | Low | High | High | Free | Keep | Apply consistently. |
| Accent colors | Settings/global | A | None | WP user preference | Low | Low | Low | Free optional | Simplify | Contrast/support cost may exceed value. |
| Reduced motion | Settings/global | A | None | WP user/browser preference | Low | Medium | Low | Free | Keep | Honor OS setting. |
| Tabular numerals toggle | Settings | D | Stored only | None | Low | Low | Low | None | Remove | Make semantic default. |
| Sound on save | Settings | D | Stored only | None | Medium | Low | Low | None | Remove | No behavior/demand. |
| Landing tab | Settings | A | Tier routes mock | WP user preference | Low | Medium | Medium | Free | Improve | Entitlement-aware. |
| Sticky queue | Settings | A | None | WP user preference | Low | High | Medium | Free | Keep | Desktop-specific. |
| Queue grouping/timestamps/page size | Settings | A/C | Local queue | WP user preference + server page size | Medium | Medium | Medium | Free | Keep/Improve | Respect server caps. |
| Product defaults | Settings | C | localStorage | WP user/store defaults | Medium | High | High | Free | Improve | Server resolves; safer Draft default. |
| Mobile simple entry | `/` 375/430 | C | None | Same CRUD | High | High | Medium | Free | Keep/Improve | Usable base, long flow/sticky errors needed. |
| Mobile settings | `/settings` | D | None | UI only | Medium | High | Medium | Free | Redesign | Global overflow/release blocker. |
| Mobile store/team tables | Pro routes | C | Fixtures | Agency resources | High | Low | High | Agency future | Redesign later | Cards/details rather than hidden columns. |
| RTL/localization | Global | E/C layout only | Forced test only | WP locale/direction | High | Very high worldwide | High | Free | Add systematically | Overall readiness Poor. |
| Woo connection dialog | Global | C executable | Real direct fetch | Should not exist locally | High/risky | Negative | Negative | None | Remove | Browser secret/CORS anti-pattern. |
| Free/Pro toggle | Header/command | A | Entirely local | Entitlement service | Low | Demo only | Demo only | Dev only | Remove production | Persists despite session copy. |
| Upgrade modal | Global | B | Local unlock, unvalidated price | Licensing/commerce | Medium | Commercial | Commercial | Pro | Keep visual/replace logic | Copy not authoritative. |
| License activation | `/license` | B | Regex/timeout/hardcoded facts | Server license adapter | High | Enabling | High | Pro/Agency infra | Replace | No real license lifecycle. |
| 50/month meter | `/` | B | Local mock queue | Server/cloud metering if ever used | High | Negative | Negative | None/current removed | Remove | Do not cap basic local CRUD this way. |
| CSV import/export | Entry button | E/D | Toast/lock | Woo core importer or Pro batch job | Very high | High | High | Free hand-off / Pro advanced | Redefine | Core Woo already provides basic capability. |
| AI descriptions | Entry button | E/D | Toast/lock | Future provider proxy | High | Uncertain | Medium | Future | Defer | Review/cost/locale burden. |
| Analytics dashboard | `/analytics` | B/D | Static/random fixtures | Operation/Woo analytics reports | Very high | Low/medium | High | Future Pro/Agency | Remove mock, defer | Dead controls/inconsistent range. |
| Multi-store switch/table | `/stores` + shell | B | Seed/localStorage | Future secured connectors | Very high | Low/medium | Very high | Agency | Defer/HOLD | Active store does not scope data. |
| Add/remove store | `/stores` | B | Local row | Future connection lifecycle | Very high | Low | Very high | Agency | Defer/HOLD | Missing promised credential step. |
| Connection health | `/stores` | D | Static latency/status | Future monitoring | Very high | Low | High | Agency future | Remove now | False assurance. |
| Team members/roles | `/team` | B | Component-local seed | WP users or agency identity/ACL | Very high | Low | Very high | Agency | Defer/HOLD | Existing WP capabilities remain Free security. |
| Team invitations/email | `/team` modal | B | Fake success | Email/identity service | Very high | Low | High | Agency | Remove now/defer | Reload loses invite. |
| Activity history | Unused fixture | E | `recentEvents` unused | Plugin operation log | High | Medium | High | Free recent / Agency retention | Add later | Needs real event schema. |
| Scheduled sync | Upgrade copy | E | Copy only | Durable scheduled job | Very high | Medium | High | Pro later/Agency | Defer | Action Scheduler/logging required. |
| Automatic retries | Upgrade/analytics copy | E | Static “3” | Job retry policy | High | High | High | Free manual / Pro automatic | Defer automatic | Needs idempotency/dead-letter. |
| Templates/presets | Absent | E | None | Plugin-owned data | High | Very high | Very high | Pro | Add after core | Strongest missing paid fit. |
| Safe batch operations | Absent | E | CSV copy only | Plugin jobs + Woo CRUD | Very high | High | Very high | Pro | Add after core | Dry run/resume/logs. |
| Agency cross-store templates | Absent | E | None | Future service/connectors | Very high | Low | Very high | Agency | Future/HOLD | Requires tenancy architecture. |
