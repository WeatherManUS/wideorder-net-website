"use client";

import { useId, useState } from "react";
import type { ProofStory } from "@/content/home";
import { trackMarketingEvent } from "@/lib/marketing/browser";

export function CaseStudyComparison({ story }: { story: ProofStory }) {
  const [after, setAfter] = useState(false);
  const id = useId();
  return <div className="case-comparison">
    <div className="cta-row" role="group" aria-label={`${story.title}: compare before and after`}>
      {[false, true].map(value => <button key={String(value)} type="button" className="button button--secondary"
        aria-label={value ? "After" : "Before"} aria-pressed={after === value} aria-controls={id} onClick={() => {
          if (value === after) return;
          setAfter(value);
          trackMarketingEvent("case_study_interaction", { case_study_id: story.id, interaction_type: "comparison_toggle" });
        }}>{value ? "After" : "Before"}</button>)}
    </div>
    <p id={id} aria-live="polite" aria-atomic="true">{after ? story.interpretation : story.challenge}</p>
  </div>;
}
