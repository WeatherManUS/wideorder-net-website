# Video graphics and timing

The same renderer supplies `youtube-title-card`, `youtube-intro`, `youtube-outro`, `youtube-lower-third`, `youtube-screen-overlay`, `youtube-end-screen`, `youtube-short`, `vertical-video`, and `landscape-video` compositions. Presets are in `brand/export-presets/presets.json`.

- Title/intro: approved problem or insight, full logo, one restrained geometric motif.
- Lower third: opaque readable name/title panel on an otherwise transparent 1920×1080 canvas. Use existing approved service identity by default, not an invented presenter or client name.
- Screen overlay: transparent corner guides plus small opaque wordmark panel; it does not obscure the full screen recording.
- End screen: two outlined reserved video areas for manually configured native end-screen elements. The graphic itself does not create clickable YouTube elements.
- Vertical demonstration: separate composition with top/bottom/right UI margins; verify the current platform preview before upload.

`demonstration-sequence.json` is an editable shot/timing plan, not a generated video. Import PNG/WebP overlays into the chosen editor at their native dimensions. Preserve alpha and use straight cuts or short fades. Keep captions inside the selected safe area and check them on a phone. Respect the editorial motion rules in `brand/brand-guidelines.md`.
