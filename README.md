# Wideorder.net Website

Starter marketing site for `wideorder.net`, designed to deploy on GitHub Pages.

## What's included

- Responsive one-page website
- Plain HTML, CSS, and JavaScript
- GitHub Pages deployment workflow
- Custom domain support via `CNAME`

## Local preview

Because this is a static site, you can open `index.html` directly in a browser or serve it locally with any static server.

Example with Python:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Publish on GitHub Pages

1. Create a GitHub repository named `wideorder-net-website`.
2. Push this project to the `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Set the source to `GitHub Actions`.
5. Confirm your DNS for `wideorder.net` points to GitHub Pages.

The repo already includes:

- `.github/workflows/deploy.yml`
- `CNAME`

## Suggested next edits

- Replace placeholder marketing copy with final Wideorder messaging
- Add real contact links, booking flow, or lead form
- Add analytics and SEO metadata after launch
