# Four-theme preview QA

Validated on 2026-11-09 against the local production build.

- Theme control cycles Option 1 Light -> Option 1 Dark -> Option 3 Light -> Option 3 Dark -> Option 1 Light.
- Every selection persists after reload; existing light/dark preference values remain supported.
- Option 3 uses indigo actions, lavender/violet surfaces, and coral accent tokens. Option 1 retains the existing palette.
- Logo sizing increased by 15%; narrow screens allow flex shrinking to preserve header fit. Approved image files are unchanged.
- No horizontal page overflow at widths 320, 390, 768, 1139, 1140, 1200, and 1440 pixels. Desktop navigation and actions do not overlap.
- Full-page desktop captures cover all four themes; a 390px capture covers the mobile header.
- Passed npm run lint, npm run typecheck, npm run build, and git diff --check.
- Contact-widget mode follows the selected palette's light/dark mode. Live Turnstile interaction was not tested.
