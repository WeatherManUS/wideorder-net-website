# WideOrder Website Content

## Content status

- `PHASE 9 CONTENT APPROVED`
- This file is the authoritative customer-facing content source for the multi-page website restructure implemented on `2026-10-13`.
- Source inputs are the approved WideOrder v2 redesign brief, the repository guidance, and the previously approved detailed WideOrder methodology and case-study content already in the repo history.
- This revision intentionally shortens the homepage while preserving the detailed material across supporting pages.
- Do not use the term `10x` in WideOrder branding, website copy, documentation, or marketing.
- Primary contact CTAs navigate to `/contact#inquiry-form`. Direct email remains a secondary method. Valid inquiries are encrypted and durably captured before SMTP delivery; show receipt separately from SMTP acceptance.
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
- Primary hero CTA: `Discuss a Challenge` (native inquiry form).
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

## Phase 0.1 native inquiry foundation (v0.1.0004)

- Keep the existing five form fields and four themes.
- Show ?Inquiry received? only after durable capture, with a unique reference. If email has not been accepted, say the notification is pending and the inquiry is safely saved.
- SMTP acceptance is not proof of inbox arrival. Optional acknowledgments confirm receipt without response-time promises.
- Privacy information explains encrypted inquiry storage, SMTP delivery, queued notifications, and consent-permitted campaign labels in internal notifications.
- Preserve current case-study content and visual direction; Phase 0.2 redesign is documentation only.

## Phase 0.2 approved experience (v0.2.0001)

The November 10, 2026 Phase 0.2 implementation brief supersedes earlier layout and homepage copy guidance. Existing detailed material above remains the source for progressive disclosures. No business positioning change is authorized.

### Homepage
- Brand promise: **There is a better way.**
- Headline: **Your business shouldn't have to work this hard.**
- Supporting statement: **We find what is slowing you down, work out what needs to change, and help make it happen.**
- Primary invitation: Discuss a Challenge. Secondary: See the outcomes.
- Signature progression: Complexity (disconnected tasks and repeated effort), Clarity (understand the connections and choose what matters), Order (simpler flow and clear responsibilities).
- Problem: recurring work, stalled change and disconnected systems. Recover skilled time, get stalled work moving, make existing systems work better.
- Flagship: Month-End Reporting. Days of repetition. Minutes of preparation.
- Before **20 hours**, after **10 minutes**, approximately **99.2% less active human preparation time**. Independent background computer processing is separate; these are not total elapsed times or a universal guarantee. This approved baseline supersedes imprecise historical person-day descriptions in primary presentation; deeper historical context remains available.
- Approach: Understand. Decide. Deliver. Paid Discovery establishes what is worth changing, followed by agreement on delivery.
- Closing invitation: What should be easier?

### Primary pages and retained detail
- What We Do: Work that needs a better way. Investigate, improve, implement, coordinate and manage. Group problems into time lost to repetition, stalled change, systems that almost work, and work that needs ownership. Retain direct execution, managed implementation, ongoing service, specialist boundaries and value details.
- How We Work: Clarity first. Progress with purpose. Paid Discovery may conclude that no further engagement is justified. Show all five approved stages. Keep detailed Discovery scope/outcomes and the three commercial engagement models in expandable sections. Further work requires a worthwhile case, agreed scope and credible value.
- Our Work: Different challenges. Measurably better outcomes. Use concise linked previews; full accounts belong on individual routes.
- Our Approach: The tool isn't the product. The better outcome is. Retain inSITU and Keep / Change / Replace / Build, plus Simple / Integrated / Trusted / Used. Keep detailed practical and commercial principles available.
- Contact: What should be easier? A few lines about the challenge are enough to start. Form first, email secondary. Preserve all validation/privacy language.

### Comparisons
Both BEFORE and AFTER must be visible without interaction. Expandable detail contains the existing challenge and implementation explanation. Workflow steps are explanatory diagrams, not additional measured results.
- Retail: a full-time burden to approximately 20 minutes across the business; do not calculate a percentage from an ongoing-role baseline.
- Deployment: a growing backlog to up to 16 machines prepared simultaneously; do not invent baseline throughput.
- Remote infrastructure: approximately 30 minutes to zero of the previous interruption-related downtime burden; not an uptime guarantee.

### Optional customer acknowledgment
Thanks for getting in touch.

We've received your message and will review it.

If we need any additional information, we'll be in touch.

Do not include customer-visible UUIDs or raw timestamps. Keep acknowledgments disabled by default; preserve the administrator's existing setting. Internal notifications retain visitor details, challenge, reference, localized submission time and consent-permitted attribution.
