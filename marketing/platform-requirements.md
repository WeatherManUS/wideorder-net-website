# Platform export requirements

Reviewed 2026-11-10. These notes distinguish platform guidance from WideOrder working presets. Inspect the final upload/crop preview before publishing: a reusable canvas is not a guarantee that a platform will show every pixel. No account has been created or connected by this work.

## Verified official guidance

| Placement | Current guidance | WideOrder production rule |
| --- | --- | --- |
| LinkedIn company Page | Cover 1512×256; logo 400×400 recommended, 268×268 minimum; PNG/JPEG, up to 3 MB. Devices can crop both axes. | Keep the main message central and away from edges/overlays. Use the full approved wordmark centered on a square avatar; the existing cropped-looking icon requires identity review before social use. [LinkedIn Page image specifications](https://www.linkedin.com/help/lms/answer/a567368) |
| LinkedIn single-image advertising | Help Center recommends landscape 1200×628, square 1200×1200, portrait 720×900; image limit 5 MB. The Ads Guide rounds landscape to 1200×627. | Use 1200×628 for a placement-specific landscape export; retain 1080-square/portrait as editable internal masters. Validate Campaign Manager's chosen placement. [Single-image ad specifications](https://www.linkedin.com/help/lms/answer/a420759), [Ads Guide](https://business.linkedin.com/advertise/ads/ads-guide) |
| LinkedIn documents/carousels | Document ads accept PDF, DOC/DOCX, PPT/PPTX, up to 100 MB/300 pages. Lead-generation document ads require PDF. Mixed page sizes must be normalized; animation is static. | Use one page size per document and a short problem → approach → outcome sequence; export the editable slides to PDF before uploading. Organic document-post and advertising permissions are separate. [Document ad specifications](https://www.linkedin.com/help/lms/answer/a499041) |
| LinkedIn article cover | 1920×1080 recommended, cropped to 16:9; JPEG/JPG, PNG and WebP supported. | Use the landscape composition, with headline and brand inside an inset safe area. [Article media help](https://www.linkedin.com/help/learning/answer/a521719) |
| YouTube channel art | Recommended 2560×1440; minimum 2048×1152. At minimum dimensions the text/logo safe region is 1235×338. | On the larger canvas, a proportional central region is approximately 1544×423; this is a calculated guide, not a separate platform promise. Check Studio's device previews. [Channel branding](https://support.google.com/youtube/answer/10456525) |
| YouTube thumbnails | Current help recommends 3840×2160 for video and 2160×3840 for Shorts, minimum video width/Short height 640. JPG/PNG; current upload limits differ by device: desktop 50 MB, mobile video 2 MB. | The brief's 1280×720 remains a useful internal/legacy working preset. For a final export, use the current platform recommendation where practical and verify the upload method. Keep key numbers readable at small sizes. [Thumbnail help](https://support.google.com/youtube/answer/72431) |
| YouTube end screen | End-screen elements appear in the final 5–20 seconds; the video must be at least 25 seconds. A normal 16:9 video supports up to four elements. | Leave room for Studio's actual clickable elements; a graphic is not itself a clickable end screen. Availability varies by audience and viewing surface. [End-screen help](https://support.google.com/youtube/answer/6388789) |
| X profile | Header 1500×500; avatar 400×400. Profile-image size limit 2 MB. X warns header tops/bottoms can be cropped. | Use PNG/JPEG and central message placement, protect the lower-left avatar overlap, and test mobile/desktop. [X profile upload help](https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo.html) |

## Meta verification limits and working canvases

Facebook Page cover guidance, Instagram photo-resolution help, Reels help, and the Meta Ads Guide were checked at their official URLs, but returned login gates or HTTP 429 in this environment. Their current numeric crop/safe-area requirements could not be independently verified. Treat the following as **internal presets requiring an account-side upload check**, not verified Meta specifications:

- Square 1080×1080: Facebook/Instagram standard posts, profile-identity working art, carousel frames.
- Portrait 1080×1350: Facebook/Instagram feed composition and carousel master.
- Vertical 1080×1920: Stories, Reels covers, and vertical-video title graphics. Keep primary content within the template's adjustable safe area; leave room for account name, captions, buttons, and bottom navigation. Recheck the actual placement, because overlays differ between Stories, Reels, ads, and profile grids.
- Facebook cover working canvas 1640×624: create a separate composition, not a stretched post. Inspect the mobile crop, avatar overlap, and Page controls before release.

Official pages to check while authenticated: [Facebook Page picture/cover guidance](https://www.facebook.com/help/125379114252045), [Instagram photo resolution](https://help.instagram.com/1631821640426723), [Instagram Reels requirements](https://help.instagram.com/1038071743007909), [Meta Instagram Stories Ads Guide](https://www.facebook.com/business/ads-guide/update/image/instagram-story).

## Universal working masters and safe-area policy

The brand library supports 1080×1080 square, 1080×1350 portrait, 1080×1920 vertical, 1920×1080 landscape, 1280×720 thumbnail, and 1200×630 website social-preview masters. These are project presets; platform-specific exports can override dimensions and positioning.

WideOrder inset safe areas are compositional defaults rather than official platform guarantees. Adjust the template's content anchor and inset for each placement. Keep logos, numerals, qualifiers such as “approximately”/“up to”, and the website address inside the final visible crop. Do not omit qualifiers merely to improve legibility. Never rely on color alone: retain Before/After labels, distinct layouts, hierarchy, and structure.

Inspect each export at native size and at thumbnail size, confirm its format/dimensions/file size, and verify that the platform's circular avatar crop does not cut the W mark. Transparent overlays must remain PNG/WebP/SVG with alpha; JPG is for opaque exports only. Video graphics are source artwork, not encoded videos or uploaded campaign assets.

## Font provenance

Inter and Manrope are distributed under SIL Open Font License 1.1. That license allows use, embedding, modification and redistribution under its terms; ship the included copyright/license notices with redistributed font files and observe Reserved Font Name rules if modifying fonts. Do not sell the font files alone. The brand package should preserve the original font binaries and notices. [Inter license](https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt), [Manrope license](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt).

Official downloadable variable-font sources: [Inter](https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf), [Manrope](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf). Font filenames and licensing are recorded in the official [Inter metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/inter/METADATA.pb) and [Manrope metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/METADATA.pb).
