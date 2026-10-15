"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import s from "./ResponsiveCarousel.module.css";

export function ResponsiveCarousel({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const count = Children.count(children);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const start = cards[0]?.offsetLeft ?? 0;
      const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
      setAtEnd(end);
      const nearest = cards.reduce((best, card, i) => Math.abs(card.offsetLeft - start - el.scrollLeft) < Math.abs(cards[best].offsetLeft - start - el.scrollLeft) ? i : best, 0);
      setActive(end && el.scrollLeft > 0 ? cards.length - 1 : nearest);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => { el.removeEventListener("scroll", update); observer.disconnect(); };
  }, [count]);
  const go = (index: number) => {
    const el = track.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const target = cards[Math.max(0, Math.min(count - 1, index))];
    el.scrollTo({ left: target.offsetLeft - cards[0].offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const move = (direction: number) => {
    const el = track.current;
    if (!el || el.children.length < 2) return;
    const cards = Array.from(el.children) as HTMLElement[];
    el.scrollBy({ left: direction * (cards[1].offsetLeft - cards[0].offsetLeft), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <div className={s.carousel} data-card-carousel aria-label={label} role="region">
    <div ref={track} className={`${className} ${s.track}`} onKeyDown={event => {
      if (event.target !== event.currentTarget && !(event.target instanceof HTMLAnchorElement)) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
    }} tabIndex={0} aria-label={`${label}: swipe or use arrow keys`}>
      {children}
    </div>
    <div className={s.controls}>
      <button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label={`Previous ${label}`}><ArrowLeft aria-hidden /></button>
      <div className={s.positions} aria-label={`${label} positions`}>
        {Array.from({ length: count }, (_, i) => <button type="button" key={i} onClick={() => go(i)} aria-label={`Show ${label} ${i + 1}`} aria-current={active === i ? "true" : undefined}><span /></button>)}
      </div>
      <button type="button" onClick={() => move(1)} disabled={atEnd} aria-label={`Next ${label}`}><ArrowRight aria-hidden /></button>
    </div>
  </div>;
}
