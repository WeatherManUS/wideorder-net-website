# WideOrder marketing system

Start with [`../brand/brand-guidelines.md`](../brand/brand-guidelines.md) and open [`../brand/examples/index.html`](../brand/examples/index.html) locally for the asset gallery. The master marketing identity is Option 3 Light, with an approved dark variation; all four website themes remain selectable.

The website uses the master palette for first-time visitors, follows system light/dark preference, and preserves all saved four-state preferences.

## Reproduce a campaign

1. Choose an approved problem, insight, or factual case study from `docs/CONTENT.md` / `src/content/home.ts`.
2. Select a template family and platform composition from `brand/`. Generate source/export assets using `scripts/render-brand-assets.mjs`; inspect safe areas and upload crops using `platform-requirements.md`.
3. Generate a destination URL with `node scripts/utm-builder.mjs --destination /our-work/month-end-reporting --source linkedin --medium organic_social --campaign process_improvement --content reporting_case_study`.
4. Verify the canonical page and static social preview before publishing manually through an authorized account. No accounts or advertising are activated by this package.
5. If measurement is required, complete the explicit configuration and consent checks in `tracking-integrations.md`, then follow `reporting-specification.md`.

## Files

- `channel-strategy.md`: channel roles and publishing workflow.
- `platform-requirements.md`: official specifications, working presets, and source-access limitations.
- `campaign-naming.md`: UTM convention, URL builder, session attribution definitions.
- `analytics-events.md`: event schema, triggers, PII restrictions, conversion semantics.
- `tracking-integrations.md`: environment flags, IDs, provider setup and verification.
- `privacy-consent.md`: implemented opt-in behavior, withdrawal, storage, operator responsibilities.
- `reporting-specification.md`: GA4/Looker reporting plan, provenance and CRM/cost prerequisites.
- `implementation-status.md`: delivered features and outstanding inputs.

No live reporting data, account identities, follower counts, advertising costs, or revenue are invented. Credentials and account access remain outside this repository.
