"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { NavIcon } from "./NavIcon";
import s from "./IndustryMarquee.module.css";

type Item = { name: string; icon: string };

export function IndustryMarquee({ items }: { items: Item[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <section className={s.section} aria-label="Industries we serve" data-industry-marquee>
      <div className={`container ${s.heading}`}>
        <p>Made for your kind of work<span className={s.dot} aria-hidden /></p>
        <div className={s.controls}>
          <Link href="/industries">All industries <ArrowUpRight aria-hidden /></Link>
          <button type="button" className={s.toggle} onClick={() => setPaused(!paused)} aria-label={paused ? "Resume industry animation" : "Pause industry animation"} aria-pressed={paused}>
            {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
          </button>
        </div>
      </div>
      <div className={s.window}>
        <div className={s.track} data-paused={paused}>
          {[0, 1].map(copy => (
            <ul key={copy} className={s.group} aria-hidden={copy === 1 ? true : undefined}>
              {items.map(item => <li key={item.name}><span className={s.icon}><NavIcon name={item.icon} /></span><span>{item.name}</span><span className={s.separator} aria-hidden>✦</span></li>)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
