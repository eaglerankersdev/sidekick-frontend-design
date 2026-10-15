"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Quote, UserRound } from "lucide-react";
import s from "./Testimonials.module.css";

export type Testimonial = { id: string; quote: string; name: string; role: string; company: string; portrait?: string };

export function Testimonials({ items, preview = false }: { items: Testimonial[]; preview?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [groupSize, setGroupSize] = useState(3);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 700px)");
    const updateGroup = () => setGroupSize(mobile.matches ? 2 : 3);
    updateGroup(); mobile.addEventListener("change", updateGroup);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update(); query.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 });
    if (root.current) observer.observe(root.current);
    const visibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener("visibilitychange", visibility);
    return () => { mobile.removeEventListener("change", updateGroup); observer.disconnect(); query.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const playing = !paused && !hovered && visible && !reduced && items.length > 1;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setSelected(value => (value + 1) % items.length), 6500);
    return () => clearTimeout(timer);
  }, [selected, playing, items.length]);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const touch = useRef<{ x: number; y: number } | null>(null);
  if (!items.length) return null;
  const index = Math.min(selected, items.length - 1);
  const select = (next: number, focus = false) => {
    const normalized = (next + items.length) % items.length;
    setPaused(true);
    setSelected(normalized);
    if (focus) requestAnimationFrame(() => tabs.current[normalized]?.focus({ preventScroll: true }));
  };
  const onKey = (event: KeyboardEvent) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
    if (next !== null) { event.preventDefault(); select(next, true); }
  };
  return <section className={`section ${s.section}`} aria-labelledby={`${id}-title`} data-testimonials ref={root} onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setPaused(true)}>
    <div className={`container ${s.layout}`}>
      <div className={s.heading}>
        <h2 id={`${id}-title`}>In their own words.</h2>
        {preview && <p className={s.notice}>Demo testimonials · fictional people and illustrative quotes, not customer endorsements.</p>}
      </div>
      <div className={s.stage} onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => {
        if (!touch.current) return;
        const point = event.changedTouches[0];
        const dx = point.clientX - touch.current.x, dy = point.clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) { setPaused(true); select(index + (dx < 0 ? 1 : -1)); }
      }}>
        <Quote className={s.quoteMark} aria-hidden />
        <div className={s.slides}>
          {items.map((item, i) => <div key={item.id} id={`${id}-panel-${i}`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`} aria-hidden={index !== i} className={s.slide} data-active={index === i}>
            <blockquote><p>{item.quote}</p></blockquote>
            <div className={s.author}>
              <div className={s.avatar}>{item.portrait ? <img src={item.portrait} alt="" width={52} height={52} loading="lazy" /> : <UserRound aria-hidden />}</div>
              <div><strong>{item.name}</strong><span>{item.role}{item.role && item.company ? " · " : ""}{item.company}</span></div>
            </div>
          </div>)}
        </div>
        <div className={s.controls}>
          <p className={s.status} aria-live={playing ? "off" : "polite"} aria-atomic="true">{index + 1} of {items.length}<span> — {items[index].name}</span></p>
          <div className={s.arrows}>
            <button type="button" aria-label="Previous testimonial" onClick={() => select(index - 1)} disabled={items.length < 2}><ArrowLeft aria-hidden /></button>
            <button type="button" aria-label="Next testimonial" onClick={() => select(index + 1)} disabled={items.length < 2}><ArrowRight aria-hidden /></button>
          </div>
        </div>
      </div>
      <div role="tablist" aria-label="Customer testimonials" className={s.tabs} onKeyDown={onKey}>
        {items.map((item, i) => <button key={item.id} ref={el => { tabs.current[i] = el; }} type="button" role="tab" hidden={Math.floor(i / groupSize) !== Math.floor(index / groupSize)} id={`${id}-tab-${i}`} aria-controls={`${id}-panel-${i}`} aria-selected={index === i} tabIndex={index === i ? 0 : -1} onClick={() => select(i)}>
          <span><strong>{item.name}</strong><small>{item.company}</small></span>
        </button>)}
      </div>
      <div className={s.groups} aria-label="Testimonial groups">
        {Array.from({ length: Math.ceil(items.length / groupSize) }, (_, group) => <button key={group} type="button" aria-label={`Show testimonial group ${group + 1}`} aria-pressed={Math.floor(index / groupSize) === group} onClick={() => select(group * groupSize)}><span /></button>)}
      </div>
    </div>
  </section>;
}
