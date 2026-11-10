# Typography source and redistribution

The website and marketing library use **Manrope** for headlines/results and **Inter** for body text/captions. Official Google Fonts variable TTFs are bundled here for reliable offline rendering. `sources.json` records source URLs, retrieval date, and SHA-256 checksums. `Manrope-OFL.txt` and `Inter-OFL.txt` contain the complete SIL Open Font License 1.1 notices, including copyright attribution.

Keep those notices with redistributed fonts or editable template packages. These licenses permit use in commercial marketing and font embedding, subject to their terms; font files cannot be sold by themselves. Do not remove license notices, imply that WideOrder designed the fonts, or make a modified font distribution without reviewing reserved-name requirements.

Sources:

- [Inter font and license, Google Fonts](https://github.com/google/fonts/tree/main/ofl/inter)
- [Manrope font and license, Google Fonts](https://github.com/google/fonts/tree/main/ofl/manrope)

The asset generator loads these exact files rather than requesting fonts from an external CDN. The website retains its existing Next.js font implementation.
