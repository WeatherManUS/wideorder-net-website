# Canvas and safe-area presets

`presets.json` is the editable composition registry. Every entry supplies an ID, channel, role/template, width, height, safe area `[x, y, width, height]`, and permitted formats. There are internal working presets for square 1080×1080, portrait 1080×1350, vertical 1080×1920, landscape 1920×1080, thumbnail 1280×720, and website preview 1200×630, plus platform-specific compositions.

The safe areas are **conservative internal placement guides**, not a guarantee that every current platform surface uses the same crop. Adjust them with `--safe-area` or in the preset; enable `--show-safe` for a review-only guide. Check native uploader previews and avoid timestamps, profile overlaps, action buttons, captions, and engagement controls. Do not publish magenta safe-area guides.

Official requirements and caveats are maintained in `marketing/platform-requirements.md`. On 2026-11-10 the company LinkedIn cover preset used the current English help value 1512×256, YouTube banner used 2560×1440 with a central scaled text/logo region, X header used 1500×500, and avatar canvases used 400×400. The brief's 1280×720 YouTube thumbnail remains an internal preset even though current YouTube help recommends a higher-resolution option. Meta compositions are working presets pending account-side placement/crop validation because current public help access was restricted during research.

Templates exist for all requested channel roles; run `--all-presets` to materialize every role. Normal runs render representative examples plus all static website previews. The default gallery does not imply that artwork was uploaded to any platform or passed that platform's account-side review.
