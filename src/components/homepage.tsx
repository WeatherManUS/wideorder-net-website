import { siteConfig } from "@/config/site";
import { homeContent, type DeliveryMode, type ProcessStage } from "@/content/home";

import { BrandMark } from "@/components/brand-mark";
import { SiteHeader } from "@/components/site-header";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

function HeroSection({ emailHref }: { emailHref: string }) {
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
            <a className="button button--primary" href={emailHref}>
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

function PositioningSection() {
  return (
    <section className="anchor-section site-section site-section--muted">
      <div className="container container--narrow positioning__wrap">
        <SectionLabel>Positioning</SectionLabel>
        <h2 className="section-title">{homeContent.positioning.statement}</h2>
        <p className="section-copy">{homeContent.positioning.body}</p>
        <p className="positioning__statement">{homeContent.positioning.lineOne}</p>
        <p className="positioning__statement positioning__statement--strong">{homeContent.positioning.lineTwo}</p>
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

function PrincipleSection() {
  return (
    <section className="anchor-section site-section site-section--contrast principle-band">
      <div className="container container--wide principle-band__inner">
        <SectionLabel>Core Principle</SectionLabel>
        <h2 className="principle-band__line">{homeContent.principle.lineOne}</h2>
        <p className="principle-band__line principle-band__line--second">{homeContent.principle.lineTwo}</p>
        <p className="principle-band__body">{homeContent.principle.body}</p>
      </div>
    </section>
  );
}

function DeliveryCard({ mode }: { mode: DeliveryMode }) {
  return (
    <article className="engagement__model">
      <h3>{mode.title}</h3>
      <p>{mode.body}</p>
    </article>
  );
}

function DeliverySection() {
  return (
    <section id="delivery" className="anchor-section site-section site-section--surface">
      <div className="container container--wide">
        <SectionLabel>Delivery</SectionLabel>
        <h2 className="section-title">{homeContent.delivery.statement}</h2>
        <p className="section-copy engagement__intro">{homeContent.delivery.introduction}</p>
        <div className="engagement__models engagement__models--triple">
          {homeContent.delivery.modes.map((mode) => (
            <DeliveryCard key={mode.title} mode={mode} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueSection() {
  return (
    <section id="value" className="anchor-section site-section">
      <div className="container container--wide challenge__layout">
        <div>
          <SectionLabel>Value</SectionLabel>
          <h2 className="section-title">{homeContent.value.statement}</h2>
          <p className="section-copy">{homeContent.value.introduction}</p>
        </div>
        <ul className="challenge__list">
          {homeContent.value.points.map((point) => (
            <li key={point} className="challenge__item">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BoundariesSection() {
  return (
    <section className="anchor-section site-section site-section--muted">
      <div className="container container--wide">
        <SectionLabel>Specialist Boundaries</SectionLabel>
        <div className="engagement__support boundary-card">
          <h2>{homeContent.boundaries.statement}</h2>
          <p>{homeContent.boundaries.body}</p>
          <p>{homeContent.boundaries.note}</p>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ emailHref }: { emailHref: string }) {
  return (
    <section id="contact" className="anchor-section site-section">
      <div className="container container--wide contact__grid">
        <div className="contact__intro">
          <SectionLabel>Contact</SectionLabel>
          <h2 className="section-title">{homeContent.contact.statement}</h2>
          <p className="section-copy">{homeContent.contact.body}</p>
        </div>
        <div className="engagement__support contact-card">
          <p className="engagement__support-lead">{homeContent.contact.emailLabel}</p>
          <p className="contact-card__email">
            <a href={emailHref}>{siteConfig.contact.publicMailbox}</a>
          </p>
          <div className="contact-card__actions">
            <a className="button button--primary" href={emailHref}>
              {homeContent.contact.buttonLabel}
            </a>
          </div>
          <ul className="contact-card__questions">
            {homeContent.contact.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
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
  const emailHref = `mailto:${siteConfig.contact.publicMailbox}?subject=${encodeURIComponent("WideOrder enquiry")}`;
  const headerCta = { ...homeContent.primaryCta, href: emailHref };

  return (
    <div id="top" className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader navItems={homeContent.navItems} cta={headerCta} />
      <main id="main-content" className="site-main" tabIndex={-1}>
        <HeroSection emailHref={emailHref} />
        <ChallengeSection />
        <PositioningSection />
        <HowWeWorkSection />
        <PrincipleSection />
        <DeliverySection />
        <ValueSection />
        <BoundariesSection />
        <ContactSection emailHref={emailHref} />
      </main>
      <SiteFooter />
    </div>
  );
}
