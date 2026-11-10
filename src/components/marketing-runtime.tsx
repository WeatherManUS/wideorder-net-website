"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { TrackingConfig } from "@/config/marketing";
import { CONSENT_CHANGE, OPEN_PREFERENCES, clearOnConsentLoss, forgetPage, getConsent, initializeMarketing, privacySignals, publicPageId, setConsent, trackMarketingEvent, trackPage } from "@/lib/marketing/browser";

export function TrackingPreferencesButton() {
  return <button type="button" className="tracking-preferences" onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES))}>Tracking preferences</button>;
}

export function MarketingRuntime() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<TrackingConfig | null>(null);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [signal, setSignal] = useState({ gpc: false, dnt: false });
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let alive = true;
    const show = () => {
      returnFocus.current = document.activeElement as HTMLElement;
      const consent = getConsent();
      setAnalytics(consent.analytics); setMarketing(consent.marketing); setSignal(privacySignals()); setOpen(true);
    };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === "wideorder-consent-v1") { clearOnConsentLoss(); location.reload(); }
    };
    window.addEventListener(OPEN_PREFERENCES, show);
    window.addEventListener("storage", storageChanged);
    void fetch("/api/marketing-config", { cache: "no-store" }).then((response) => response.json()).then((value: TrackingConfig) => {
      if (!alive) return;
      setSettings(value);
      if (location.pathname !== "/privacy" && value.enabled && Object.entries(value).some(([key, setting]) => ["ga4", "gtm", "linkedin", "meta", "googleAds", "x"].includes(key) && Boolean(setting)) && !getConsent().updatedAt) show();
    }).catch(() => { /* Configuration failure leaves optional tracking disabled. */ });
    return () => {
      alive = false;
      window.removeEventListener(OPEN_PREFERENCES, show);
      window.removeEventListener("storage", storageChanged);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;
    const changed = () => { clearOnConsentLoss(); initializeMarketing(settings); trackPage(); };
    window.addEventListener(CONSENT_CHANGE, changed);
    return () => window.removeEventListener(CONSENT_CHANGE, changed);
  }, [settings]);

  useEffect(() => {
    if (!settings) return;
    forgetPage();
    seen.current.clear();
    initializeMarketing(settings); trackPage();
    const recordCase = (id: string, kind: string) => {
      if (seen.current.has(id)) return;
      if (trackMarketingEvent("case_study_view", { case_study_id: id, interaction_type: kind })) seen.current.add(id);
    };
    const slug = pathname.startsWith("/our-work/") ? pathname.split("/").pop() : null;
    if (slug) recordCase(slug, "landing_page");
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) recordCase(entry.target.id, "article_visible");
    }, { threshold: 0.35 });
    document.querySelectorAll("article.proof-story[id]").forEach((element) => observer?.observe(element));
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a");
      if (!link) return;
      const position = link.closest("header") ? "header" : link.closest("footer") ? "footer" : link.closest(".hero") ? "hero" : "body";
      if (link.dataset.socialPlatform) trackMarketingEvent("social_outbound_click", { platform: link.dataset.socialPlatform, cta_position: position });
      if (link.classList.contains("button")) trackMarketingEvent("cta_click", { cta_position: position, interaction_type: link.protocol === "mailto:" ? "email" : "navigation" });
      if (link.protocol === "mailto:") trackMarketingEvent("contact_start", { cta_position: position, interaction_type: "email" });
      if (link.hasAttribute("download") && link.dataset.contentId) trackMarketingEvent("resource_download", { content_id: link.dataset.contentId, content_category: "marketing_resource" });
    };
    document.addEventListener("click", click);
    const consentChanged = () => {
      if (slug) recordCase(slug, "landing_page");
      document.querySelectorAll("article.proof-story[id]").forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < innerHeight && rect.bottom > 0) recordCase(element.id, "article_visible");
      });
    };
    window.addEventListener(CONSENT_CHANGE, consentChanged);
    return () => { observer?.disconnect(); document.removeEventListener("click", click); window.removeEventListener(CONSENT_CHANGE, consentChanged); };
  }, [pathname, settings]);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const regions = [...document.querySelectorAll<HTMLElement>(".site-header, .site-main, .site-footer, .skip-link")];
    const previous = regions.map((region) => region.inert);
    const overflow = document.body.style.overflow;
    regions.forEach((region) => { region.inert = true; });
    document.body.style.overflow = "hidden";
    return () => { regions.forEach((region, index) => { region.inert = previous[index]; }); document.body.style.overflow = overflow; };
  }, [open]);

  const close = () => { setOpen(false); window.requestAnimationFrame(() => returnFocus.current?.focus()); };
  const save = (allowAnalytics: boolean, allowMarketing: boolean) => { setConsent(allowAnalytics, allowMarketing); close(); };
  const services = settings ? [[settings.ga4, "Google Analytics 4"], [settings.gtm, "Google Tag Manager"], [settings.linkedin, "LinkedIn"], [settings.meta, "Meta"], [settings.googleAds, "Google Ads"], [settings.x, "X"]].filter(([id]) => id).map(([, label]) => label) : [];
  if (publicPageId(pathname) === "other" || !open) return null;
  return (
    <div ref={panel} className="consent-panel" role="dialog" aria-modal="true" aria-labelledby="tracking-title" tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
        if (event.key !== "Tab") return;
        const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}>
      <h2 id="tracking-title">Your tracking choices</h2>
      <p>Essential security and contact features work without optional tracking. Choose whether WideOrder may measure visits and campaign results. <Link href="/privacy">Read our privacy information.</Link></p>
      {!settings?.enabled ? <p>Optional tracking is currently disabled on this website.</p> : null}
      {services.length ? <p>Configured measurement services: {services.join(", ")}.</p> : null}
      {signal.gpc || signal.dnt ? <p>Your browser privacy signal restricts optional tracking. Advertising stays off with Global Privacy Control; Do Not Track also keeps analytics off.</p> : null}
      <label><input type="checkbox" checked={analytics} disabled={signal.dnt || !settings?.enabled} onChange={(event) => setAnalytics(event.target.checked)} />Analytics — visits, case studies, and successful inquiries</label>
      <label><input type="checkbox" checked={marketing} disabled={signal.gpc || signal.dnt || !settings?.enabled} onChange={(event) => setMarketing(event.target.checked)} />Advertising — campaign measurement through configured platforms</label>
      <div className="consent-panel__actions">
        <button className="button button--secondary" onClick={() => save(false, false)}>Reject optional</button>
        <button className="button button--secondary" onClick={() => save(analytics, marketing)}>Save choices</button>
        <button className="button button--secondary" disabled={!settings?.enabled} onClick={() => save(true, true)}>Accept optional</button>
      </div>
      <button type="button" className="tracking-preferences" onClick={close}>Close without changing choices</button>
    </div>
  );
}
