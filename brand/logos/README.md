# Logo sources and approval status

The two horizontal SVG files in this directory are containers embedding the approved PNG files from `public/brand/` without changing their source bytes. They are useful SVG compositions, **not newly reconstructed vector logos**. The original PNGs remain the authoritative raster masters; SHA-256 hashes are recorded in `manifest.json`.

A clean editable vector logo, approved stacked layout, and clean standalone monogram were not supplied. The existing website icon in `public/icons/` appears to contain a cropped part of the wordmark/tagline. It is preserved but is not recommended as a newly approved social avatar. The provided social avatar template instead centers the entire approved horizontal wordmark inside a square canvas. Obtain the approved vector and compact sources from the brand owner before replacing or publishing a new identity variant.

Regenerate the wrappers and checksums with `scripts/render-brand-assets.mjs`. Never trace or recolor the logo to fill the missing-source gap.
