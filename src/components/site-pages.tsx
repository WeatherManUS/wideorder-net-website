import { getRuntimeSocialProfiles } from "@/lib/managed-config/service";
import { SocialLinks } from "@/components/social-links";
import Link from "next/link";
import { InquiryLink } from "@/components/inquiry-link";
import { siteConfig, getContactMailtoHref } from "@/config/site";
import { siteContent, type ProofStory } from "@/content/home";
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
function Invitation() {
  return <Section><div className="invitation"><div><SectionLabel>There is a better way.</SectionLabel><h2>What should be easier?</h2></div><InquiryLink>Discuss a Challenge</InquiryLink></div></Section>;
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
      <div><SectionLabel>{siteContent.home.hero.brandPromise}</SectionLabel><h1>{siteContent.home.hero.headline}</h1><p className="experience-hero__copy">{siteContent.home.hero.supportingCopy}</p>
      <div className="cta-row"><InquiryLink>Discuss a Challenge</InquiryLink><Link href="/our-work" className="button button--secondary">See the outcomes</Link></div></div>
      <ClarityDiagram />
    </div></section>
    <Section surface><div className="section-heading"><div><SectionLabel>Less effort. Better outcomes.</SectionLabel><h2>Make room for the work that matters.</h2></div><p>Recurring work, stalled change, disconnected systems. Start with the constraint. Find a practical way forward.</p></div>
      <div className="problem-strip">{["Recover skilled time", "Get stalled work moving", "Make existing systems work better"].map((text, i) => <div key={text}><span>0{i + 1}</span><h3>{text}</h3></div>)}</div>
    </Section>
    <Section><div className="section-heading"><div><SectionLabel>Featured outcome / Month-End Reporting</SectionLabel><h2>Days of repetition.<br />Minutes of preparation.</h2></div><Link href="/our-work/month-end-reporting" className="text-link">Explore the full case study ↗</Link></div>
      <CaseStudyComparison story={flagship} />
    </Section>
    <Section surface><div className="section-heading"><div><SectionLabel>How we work</SectionLabel><h2>Understand. Decide. Deliver.</h2></div><p>Paid Discovery establishes what is worth changing. Then we agree the right way to deliver it.</p></div><Link className="text-link" href="/how-we-work#discovery">Explore Discovery and engagement →</Link></Section>
    <Invitation />
  </PageShell>;
}

export function WhatWeDoPage() {
  const content = siteContent.whatWeDo;
  return <PageShell><PageHero label="What We Do" title="Work that needs a better way." copy="We investigate, improve, implement, coordinate and manage. The business problem determines the solution." />
    <Section><div className="problem-grid">{[
      ["Time lost to repetition", "Recurring tasks, fragile handovers and the same work entered twice."],
      ["Change that has stalled", "An implementation needs direction, coordination or hands-on delivery."],
      ["Systems that almost work", "Existing tools and processes leave gaps that people keep working around."],
      ["Work that needs ownership", "An ongoing operational burden needs to be handled reliably."],
    ].map(([title, body], index) => <article key={title}><span className="sequence-number">0{index + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</div></Section>
    <Section surface><div className="section-heading"><div><SectionLabel>From diagnosis to delivery</SectionLabel><h2>The right involvement for the work.</h2></div></div><div className="delivery-grid">{content.deliveryModes.map(mode => <article key={mode.title}><h3>{mode.title}</h3><Detail title="What this includes"><p>{mode.body}</p></Detail></article>)}</div>
      <Detail title="Scope, specialist boundaries and value"><p>{content.positioning.body}</p><p>{content.boundaryBody}</p><ul>{content.valuePoints.map(point => <li key={point}>{point}</li>)}</ul></Detail>
    </Section><Invitation /></PageShell>;
}

export function HowWeWorkPage() {
  const content = siteContent.howWeWork;
  const summaries = ["Show us what keeps getting in the way.", "A paid professional engagement to understand the challenge.", "Establish the effort, cost and credible benefit.", "Choose the practical response. No predetermined tool.", "Implement, test and establish the solution."];
  return <PageShell><PageHero label="How We Work" title="Clarity first. Progress with purpose." copy="Discovery is paid professional work. It may conclude that no further engagement is justified. That is a valid outcome." />
    <Section><ol className="process-timeline">{content.stages.map((stage, index) => <li key={stage.title}><span className="sequence-number">0{index + 1}</span><h2>{stage.title}</h2><p>{summaries[index]}</p><Link href={index === 1 ? "#discovery" : `#process-detail-${index}`} className="text-link">Explore stage</Link></li>)}</ol>
    <div className="process-details">{content.stages.map((stage, index) => <Detail key={stage.title} id={index === 1 ? "discovery" : `process-detail-${index}`} title={index === 1 ? "Discovery: scope and outcomes" : stage.title}>{stage.paragraphs.map(p => <p key={p}>{p}</p>)}{"outcomes" in stage && <ul>{stage.outcomes.map(o => <li key={o}>{o}</li>)}</ul>}</Detail>)}</div></Section>
    <Section surface id="engagement"><SectionLabel>After Discovery</SectionLabel><h2 className="experience-heading">Agree the engagement that fits.</h2><div className="delivery-grid">{content.engagementModels.map(model => <article key={model.title}><h3>{model.title}</h3><Detail title="How this works"><p>{model.body}</p></Detail></article>)}</div><p className="commercial-note">Further work depends on a worthwhile case for action, an agreed scope and the value being created.</p><Detail title="Continuous improvement and ongoing service"><p>{content.supportLead}</p><p>{content.supportBody}</p><p>{content.supportConclusion}</p></Detail></Section><Invitation /></PageShell>;
}

export function OurWorkPage() {
  return <PageShell><PageHero label="Our Work" title="Different challenges. Measurably better outcomes." copy="Real business problems, solved in the environments where the work happens." />
    <Section><div className="case-gallery">{[flagship, ...siteContent.ourWork.stories.filter(s => s.id !== flagship.id)].map(story => <CasePreview key={story.id} story={story} />)}</div></Section><Invitation /></PageShell>;
}

export function OurApproachPage() {
  const content = siteContent.ourApproach;
  return <PageShell><PageHero label="Our Approach / inSITU" title="The tool isn't the product. The better outcome is." copy="Start with the real environment. Understand what works, what gets in the way and what is worth changing." />
    <Section><div className="approach-decisions">{content.existingEnvironment.decisions.map((decision, i) => <div key={decision}><span className="sequence-number">0{i + 1}</span><h2>{decision}</h2></div>)}</div><Detail title="Working inSITU">{content.insitu.paragraphs.map(p => <p key={p}>{p}</p>)}</Detail></Section>
    <Section surface><SectionLabel>Designed for real use</SectionLabel><h2 className="experience-heading">Simple. Integrated. Trusted. Used.</h2><div className="principle-grid">{content.insitu.principles.map(p => <article key={p.title}><h3>{p.title}</h3><p>{p.body}</p></article>)}</div><Detail title="Commercial value and practical adoption"><p>{content.insitu.calloutBody}</p><p>{content.value.introduction}</p><ul>{content.value.points.map(p => <li key={p}>{p}</li>)}</ul></Detail></Section><Invitation /></PageShell>;
}

export async function ContactPage() {
  const profiles = await getRuntimeSocialProfiles();
  const c = siteContent.contact;
  return <PageShell><PageHero label="Contact" title="What should be easier?" copy="A few lines about the challenge are enough to start." />
    <Section><div className="contact-experience"><div className="contact-experience__form"><ContactForm fields={c.fields} messageLabel={c.messageLabel} helperText={c.helperText} exampleText={c.exampleText} privacyText={c.privacyText} submitLabel={c.submitLabel} /></div><aside><SectionLabel>Prefer email?</SectionLabel><a className="text-link" href={getContactMailtoHref("WideOrder enquiry")}>{siteConfig.contact.publicMailbox}</a><p>Tell us what is happening, what keeps consuming time, or what should already be working.</p><SocialLinks profiles={profiles} label="Contact social profiles" /></aside></div></Section>
  </PageShell>;
}

export function CaseStudyPage({ story }: { story: ProofStory }) {
  return <PageShell><PageHero label="Our Work / Case Study" title={story.title} copy={story.summary} />
    <Section><CaseStudyComparison story={story} /><Detail title="The outcome in context"><p>{story.interpretation}</p></Detail><div className="case-study-actions"><Link href="/our-work" className="text-link">← All case studies</Link><InquiryLink>Discuss a similar challenge</InquiryLink></div></Section>
  </PageShell>;
}
