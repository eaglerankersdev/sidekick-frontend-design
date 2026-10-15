"use client";

import { useEffect, useRef, useState } from "react";
import { NavIcon } from "./NavIcon";
import s from "./IndustryMarquee.module.css";

type Item = { name: string; icon: string };

export function IndustryMarquee({ items }: { items: Item[] }) {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let inView = true;
    const sync = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);
  return (
    <section ref={section} className={s.section} aria-label="Industries we serve" data-industry-marquee>
      <button type="button" className={s.motionControl} onClick={() => setPaused(!paused)} aria-pressed={paused}>
        {paused ? "Resume industry animation" : "Pause industry animation"}
      </button>
      <div className={s.window}>
        <div className={s.track} data-paused={paused || !visible}>
          {[0, 1].map(copy => (
            <ul key={copy} className={s.group} aria-hidden={copy === 1 ? true : undefined}>
              {items.map(item => <li key={item.name}><span className={s.icon}><NavIcon name={item.icon} /></span><span>{item.name}</span><span className={s.separator} aria-hidden><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0 8 4 12 6 8 8 6 12 4 8 0 6 4 4Z" /></svg></span></li>)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
