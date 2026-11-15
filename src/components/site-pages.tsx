import { getRuntimeSocialProfiles } from "@/lib/managed-config/service";
import { SocialLinks } from "@/components/social-links";
import Link from "next/link";
import { InquiryLink } from "@/components/inquiry-link";
import { siteConfig, getContactMailtoHref } from "@/config/site";
import { siteContent, positioning, type ProofStory } from "@/content/home";
import { comparisons } from "@/content/comparisons";
import { ContactForm } from "@/components/contact-form";
import { CaseStudyComparison } from "@/components/case-study-comparison";
import { ClarityDiagram } from "@/components/clarity-diagram";
import { PageShell, SectionLabel } from "@/components/site-shell";

function Section({ children, surface = false, id }: { children: React.ReactNode; surface?: boolean; id?: string }) {
  return <section id={id} className={`experience-section${surface ? " experience-section--surface" : ""}`}><div className="container container--wide">{children}</div></section>;
}
function PageHero({ label, title, copy }: { label: string; title: string; copy?: string }) {
  return <section className="experience-intro"><div className="container container--wide"><SectionLabel>{label}</SectionLabel><h1>{title}</h1>{copy ? <p>{copy}</p> : null}</div></section>;
}
function Detail({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return <details className="disclosure editorial-detail" id={id}><summary>{title}</summary><div className="detail-copy">{children}</div></details>;
}
function CasePreview({ story }: { story: ProofStory }) {
  const data = comparisons[story.id];
  return <Link href={`/our-work/${story.id}`} className="case-preview" data-story={story.id}>
    <div className="case-preview__graphic" aria-hidden="true"><span>{data.before}</span><i>→</i><strong>{data.after}</strong></div>
    <div className="case-preview__body"><SectionLabel>Business outcomes</SectionLabel><h2>{story.title}</h2><p>{story.summary}</p><span className="teaser-link">Explore the case study</span></div>
  </Link>;
}
const flagship = siteContent.ourWork.stories.find(story => story.id === "month-end-reporting")!;

export function HomePage() {
  return <PageShell>
    <section className="experience-hero"><div className="container container--wide experience-hero__grid">
      <div><SectionLabel>{siteContent.home.hero.brandPromise}</SectionLabel><h1>{siteContent.home.hero.headline}</h1><p className="experience-hero__copy"><strong>{siteContent.home.hero.statement}</strong></p><p>{siteContent.home.hero.supportingCopy}</p>
      <div className="cta-row"><InquiryLink>Discuss a Challenge</InquiryLink><Link href="/our-work" className="button button--secondary">See the outcomes</Link></div></div>
      <ClarityDiagram />
    </div></section>
    <Section surface><div className="section-heading"><h2>{positioning.symptomTitle}</h2><p>{positioning.symptomCopy}</p></div></Section>
    <Section><div className="section-heading"><div><SectionLabel>Featured outcome / Month-End Reporting</SectionLabel><h2>Recover skilled capacity.<br />Make room for better work.</h2></div><Link href="/our-work/month-end-reporting" className="text-link">Explore the full case study ↗</Link></div>
      <CaseStudyComparison story={flagship} />
    </Section>
    <Section surface><div className="section-heading"><div><SectionLabel>inSITU</SectionLabel><h2>{positioning.insituTagline}</h2></div><p>{positioning.insituIntro}</p></div><Link className="text-link" href="/our-approach">Explore Our Approach &rarr;</Link></Section>
  </PageShell>;
}

export function WhatWeDoPage() {
  const content = siteContent.whatWeDo;
  return <PageShell><PageHero label="What We Do" title="When the problem doesn't fit neatly into a box." copy="Disconnected systems, unowned processes and recurring work that takes too long: these are the challenges WideOrder addresses." />
    <Section><div className="problem-grid">{[
      ["Time lost to repetition", "Repetitive tasks consume skilled time; fragile handovers depend on one person's knowledge."],
      ["Change that has stalled", "An implementation needs direction, coordination or hands-on delivery."],
      ["Systems that almost work", "Existing tools and processes leave gaps that people keep working around."],
      ["Work that needs ownership", "An ongoing operational burden needs to be handled reliably."],
    ].map(([title, body], index) => <article key={title}><span className="sequence-number">0{index + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</div></Section>
    <Section surface><div className="section-heading"><div><SectionLabel>From diagnosis to delivery</SectionLabel><h2>The right involvement for the work.</h2></div></div><div className="delivery-grid">{content.deliveryModes.map(mode => <article key={mode.title}><h3>{mode.title}</h3><Detail title="What this includes"><p>{mode.body}</p></Detail></article>)}</div>
      <p>We cannot solve every problem ourselves. We know when the right answer requires someone else.</p><Detail title="Specialist boundaries"><p>{content.positioning.body}</p><p>{content.boundaryBody}</p></Detail>
    </Section></PageShell>;
}

export function HowWeWorkPage() {
  const content = siteContent.howWeWork;
  return <PageShell><PageHero label="How We Work" title="We don't start by selling a solution. We start by understanding the problem." copy="Begin with a conversation. Where investigation is appropriate, paid Discovery establishes practical options and whether change is worthwhile. Further implementation is not guaranteed." />
    <Section><ol className="process-timeline">{content.stages.map((stage, index) => <li key={stage.title}><span className="sequence-number">0{index + 1}</span><h2>{stage.title}</h2><Link href={index === 1 ? "#discovery" : `#process-detail-${index}`} className="text-link">Explore stage</Link></li>)}</ol>
    <div className="process-details">{content.stages.map((stage, index) => <Detail key={stage.title} id={index === 1 ? "discovery" : `process-detail-${index}`} title={index === 1 ? "Discovery: scope and outcomes" : stage.title}>{stage.paragraphs.map(p => <p key={p}>{p}</p>)}{"outcomes" in stage && <ul>{stage.outcomes.map(o => <li key={o}>{o}</li>)}</ul>}</Detail>)}</div></Section>
    <Section surface id="engagement"><SectionLabel>After Discovery</SectionLabel><h2 className="experience-heading">Agree the engagement that fits.</h2><div className="delivery-grid">{content.engagementModels.map(model => <article key={model.title}><h3>{model.title}</h3><Detail title="How this works"><p>{model.body}</p></Detail></article>)}</div><p className="commercial-note">Further work depends on a worthwhile case for action, an agreed scope and the value being created.</p></Section></PageShell>;
}

export function OurWorkPage() {
  return <PageShell><PageHero label="Our Work" title="Real work. Real outcomes. Confidential clients." copy={positioning.confidentiality} />
    <Section><div className="case-gallery">{[flagship, ...siteContent.ourWork.stories.filter(s => s.id !== flagship.id)].map(story => <CasePreview key={story.id} story={story} />)}</div></Section></PageShell>;
}

export function OurApproachPage() {
  const content = siteContent.ourApproach;
  return <PageShell><PageHero label="Our Approach" title="inSITU" copy={positioning.insituTagline} />
    <Section><p>{positioning.insituCore}</p><div className="delivery-grid">{positioning.dimensions.map(item => <article key={item.title}><h2>{item.title}</h2><p>{item.body}</p></article>)}</div></Section>
    <Section surface><SectionLabel>Designed for real use</SectionLabel><h2 className="experience-heading">The tool isn&apos;t the product. The better outcome is.</h2><div className="principle-grid">{content.insitu.principles.map(p => <article key={p.title}><h3>{p.title}</h3><p>{p.body}</p></article>)}</div></Section>
    <Section><div className="section-heading"><h2>Experience across disciplines. One focus: better outcomes.</h2><p>{positioning.experience}</p></div><p>We don&apos;t sell a predetermined solution. We find the right way forward.</p><Detail title="Personnel discretion and client accountability"><p>{positioning.personnel}</p></Detail></Section></PageShell>;
}

export async function ContactPage() {
  const profiles = await getRuntimeSocialProfiles();
  const c = siteContent.contact;
  return <PageShell><PageHero label="Contact" title="Tell us what's getting in the way." copy="You don't need to know the solution. Tell us what keeps going wrong or should work better. A few lines are enough." />
    <Section><div className="contact-experience"><div className="contact-experience__form"><ContactForm fields={c.fields} messageLabel={c.messageLabel} helperText={c.helperText} exampleText={c.exampleText} privacyText={c.privacyText} submitLabel={c.submitLabel} /></div><aside><SectionLabel>Prefer email?</SectionLabel><a className="text-link" href={getContactMailtoHref("WideOrder enquiry")}>{siteConfig.contact.publicMailbox}</a><p>An initial inquiry is not paid Discovery. Any subsequent engagement is agreed separately.</p><SocialLinks profiles={profiles} label="Contact social profiles" /></aside></div></Section>
  </PageShell>;
}

export function CaseStudyPage({ story }: { story: ProofStory }) {
  return <PageShell><PageHero label="Our Work / Case Study" title={story.title} copy={story.summary} />
    <Section><CaseStudyComparison story={story} /><Detail title="The outcome in context"><p>{story.interpretation}</p></Detail><div className="case-study-actions"><Link href="/our-work" className="text-link">← All case studies</Link><InquiryLink>Discuss a similar challenge</InquiryLink></div></Section>
  </PageShell>;
}
