# Layout duplication audit ? v0.1.0004

Scope: functional foundation only. Editorial restructuring and large visual changes remain for Phase 0.2. The approved case-study presentation is documented in [ROADMAP.md](ROADMAP.md).

| Page or component | Type of duplication | Source location | Recommended action | Expected benefit | Risk |
|---|---|---|---|---|---|
| Primary contact actions | Repeated direct-email CTA markup and competing destinations | `src/components/site-pages.tsx`: HomeHeroSection, ContactCard, WhatWeDoPage, OurWorkPage, CaseStudyPage; `site-shell.tsx`: PageShell | **Completed:** shared InquiryLink targets `/contact#inquiry-form`; header/mobile use the same destination | One primary contact flow that does not require an email client | Low; navigation and responsive form tested |
| Contact page | Email address plus email button repeat the same action alongside the form | `src/components/site-pages.tsx`: ContactCard, ContactPage | **Completed:** keep one secondary email address; omit redundant/self-referential CTA on Contact | Clear primary form, secondary direct email | Low; preserve layout and conversation prompts |
| Settings controls | Similar label/input/secret-status rendering | `src/app/admin/settings/page.tsx`: SettingField | **Completed:** reusable field renderer in functional SMTP/website sections | Consistent blank secret fields and editable controls | Low; masking and reload verified |
| Our Work overview and detail | Summary, Challenge, Better Way and Result repeat across index and permalink | `src/components/site-pages.tsx`: ProofStorySummaryCard, ProofStoryArticle, OurWorkPage, CaseStudyPage | Retain current shared renderers; Phase 0.2 can shorten overview detail while keeping permalinks | Less scanning repetition without losing detail | Medium editorial/SEO risk; defer |
| Case-study comparison and narrative | Before/After repeats existing challenge and interpretation | `src/components/case-study-comparison.tsx`; `site-pages.tsx`: ProofStoryArticle | Preserve for v0.1.0004; consolidate using approved Phase 0.2 comparison treatment | More purposeful interactive presentation | High visual/accessibility scope; defer |
| Homepage flagship | Retail Pricing outcome appears in headline, comparison and linked detail | `src/components/site-pages.tsx`: HomePage; `src/content/home.ts`: stories | Existing homepage already omits the separate Retail Pricing summary row; no further editorial change | Avoid duplicate card while retaining the proof story | Medium; defer narrative changes |
| Complexity ? Clarity ? Order | Large shared motif appears in homepage and secondary page heroes | `src/components/order-motif.tsx`; `site-pages.tsx`: PageHero, HomeHeroSection | Keep shared component now; evaluate compact secondary variant in Phase 0.2 | Reduce repeated visual weight | Medium visual-layout risk; defer |
| Desktop/mobile navigation | Two responsive markup paths, one shared navItems source | `src/components/site-header.tsx`; `mobile-navigation.tsx`; `src/content/home.ts` | Keep separate controls: CSS hides the inactive variant and the mobile panel closes on selection/Escape | Preserve responsive accessibility; no second content source | Medium interaction risk; unnecessary rewrite avoided |
| Business philosophy | Problem-first approach, existing systems and outcome language recur | `src/content/home.ts`: home, whatWeDo, howWeWork, ourApproach | Retain substantive page-specific explanations; review concise cross-links in Phase 0.2 | Less reading repetition if carefully edited | High positioning/editorial risk; defer |
| Resend implementation | Historical delivery code retained alongside active SMTP modules | `src/lib/contact-mail.ts`, `contact-request.ts`; their legacy tests | Retain as historical reference; active `/api/contact` imports only `inquiries/submit`. No runtime fallback to Resend | Preserve rollback context without ambiguous provider behavior | Low if kept disconnected; removal can be separate maintenance |

## Intentional branding repetition

The approved logo, ?There is a better way.? promise, WideOrder Resolve identity, inSITU language, shared header/footer and four theme palettes are intentional. They remain unchanged. Case-study summaries linking to full accounts are also a purposeful overview/detail relationship; repeating entire narratives on both surfaces is the separate Phase 0.2 review item.


## Phase 0.2 actions

- Removed complete case-study narratives from the gallery; detail routes share the comparison component.
- One homepage flagship (Month-End Reporting); case previews share a compact renderer.
- Replaced repeated large motifs with one homepage interactive diagram.
- Shared page intro, section, disclosure and closing invitation components.
- Consolidated philosophy on Our Approach and detailed commercial material on How We Work.
- Contact now leads with the existing form; one secondary email option follows it on mobile.
- Preserved separate responsive navigation structures and shared theme selector.
