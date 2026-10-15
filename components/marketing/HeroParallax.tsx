"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Keep the server-rendered hero intact; enhance only its existing visual layers. */
export function HeroParallax({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ mobile: "(max-width: 600px)", desktop: "(min-width: 1080px)", tablet: "(min-width: 601px) and (max-width: 1079px)", reduce: "(prefers-reduced-motion: reduce)" }, context => {
      if (context.conditions?.reduce) return;
      const desktop = context.conditions?.desktop;
      const tablet = context.conditions?.tablet;
      const distances: Record<string, number> = desktop
        ? { backdrop: 65, copy: -24, workspace: 32, phone: -52, status: -32 }
        : tablet ? { backdrop: 28, workspace: 10, phone: -18, status: -12 }
        : { backdrop: 10 };
      const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: .45, invalidateOnRefresh: true } });
      for (const [layer, distance] of Object.entries(distances)) {
        const target = section.querySelector(`[data-hero-layer="${layer}"]`);
        if (target) timeline.fromTo(target, { "--hero-depth-y": "0px" }, { "--hero-depth-y": `${distance}px`, duration: 1, ease: "none" }, 0);
      }
    }, section);
    return () => media.revert();
  }, []);
  return <section ref={root} className={className} data-hero-parallax>{children}</section>;
}
