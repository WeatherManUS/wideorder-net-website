import Link from "next/link";

import { getContactMailtoHref, siteConfig } from "@/config/site";
import { siteContent, type DeliveryMode, type EngagementModel, type PrincipleCard, type ProcessStage, type ProofStory } from "@/content/home";

import { ProofResultAnimator } from "@/components/proof-result-animator";
import { PageShell, SectionLabel } from "@/components/site-shell";

function PageHero({
  eyebrow,
  title,
  paragraphs,
  actions,
  support,
}: {
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  actions?: React.ReactNode;
  support?: React.ReactNode;
}) {
  return (
    <section className="page-hero site-section site-section--muted">
      <div className="container container--wide page-hero__grid">
        <div className="page-hero__main">
          <SectionLabel>{eyebrow}</SectionLabel>
          <h1 className="section-title">{title}</h1>
          <div className="page-hero__copy">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="section-copy">
                {paragraph}
              </p>
            ))}
          </div>
          {actions ? <div className="cta-row">{actions}</div> : null}
        </div>
        {support ? <div className="page-hero__support">{support}</div> : null}
      </div>
    </section>
  );
}

function HomeHeroSection() {
  const emailHref = getContactMailtoHref("WideOrder challenge enquiry");

  return (
    <section className="hero anchor-section">
      <div className="container container--wide hero__grid">
        <div className="hero__content">
          <p className="hero__service-name">{siteContent.home.hero.serviceName}</p>
          <p className="hero__brand-promise">{siteContent.home.hero.brandPromise}</p>
          <h1 id="hero-title" className="hero__title">
            {siteContent.home.hero.statement}
          </h1>
          <p className="hero__copy">{siteContent.home.hero.supportingCopy}</p>
          <p className="hero__copy">{siteContent.home.hero.secondaryCopy}</p>
          <div className="hero__actions cta-row">
            <a className="button button--primary" href={emailHref}>
              {siteContent.home.hero.primaryCtaLabel}
            </a>
            <Link className="button button--secondary" href={siteContent.home.hero.secondaryCta.href}>
              {siteContent.home.hero.secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="hero__visual">
          <ul className="hero__list">
            {siteContent.home.hero.examples.map((example) => (
              <li key={example} className="hero__pill">
                {example}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ProcessStageCard({ stage, index }: { stage: ProcessStage; index: number }) {
  const isDiscovery = stage.title === "Discovery";

  return (
    <li className={["process__stage", isDiscovery ? "process__stage--discovery" : ""].filter(Boolean).join(" ")}>
      <div className="process__stage-badge" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="process__stage-body">
        <h3>{stage.title}</h3>
        {stage.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {stage.outcomes ? (
          <ul className="process__outcomes">
            {stage.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function DeliveryCard({ mode }: { mode: DeliveryMode | EngagementModel }) {
  return (
    <article className="engagement__model">
      <h3>{mode.title}</h3>
      <p>{mode.body}</p>
    </article>
  );
}

function PrincipleCardGrid({ principles }: { principles: readonly PrincipleCard[] }) {
  return (
    <div className="insitu__cards">
      {principles.map((principle) => (
        <article key={principle.title} className="insitu__card">
          <h3>{principle.title}</h3>
          <p>{principle.body}</p>
        </article>
      ))}
    </div>
  );
}

function ContactCard({
  subject,
  buttonLabel = "Let's talk",
}: {
  subject: string;
  buttonLabel?: string;
}) {
  const emailHref = getContactMailtoHref(subject);

  return (
    <div className="engagement__support contact-card">
      <p className="engagement__support-lead">{siteContent.contact.emailLabel}</p>
      <p className="contact-card__email">
        <a href={emailHref}>{siteConfig.contact.publicMailbox}</a>
      </p>
      <p className="contact-card__copy">Use the address directly or start a draft with the button below.</p>
      <div className="contact-card__actions">
        <a className="button button--primary" href={emailHref}>
          {buttonLabel}
        </a>
      </div>
      <ul className="contact-card__questions">
        {siteContent.contact.prompts.map((prompt) => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ul>
    </div>
  );
}

function ProofStorySummaryCard({ story }: { story: ProofStory }) {
  return (
    <Link className="engagement__model summary-card" href={`/our-work#${story.id}`}>
      <p className="proof-story__kicker">{story.title}</p>
      <p className="summary-card__result">{story.result}</p>
      <p>{story.summary}</p>
      <span className="teaser-link">Read the case study</span>
    </Link>
  );
}

function ProofStoryArticle({ story, reverse }: { story: ProofStory; reverse: boolean }) {
  return (
    <article id={story.id} className={["proof-story", reverse ? "proof-story--reverse" : ""].filter(Boolean).join(" ")}>
      <div className="proof-story__result">
        <p className="proof-story__kicker">{story.title}</p>
        <p className="proof-story__label">The result</p>
        <ProofResultAnimator title={story.title} result={story.result} />
      </div>
      <div className="proof-story__body">
        <h3>{story.title}</h3>
        <div className="proof-story__narrative-block">
          <p className="proof-story__label">The challenge</p>
          <p>{story.challenge}</p>
        </div>
        <div className="proof-story__narrative-block">
          <p className="proof-story__label">The better way</p>
          <p>{story.betterWay}</p>
        </div>
        <div className="proof-story__narrative-block">
          <p className="proof-story__label">The result</p>
          <p className="proof-story__summary">{story.interpretation}</p>
        </div>
      </div>
    </article>
  );
}

export function HomePage() {
  return (
    <PageShell>
      <HomeHeroSection />
      <section className="site-section">
        <div className="container container--wide">
          <SectionLabel>What WideOrder Does</SectionLabel>
          <h2 className="section-title">{siteContent.home.overview.statement}</h2>
          <div className="engagement__models engagement__models--triple">
            {siteContent.home.overview.cards.map((card) => (
              <article key={card.title} className="engagement__model">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="site-section site-section--contrast principle-band">
        <div className="container container--wide principle-band__inner">
          <SectionLabel>Positioning</SectionLabel>
          <h2 className="principle-band__line">{siteContent.home.positioning.lineOne}</h2>
          <p className="principle-band__line principle-band__line--second">{siteContent.home.positioning.lineTwo}</p>
          <p className="principle-band__body">{siteContent.home.positioning.body}</p>
        </div>
      </section>
      <section className="site-section site-section--surface">
        <div className="container container--wide">
          <SectionLabel>Our Work</SectionLabel>
          <h2 className="section-title">{siteContent.home.workPreview.statement}</h2>
          <p className="section-copy proof__intro">{siteContent.home.workPreview.introduction}</p>
          <div className="engagement__models">
            {siteContent.ourWork.stories.map((story) => (
              <ProofStorySummaryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      </section>
      <section className="site-section">
        <div className="container container--wide">
          <SectionLabel>Explore</SectionLabel>
          <h2 className="section-title">Move from a short introduction to the detail you need.</h2>
          <div className="engagement__models">
            {siteContent.home.detailLinks.map((item) => (
              <article key={item.href} className="engagement__model">
                <h3>{item.label}</h3>
                <p>{item.body}</p>
                <Link className="teaser-link" href={item.href}>
                  Go to {item.label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="site-section site-section--muted">
        <div className="container container--wide contact__grid">
          <div className="contact__intro">
            <SectionLabel>Contact</SectionLabel>
            <h2 className="section-title">{siteContent.contact.title}</h2>
            {siteContent.contact.paragraphs.map((paragraph) => (
              <p key={paragraph} className="section-copy">
                {paragraph}
              </p>
            ))}
          </div>
          <ContactCard subject="WideOrder enquiry" />
        </div>
      </section>
    </PageShell>
  );
}

export function WhatWeDoPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow={siteContent.whatWeDo.pageLabel}
        title={siteContent.whatWeDo.title}
        paragraphs={siteContent.whatWeDo.paragraphs}
        actions={<a className="button button--primary" href={getContactMailtoHref("WideOrder enquiry")}>{"Let's talk"}</a>}
        support={
          <div className="engagement__support">
            <p className="engagement__support-lead">What makes WideOrder different</p>
            <p>WideOrder stays focused on the problem, then helps get the right work done.</p>
          </div>
        }
      />
      <section className="site-section">
        <div className="container container--wide challenge__layout">
          <div>
            <SectionLabel>Problems We Address</SectionLabel>
            <h2 className="section-title">Businesses rarely need just one type of help.</h2>
            <p className="section-copy">WideOrder is deliberately broad in scope because operational problems do not arrive in neat categories.</p>
          </div>
          <ul className="challenge__list">
            {siteContent.whatWeDo.problemExamples.map((item) => (
              <li key={item} className="challenge__item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="site-section site-section--surface">
        <div className="container container--wide">
          <SectionLabel>Delivery Options</SectionLabel>
          <h2 className="section-title">WideOrder can stay close to the work in different ways.</h2>
          <p className="section-copy engagement__intro">{siteContent.whatWeDo.deliveryStatement}</p>
          <div className="engagement__models engagement__models--triple">
            {siteContent.whatWeDo.deliveryModes.map((mode) => (
              <DeliveryCard key={mode.title} mode={mode} />
            ))}
          </div>
        </div>
      </section>
      <section className="site-section">
        <div className="container container--wide challenge__layout">
          <div>
            <SectionLabel>Positioning</SectionLabel>
            <h2 className="section-title">{siteContent.whatWeDo.positioning.statement}</h2>
            <p className="section-copy">{siteContent.whatWeDo.positioning.body}</p>
          </div>
          <div className="engagement__support boundary-card">
            <h2>{siteContent.whatWeDo.boundaryTitle}</h2>
            <p>{siteContent.whatWeDo.boundaryBody}</p>
          </div>
        </div>
      </section>
      <section className="site-section site-section--muted">
        <div className="container container--wide challenge__layout">
          <div>
            <SectionLabel>Value</SectionLabel>
            <h2 className="section-title">Work should create a credible benefit relative to its cost.</h2>
            <p className="section-copy">WideOrder does not rely on exaggerated promises. The case for action should be commercially sensible and materially worthwhile.</p>
          </div>
          <ul className="challenge__list">
            {siteContent.whatWeDo.valuePoints.map((point) => (
              <li key={point} className="challenge__item">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}

export function HowWeWorkPage() {
  return (
    <PageShell>
      <PageHero eyebrow={siteContent.howWeWork.pageLabel} title={siteContent.howWeWork.title} paragraphs={siteContent.howWeWork.paragraphs} support={<ContactCard subject="WideOrder Discovery enquiry" />} />
      <section className="site-section">
        <div className="container container--wide">
          <SectionLabel>Process</SectionLabel>
          <h2 className="section-title">A straightforward progression.</h2>
          <ol className="process__list">
            {siteContent.howWeWork.stages.map((stage, index) => (
              <ProcessStageCard key={stage.title} stage={stage} index={index} />
            ))}
          </ol>
        </div>
      </section>
      <section className="site-section site-section--surface">
        <div className="container container--wide">
          <SectionLabel>Engagement Models</SectionLabel>
          <h2 className="section-title">{siteContent.howWeWork.engagementStatement}</h2>
          <p className="section-copy engagement__intro">{siteContent.howWeWork.engagementIntroduction}</p>
          <div className="engagement__models engagement__models--triple">
            {siteContent.howWeWork.engagementModels.map((model) => (
              <DeliveryCard key={model.title} mode={model} />
            ))}
          </div>
          <div className="engagement__support">
            <p className="engagement__support-lead">{siteContent.howWeWork.supportLead}</p>
            <h3>{siteContent.howWeWork.supportHeading}</h3>
            <p>{siteContent.howWeWork.supportBody}</p>
            <p>{siteContent.howWeWork.supportConclusion}</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function OurWorkPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow={siteContent.ourWork.pageLabel}
        title={siteContent.ourWork.title}
        paragraphs={siteContent.ourWork.paragraphs}
        actions={<a className="button button--primary" href={getContactMailtoHref("WideOrder case study enquiry")}>{"Let's talk"}</a>}
      />
      <section className="site-section">
        <div className="container container--wide">
          <SectionLabel>Case Study Summaries</SectionLabel>
          <h2 className="section-title">{siteContent.ourWork.statement}</h2>
          <p className="section-copy proof__intro">{siteContent.ourWork.introduction}</p>
          <div className="engagement__models">
            {siteContent.ourWork.stories.map((story) => (
              <ProofStorySummaryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      </section>
      <section className="site-section site-section--surface">
        <div className="container container--wide">
          <SectionLabel>Detailed Accounts</SectionLabel>
          <div className="proof__stories">
            {siteContent.ourWork.stories.map((story, index) => (
              <ProofStoryArticle key={story.id} story={story} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function OurApproachPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow={siteContent.ourApproach.pageLabel}
        title={siteContent.ourApproach.title}
        paragraphs={siteContent.ourApproach.paragraphs}
      />
      <section className="site-section site-section--contrast principle-band">
        <div className="container container--wide principle-band__inner">
          <SectionLabel>Core Principle</SectionLabel>
          <h2 className="principle-band__line">{siteContent.ourApproach.corePrinciple.lineOne}</h2>
          <p className="principle-band__line principle-band__line--second">{siteContent.ourApproach.corePrinciple.lineTwo}</p>
          <p className="principle-band__body">{siteContent.ourApproach.corePrinciple.body}</p>
        </div>
      </section>
      <section className="site-section site-section--surface">
        <div className="container container--wide insitu__grid">
          <div>
            <SectionLabel>inSITU</SectionLabel>
            <h2 className="section-title">{siteContent.ourApproach.insitu.statement}</h2>
            {siteContent.ourApproach.insitu.paragraphs.map((paragraph) => (
              <p key={paragraph} className="section-copy">
                {paragraph}
              </p>
            ))}
          </div>
          <PrincipleCardGrid principles={siteContent.ourApproach.insitu.principles} />
        </div>
        <div className="container container--wide">
          <div className="insitu__callout">
            <h3>{siteContent.ourApproach.insitu.callout}</h3>
            <p>{siteContent.ourApproach.insitu.calloutBody}</p>
          </div>
        </div>
      </section>
      <section className="site-section">
        <div className="container container--wide environment__grid">
          <div className="environment__intro">
            <SectionLabel>Existing Environment</SectionLabel>
            <h2 className="section-title">{siteContent.ourApproach.existingEnvironment.statement}</h2>
            {siteContent.ourApproach.existingEnvironment.paragraphs.map((paragraph) => (
              <p key={paragraph} className="section-copy">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="environment__model">
            <div className="environment__assessment">{siteContent.ourApproach.existingEnvironment.assess}</div>
            <div className="environment__options">
              {siteContent.ourApproach.existingEnvironment.decisions.map((decision) => (
                <div key={decision} className="environment__option">
                  {decision}
                </div>
              ))}
            </div>
            <div className="environment__outcome">
              <p>{siteContent.ourApproach.existingEnvironment.conclusionOne}</p>
              <p>{siteContent.ourApproach.existingEnvironment.conclusionTwo}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="site-section site-section--muted">
        <div className="container container--wide challenge__layout">
          <div>
            <SectionLabel>Value</SectionLabel>
            <h2 className="section-title">{siteContent.ourApproach.value.statement}</h2>
            <p className="section-copy">{siteContent.ourApproach.value.introduction}</p>
          </div>
          <ul className="challenge__list">
            {siteContent.ourApproach.value.points.map((point) => (
              <li key={point} className="challenge__item">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}

export function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow={siteContent.contact.pageLabel}
        title={siteContent.contact.title}
        paragraphs={siteContent.contact.paragraphs}
        support={<ContactCard subject="WideOrder contact enquiry" buttonLabel={siteContent.contact.buttonLabel} />}
      />
    </PageShell>
  );
}
