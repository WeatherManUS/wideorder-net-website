# Deployment Planning

## Production target

- Production domain: `https://wideorder.net`
- Canonical hostname: `wideorder.net`
- Future expected behavior: `www.wideorder.net` should redirect consistently to `https://wideorder.net`
- HTTPS: required

## Current status

- Hosting provider: pending decision
- Production DNS: pending Phase 7
- Preview deployment: required before first production release
- Production release: must use a build that has passed lint, typecheck, and production build checks
- Rollback: must be documented before initial production launch

## Security and configuration

- Secrets must not be committed.
- Environment variables must be supplied by hosting/environment configuration.

## Phase 1 limits

- Do not select a provider simply because it is common.
- Do not configure Vercel, Cloudflare, GitHub Pages, or another host during Phase 1.
- No DNS changes during Phase 1.
