"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export const REDUCED = "(prefers-reduced-motion: reduce)";
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED).matches;
}

/** Route-scoped motion; content stays visible without JS or when motion is reduced. */
export function MotionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const media = gsap.matchMedia();
    let mounted = true;
    media.add({
      desktop: "(min-width: 960px)",
      mobile: "(max-width: 959px)",
      motion: "(prefers-reduced-motion: no-preference)",
    }, (context) => {
      if (!context.conditions?.motion) return;
      const desktop = context.conditions.desktop;
      root.classList.add("motion-ok");

      const reveal = (el: HTMLElement, delay = 0) => {
        if (el.classList.contains("is-in")) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 94%",
          once: true,
          onEnter: () => gsap.to(el, {
            opacity: 1, y: 0, scale: 1,
            duration: 0.55, ease: "power3.out", delay,
            onStart: () => el.classList.add("is-in"),
            clearProps: "transform,opacity",
          }),
        });
      };
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(el => reveal(el, Math.min(Number(el.dataset.delay ?? 0), 0.15)));
      // Trigger each card individually so a tall mobile list never reveals off screen.
      gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]").forEach(group => {
        Array.from(group.children).forEach((el, index) => reveal(el as HTMLElement, desktop ? (index % 4) * 0.05 : 0));
      });
      gsap.utils.toArray<HTMLElement>("[data-story-step]").forEach(el => {
        ScrollTrigger.create({ trigger: el, start: "top 65%", end: "bottom 35%", toggleClass: "is-current" });
      });
      if (desktop) {
        gsap.utils.toArray<HTMLElement>("[data-scroll-visual]").forEach(el => {
          gsap.fromTo(el, { y: 12 }, {
            y: -16, ease: "none",
            scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: 0.8 },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-scroll-orb]").forEach((el, index) => {
          gsap.to(el, {
            x: index % 2 ? -45 : 45, y: index % 2 ? -30 : 30, ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 1 },
          });
        });
      }
      return () => root.classList.remove("motion-ok");
    });

    const refresh = () => { if (mounted) ScrollTrigger.refresh(); };
    const timer = window.setTimeout(refresh, 300);
    document.fonts.ready.then(refresh);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
      media.revert();
      root.classList.remove("motion-ok");
    };
  }, [pathname]);

  return null;
}
