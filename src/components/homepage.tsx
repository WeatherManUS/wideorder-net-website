import { homeContent, type ContactField, type ProcessStage, type ProofStory } from "@/content/home";

import { BrandMark } from "@/components/brand-mark";
import { ContactForm } from "@/components/contact-form";
import { ProofResultAnimator } from "@/components/proof-result-animator";
import { SiteHeader } from "@/components/site-header";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

function HeroSection() {
  return (
    <section className="hero anchor-section">
      <div className="container container--wide hero__grid">
        <div className="hero__content">
          <p className="hero__service-name">{homeContent.hero.serviceName}</p>
          <p className="hero__brand-promise">{homeContent.hero.brandPromise}</p>
          <h1 id="hero-title" className="hero__title">
            {homeContent.hero.statement}
          </h1>
          <p className="hero__copy">{homeContent.hero.supportingCopy}</p>
          <div className="hero__actions">
            <a className="button button--primary" href={homeContent.primaryCta.href}>
              {homeContent.primaryCta.label}
            </a>
          </div>
        </div>
        <div className="hero__visual">
          <ul className="hero__list">
            {homeContent.hero.examples.map((example) => (
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

function ChallengeSection() {
  return (
    <section id="the-challenge" className="anchor-section site-section">
      <div className="container container--wide challenge__layout">
        <div>
          <SectionLabel>The Challenge</SectionLabel>
          <h2 className="section-title">{homeContent.challenge.statement}</h2>
          <p className="section-copy">{homeContent.challenge.qualification}</p>
        </div>
        <ul className="challenge__list">
          {homeContent.challenge.examples.map((item) => (
            <li key={item} className="challenge__item">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AnotherSetOfEyesSection() {
  return (
    <section className="anchor-section site-section site-section--muted">
      <div className="container container--narrow positioning__wrap">
        <SectionLabel>Another Set of Eyes</SectionLabel>
        <h2 className="section-title">{homeContent.anotherSetOfEyes.statement}</h2>
        <p className="section-copy">{homeContent.anotherSetOfEyes.body}</p>
        <p className="positioning__statement">{homeContent.anotherSetOfEyes.lineOne}</p>
        <p className="positioning__statement positioning__statement--strong">
          {homeContent.anotherSetOfEyes.lineTwo}
        </p>
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

function HowWeWorkSection() {
  return (
    <section id="how-we-work" className="anchor-section site-section">
      <div className="container container--wide">
        <SectionLabel>How We Work</SectionLabel>
        <div className="section-heading-row">
          <h2 className="section-title">{homeContent.howWeWork.statement}</h2>
        </div>
        <ol className="process__list">
          {homeContent.howWeWork.stages.map((stage, index) => (
            <ProcessStageCard key={stage.title} stage={stage} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function CorePrincipleSection() {
  return (
    <section className="anchor-section site-section site-section--contrast principle-band">
      <div className="container container--wide principle-band__inner">
        <SectionLabel>Core Principle</SectionLabel>
        <h2 className="principle-band__line">{homeContent.corePrinciple.lineOne}</h2>
        <p className="principle-band__line principle-band__line--second">{homeContent.corePrinciple.lineTwo}</p>
        <p className="principle-band__body">{homeContent.corePrinciple.body}</p>
      </div>
    </section>
  );
}

function InSituSection() {
  return (
    <section id="philosophy" className="anchor-section site-section site-section--surface">
      <div className="container container--wide insitu__grid">
        <div>
          <SectionLabel>Philosophy</SectionLabel>
          <h2 className="section-title">{homeContent.insitu.statement}</h2>
          {homeContent.insitu.paragraphs.map((paragraph) => (
            <p key={paragraph} className="section-copy">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="insitu__cards">
          {homeContent.insitu.principles.map((principle) => (
            <article key={principle.title} className="insitu__card">
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="container container--wide">
        <div className="insitu__callout">
          <h3>{homeContent.insitu.callout}</h3>
          <p>{homeContent.insitu.calloutBody}</p>
        </div>
      </div>
    </section>
  );
}

function ExistingEnvironmentSection() {
  return (
    <section className="anchor-section site-section">
      <div className="container container--wide environment__grid">
        <div className="environment__intro">
          <SectionLabel>Existing Environment</SectionLabel>
          <h2 className="section-title">{homeContent.existingEnvironment.statement}</h2>
          {homeContent.existingEnvironment.paragraphs.map((paragraph) => (
            <p key={paragraph} className="section-copy">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="environment__model">
          <div className="environment__assessment">{homeContent.existingEnvironment.assess}</div>
          <div className="environment__options">
            {homeContent.existingEnvironment.decisions.map((decision) => (
              <div key={decision} className="environment__option">
                {decision}
              </div>
            ))}
          </div>
          <div className="environment__outcome">
            <p>{homeContent.existingEnvironment.conclusionOne}</p>
            <p>{homeContent.existingEnvironment.conclusionTwo}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofStoryArticle({ story, reverse }: { story: ProofStory; reverse: boolean }) {
  return (
    <article className={["proof-story", reverse ? "proof-story--reverse" : ""].filter(Boolean).join(" ")}>
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

function ProofSection() {
  return (
    <section id="proof" className="anchor-section site-section site-section--surface">
      <div className="container container--wide">
        <SectionLabel>Proof</SectionLabel>
        <h2 className="section-title">{homeContent.proof.statement}</h2>
        <p className="section-copy proof__intro">{homeContent.proof.introduction}</p>
        <div className="proof__stories">
          {homeContent.proof.stories.map((story, index) => (
            <ProofStoryArticle key={story.title} story={story} reverse={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EngagementSection() {
  return (
    <section id="engagement" className="anchor-section site-section">
      <div className="container container--wide">
        <SectionLabel>Engagement</SectionLabel>
        <h2 className="section-title">{homeContent.engagement.statement}</h2>
        <p className="section-copy engagement__intro">{homeContent.engagement.introduction}</p>
        <div className="engagement__models">
          {homeContent.engagement.models.map((model) => (
            <article key={model.title} className="engagement__model">
              <h3>{model.title}</h3>
              <p>{model.body}</p>
            </article>
          ))}
        </div>
        <div className="engagement__support">
          <p className="engagement__support-lead">{homeContent.engagement.supportLead}</p>
          <h3>{homeContent.engagement.supportHeading}</h3>
          <p>{homeContent.engagement.supportBody}</p>
          <p>{homeContent.engagement.supportConclusion}</p>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="anchor-section site-section site-section--muted">
      <div className="container container--wide contact__grid">
        <div className="contact__intro">
          <SectionLabel>Contact</SectionLabel>
          <h2 className="section-title">{homeContent.contact.statement}</h2>
          <p className="section-copy">{homeContent.contact.body}</p>
        </div>
        <ContactForm
          fields={homeContent.contact.fields as readonly ContactField[]}
          messageLabel={homeContent.contact.messageLabel}
          helperText={homeContent.contact.helperText}
          exampleText={homeContent.contact.exampleText}
          privacyText={homeContent.contact.privacyText}
          submitLabel={homeContent.contact.submitLabel}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        />
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container container--wide site-footer__grid">
        <div className="site-footer__identity">
          <BrandMark className="site-footer__brand" />
          <p>{homeContent.footer.identity[1]}</p>
          <p>{homeContent.footer.identity[2]}</p>
          <p className="site-footer__philosophy">{homeContent.footer.philosophy}</p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer navigation">
          <ul>
            {homeContent.footer.navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export function HomePage() {
  return (
    <div id="top" className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader navItems={homeContent.navItems} cta={homeContent.primaryCta} />
      <main id="main-content" className="site-main" tabIndex={-1}>
        <HeroSection />
        <ChallengeSection />
        <AnotherSetOfEyesSection />
        <HowWeWorkSection />
        <CorePrincipleSection />
        <InSituSection />
        <ExistingEnvironmentSection />
        <ProofSection />
        <EngagementSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}

