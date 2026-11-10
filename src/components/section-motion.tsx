"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SectionMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!("IntersectionObserver" in window)) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches) continue;
        const animation = entry.target.animate(
          [{ opacity: 0.65, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 480, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)" },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    }, { threshold: 0.06 });
    // Content is visible before hydration, with JavaScript disabled, and if observation fails.
    document.querySelectorAll(".site-main > section:not(:first-child)").forEach((section) => observer.observe(section));
    const stopMotion = () => {
      if (preference.matches) animations.forEach((animation) => animation.cancel());
    };
    preference.addEventListener("change", stopMotion);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener("change", stopMotion);
    };
  }, [pathname]);

  return null;
}
