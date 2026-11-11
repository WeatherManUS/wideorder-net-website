"use client";
import type { ProofStory } from "@/content/home";
import { comparisons } from "@/content/comparisons";
import { trackMarketingEvent } from "@/lib/marketing/browser";
export function CaseStudyComparison({ story }: { story: ProofStory }) {
  const data = comparisons[story.id];
  return <div className="comparison" data-story={story.id}>
    <div className="comparison__panels">
      {([false, true] as const).map(after => <section className={`comparison__panel comparison__panel--${after ? "after" : "before"}`} key={String(after)} aria-label={`${story.title}: ${after ? "After" : "Before"}`}>
        <div className="comparison__eyebrow"><span>{after ? "AFTER" : "BEFORE"}</span><span aria-hidden="true">{after ? "\u2197" : "\u21ba"}</span></div>
        <p className="comparison__value">{after ? data.after : data.before}</p><p className="comparison__unit">{data.unit}</p>
        <ol className="workflow" aria-label={`${after ? "Simplified" : "Previous"} workflow`}>
          {(after ? data.afterSteps : data.beforeSteps).map((step, index) => <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{step}</li>)}
        </ol>
        <details className="disclosure" onToggle={event => { if (event.currentTarget.open) trackMarketingEvent("case_study_interaction", { case_study_id: story.id, interaction_type: "comparison_toggle" }); }}>
          <summary>{after ? "How it changed" : "Explore the challenge"}</summary><p>{after ? story.betterWay : story.challenge}</p>
        </details>
      </section>)}
    </div>
    <div className="comparison__outcome"><span>THE DIFFERENCE</span><p>{data.outcome}</p></div><p className="comparison__note">{data.note}</p>
  </div>;
}
