# WideOrder Website Content

## Content status

- `PHASE 9 CONTENT APPROVED`
- This file is the authoritative customer-facing content source for the multi-page website restructure implemented on `2026-10-13`.
- Source inputs are the approved WideOrder v2 redesign brief, the repository guidance, and the previously approved detailed WideOrder methodology and case-study content already in the repo history.
- This revision intentionally shortens the homepage while preserving the detailed material across supporting pages.
- Do not use the term `10x` in WideOrder branding, website copy, documentation, or marketing.
- Direct email remains the primary CTA. The deployed `/contact` page also offers an abuse-checked enquiry form; delivery readiness must be verified independently.
- Keep indexing disabled unless `SITE_INDEXABLE=true` is explicitly set for an approved launch.

## Brand hierarchy

- `WideOrder` - primary company-facing brand
- `WideOrder Resolve` - current problem-solving service offering
- `inSITU` - established methodology
- `There is a better way.` - brand promise
- `GreenLangton` - parent company

## Site architecture

- `/` - concise homepage introducing the offering and prompting contact
- `/what-we-do` - scope of problems addressed, delivery modes, commercial boundaries, and value framing
- `/how-we-work` - five-stage process, paid Discovery model, and engagement structures
- `/our-work` - preserved case studies with supported figures and detailed writeups
- `/our-approach` - inSITU, existing-environment assessment, and value philosophy
- `/contact` - direct email CTA and enquiry form
- `/our-work/[slug]` - individually shareable case studies using the existing approved titles, summaries, narratives, and result figures; existing `/our-work#id` anchors remain available.
- `/privacy` - operational privacy information and tracking choices. Explain essential contact/security services, optional consent-gated analytics/advertising, 180-day local consent storage, 30-minute session attribution, browser privacy signals, and privacy requests to `info@wideorder.net`. Do not claim qualified leads from clicks, send form content to analytics, or claim legal certification.
- Marketing system labels: `From complexity to clarity`, `Before`, `After`, `Tracking preferences`, and `Case study permalink` are presentation/navigation labels, not new service or performance claims.

## Navigation

- Primary navigation:
  - `What We Do`
  - `How We Work`
  - `Our Work`
  - `Our Approach`
  - `Contact`
- Primary CTA: `Let's talk`
- Permanent appearance selector: `Ivory & Sage`, `Navy & Sage`, `Pearl & Indigo`, `Ink & Indigo`. These are descriptive UI names for the four existing palettes; stored theme keys and palette colors are unchanged.
- The copyright statement can temporarily show the actual release version and verified publication time in America/Chicago, controlled by `SHOW_FOOTER_VERSION`.
- Production release identifiers use `vMAJOR.MINOR.RELEASE` with four release digits, allocated from the durable release-history ledger only. Before allocation/publication, show an explicit pending message instead of an older version or a build timestamp.

## Homepage

### Hero

- Service name: `WideOrder Resolve`
- Brand promise: `There is a better way.`
- Primary statement: `WideOrder solves problems for businesses.`
- Homepage H1: `Solve the problems holding your business back.` Keep the brand promise and primary statement immediately below it.
- Primary hero CTA: `Discuss a Challenge` (direct email).
- Secondary hero CTA: `Explore Our Work` (`/our-work`).
- The decorative visual motif is labelled `Complexity → Clarity → Order`; it describes the design metaphor, not a new service or performance claim.
- Supporting copy: `Clients engage WideOrder when something needs addressing, improving, implementing, coordinating or managing.`
- Supporting copy: `The work may be clearly defined, or it may only be clear that something is not working as it should. WideOrder investigates the situation, determines a sensible course of action, and helps ensure the work gets done.`
- Supporting examples:
  - `A report that takes hours`
  - `A stalled implementation`
  - `Data entered twice`
  - `A recurring workaround`
  - `A process that keeps failing`
  - `Only one person knows how`
  - `Systems that almost connect`
  - `A job nobody has fixed properly`

### Overview

- Statement: `Practical problem-solving, not a narrow service category.`
- Cards:
  - `Investigate the problem`
  - `Work out the right path`
  - `Get the work delivered`

### Positioning

- Line one: `No predetermined answer.`
- Line two: `Start with the problem.`
- Body: `WideOrder is not defined by consulting, software, automation, outsourcing or staffing alone. Those may form part of a solution, but none individually defines the business.`

### Work preview

- Feature Retail Pricing: `From a full-time pricing burden to approximately 20 minutes.` Retain the existing ERP narrative and approximate result, without implying a universal guarantee.
- Before/After controls compare the approved challenge and outcome narratives; full narratives remain visible in each case study.

- Statement: `Examples of real business problems solved.`
- Purpose: link visitors into the detailed case-study page and supporting pages without recreating a long single-page layout.

## What We Do

- Purpose: explain the kinds of business problems WideOrder addresses and the ways work can be delivered.
- Include direct execution, managed implementation, and ongoing service delivery.
- Preserve broad positioning; do not reduce the business to consulting, software, automation, outsourcing, or staffing.
- Preserve specialist-boundary language: WideOrder identifies where licensed or specialist expertise is needed and brings in the right specialist when required.
- Preserve value framing:
  - reduced operating costs
  - increased revenue or capacity
  - recovered employee or management time
  - fewer errors and less rework
  - improved reliability and continuity
  - reduced dependency on individual employees
  - reduced operational risk
  - successful delivery of otherwise stalled work
  - removal of ongoing burdens from the client

## How We Work

- Purpose: explain the engagement lifecycle and set expectations.
- Preserve the established five-stage process.
- Preserve the paid Discovery model and the commercial-justification lens.
- Preserve the idea that Discovery can validly conclude that no further engagement is justified.

### Five-stage process

- `Show us the challenge`
- `Discovery`
- `Measure it`
- `Find a better way`
- `Put it to work`

### Discovery rules

- `Discovery is a paid professional engagement.`
- Clients are paying for the expertise and time required to properly understand the challenge, not for a guaranteed implementation outcome.
- Discovery may conclude:
  - `the current process is acceptable`
  - `improvement is not economically justified`
  - `something small should change`
  - `an existing capability should be used differently`
  - `a commercial product is appropriate`
  - `a custom solution is appropriate`
  - `or no further work is justified`

### Engagement models

- Distinguish clearly between:
  - one-time project implementation
  - continuous improvement
  - recurring ongoing service delivery
- Continuous improvement and managed recurring services may overlap, but they are not automatically the same thing.

## Our Work

- Purpose: demonstrate real-world experience with preserved supported figures.
- Preserve these case studies and their detailed challenge / better-way / result structure:
  - `Retail Pricing`
  - `Technology Deployment`
  - `Remote Infrastructure & Printing`
  - `Month-End Reporting`
- Preserve existing supported figures and do not invent client names, testimonials, endorsements, or unsupported statistics.
- Present concise summaries first, then detailed accounts on the same page.

## Our Approach

- Preserve the core principle:
  - `The tool isn't the product.`
  - `The better outcome is.`
- Preserve `inSITU` and its four principles:
  - `Simple`
  - `Integrated`
  - `Trusted`
  - `Used`
- Preserve the existing-environment assessment approach:
  - `Keep what makes sense.`
  - `Change what needs changing.`
  - `Replace what needs replacing.`
  - `Build what is missing.`
- Preserve the value-focused philosophy that work should create credible benefit relative to cost.

## Contact

- Statement: `Start with the problem.`
- Supporting copy: `Send a short email describing what is taking too long, what keeps going wrong, what needs implementing, or what feels harder than it should.`
- Supporting copy: `A few lines is enough to begin the conversation.`
- Email label: `Email`
- CTA: `Compose an email`
- Prompt cues:
  - `What is happening now?`
  - `What keeps consuming time, attention or capacity?`
  - `What should be easier, more reliable, or simply done already?`

## Footer

- Identity:
  - `WideOrder`
  - `There is a better way.`
  - `A GreenLangton company`
- Supporting philosophy copy: `The tool isn't the product. The better outcome is.`
- Footer navigation:
  - `What We Do`
  - `How We Work`
  - `Our Work`
  - `Our Approach`
  - `Contact`
- WideOrder public contact email: `info@wideorder.net`

## Visual direction

- Preserve the approved production logo assets exactly as supplied.
- Use the paired light/dark identity already established in the repository.
- Updated palette direction for this release:
  - dark background `#17242D`
  - dark surface `#263E4B`
  - dark text `#F4F0E8`
  - dark secondary text `#D1D9DC`
  - accent green `#A3BE8C`
  - brass accent `#D6A35F`
  - light background `#F4F0E8`
  - light surface `#FFFFFF`
  - light text `#17242D`
  - light secondary text `#4C5B64`
  - light accent green `#55734E`
  - light brass `#B17B34`

## Content guardrails

- Keep the language plain, confident, intelligent, and commercially credible.
- Avoid bloated consulting language and exaggerated promises.
- Do not invent guarantees, unsupported metrics, client names, or testimonials.
- Preserve detailed methodology and case-study substance even when the homepage stays concise.
- Keep the site focused on the core concept: `WideOrder solves problems for businesses.`
