"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type { ProofStory } from "@/content/home";

type ProofStoryTitle = ProofStory["title"];
type ProofResultAnimatorProps = {
  title: ProofStoryTitle;
  result: ProofStory["result"];
};

type AnimationPhase = "final" | "idle" | "running" | "complete";

const VISIBILITY_THRESHOLD = 0.45;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type StoryConfig = {
  key: "retail" | "technology" | "remote" | "month-end";
  durationMs: number;
  accessibleText: string;
};

function getStoryConfig(title: ProofStoryTitle): StoryConfig {
  switch (title) {
    case "Retail Pricing":
      return {
        key: "retail",
        durationMs: 620,
        accessibleText: "Approximately 20 minutes.",
      };
    case "Technology Deployment":
      return {
        key: "technology",
        durationMs: 960,
        accessibleText: "Up to 16 machines simultaneously.",
      };
    case "Remote Infrastructure & Printing":
      return {
        key: "remote",
        durationMs: 1080,
        accessibleText: "Approximately 30 minutes to zero downtime.",
      };
    case "Month-End Reporting":
      return {
        key: "month-end",
        durationMs: 1320,
        accessibleText: "Approximately 1,200 minutes to approximately 10 minutes.",
      };
    default:
      return {
        key: "retail",
        durationMs: 620,
        accessibleText: title,
      };
  }
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function formatWholeNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function getAnimatedValue(title: ProofStoryTitle, progress: number) {
  const eased = easeOutCubic(progress);

  switch (title) {
    case "Technology Deployment":
      return String(Math.max(1, Math.min(16, Math.round(1 + (15 * eased)))));
    case "Remote Infrastructure & Printing":
      return String(Math.max(0, Math.round(30 * (1 - eased))));
    case "Month-End Reporting": {
      const nextValue = Math.max(10, Math.round(10 + (1190 * (1 - eased))));
      return `~${formatWholeNumber(nextValue)}`;
    }
    default:
      return null;
  }
}

export function ProofResultAnimator({ title, result }: ProofResultAnimatorProps) {
  const config = getStoryConfig(title);
  const metricRef = useRef<HTMLParagraphElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const [phase, setPhase] = useState<AnimationPhase>("final");
  const [progress, setProgress] = useState(1);

  useLayoutEffect(() => {
    const metricNode = metricRef.current;

    if (!metricNode || typeof window === "undefined") {
      return;
    }

    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);

    if (reducedMotionMedia.matches || !("IntersectionObserver" in window)) {
      return;
    }

    const cleanupAnimation = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const finishAnimation = () => {
      cleanupAnimation();
      setProgress(1);
      setPhase("complete");
    };

    const tick = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const nextProgress = Math.min(elapsed / config.durationMs, 1);

      setProgress(nextProgress);

      if (nextProgress >= 1) {
        finishAnimation();
        return;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    const startAnimation = () => {
      if (triggeredRef.current) {
        return;
      }

      triggeredRef.current = true;
      observerRef.current?.disconnect();
      setProgress(0);
      setPhase("running");
      startTimeRef.current = null;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    queueMicrotask(() => {
      if (!triggeredRef.current) {
        setProgress(0);
        setPhase("idle");
      }
    });

    const target = metricNode.closest(".proof-story__result") ?? metricNode;

    observerRef.current = new window.IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry && entry.intersectionRatio >= VISIBILITY_THRESHOLD) {
          startAnimation();
        }
      },
      {
        threshold: [VISIBILITY_THRESHOLD],
      },
    );

    observerRef.current.observe(target);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      cleanupAnimation();
    };
  }, [config.durationMs]);

  const animatedValue = useMemo(() => getAnimatedValue(title, progress), [progress, title]);
  const style = useMemo(
    () => ({ "--proof-settle-duration": `${config.durationMs}ms` }) as CSSProperties,
    [config.durationMs],
  );

  return (
    <p
      ref={metricRef}
      className={`proof-story__metric proof-story__metric--${config.key}`}
      data-phase={phase}
      style={style}
    >
      <span className="sr-only">{config.accessibleText}</span>
      <span className="proof-metric__visual" aria-hidden="true">
        {title === "Retail Pricing" ? (
          <span className="proof-metric__reveal">{result}</span>
        ) : null}

        {title === "Technology Deployment" ? (
          <>
            <span>up to </span>
            <span className="proof-metric__number-slot proof-metric__number-slot--technology">{animatedValue ?? "16"}</span>
            <span> machines simultaneously</span>
          </>
        ) : null}

        {title === "Remote Infrastructure & Printing" ? (
          <>
            <span>~30 minutes</span>
            <span className="proof-metric__tail">
              <span className="proof-metric__arrow"> -&gt; </span>
              <span className="proof-metric__number-slot proof-metric__number-slot--remote">{animatedValue}</span>
              <span> downtime</span>
            </span>
          </>
        ) : null}

        {title === "Month-End Reporting" ? (
          <>
            <span>~1,200 minutes</span>
            <span className="proof-metric__tail">
              <span className="proof-metric__arrow"> -&gt; </span>
              <span className="proof-metric__number-slot proof-metric__number-slot--month-end">{animatedValue}</span>
              <span> minutes</span>
            </span>
          </>
        ) : null}
      </span>
    </p>
  );
}
