"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./HeroMascot.module.css";

const artwork = "/illustrations/sidekick-companion.webp";
const leftEye = "M179 252 C190 232 215 225 230 234 C220 253 198 261 179 252Z";
const rightEye = "M264 224 C274 205 297 195 314 204 C302 224 281 232 264 224Z";

export function HeroMascot({ className }: { className?: string }) {
  const id = useId();
  const root = useRef<HTMLButtonElement>(null);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [greeting, setGreeting] = useState(false);

  useEffect(() => {
    const button = root.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    let visible = false;
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      button.style.setProperty("--look-x", "0");
      button.style.setProperty("--look-y", "0");
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    observer.observe(button);
    const follow = (event: PointerEvent) => {
      if (!visible || document.hidden || motion.matches || !pointer.matches || event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = button.getBoundingClientRect();
        const dx = event.clientX - (bounds.left + bounds.width * .5);
        const dy = event.clientY - (bounds.top + bounds.height * .52);
        // Cover the whole hero on wide displays, without tracking from another section.
        const withinReach = Math.hypot(dx, dy) < Math.max(1400, innerWidth);
        button.style.setProperty("--look-x", withinReach ? String(Math.max(-1, Math.min(1, dx / 420))) : "0");
        button.style.setProperty("--look-y", withinReach ? String(Math.max(-1, Math.min(1, dy / 320))) : "0");
      });
    };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) reset(); };
    window.addEventListener("pointermove", follow, { passive: true });
    window.addEventListener("pointerout", leave);
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, { passive: true });
    document.addEventListener("visibilitychange", reset);
    motion.addEventListener("change", reset);
    pointer.addEventListener("change", reset);
    return () => {
      reset();
      clearTimeout(greetingTimer.current);
      observer.disconnect();
      window.removeEventListener("pointermove", follow);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset);
      document.removeEventListener("visibilitychange", reset);
      motion.removeEventListener("change", reset);
      pointer.removeEventListener("change", reset);
    };
  }, []);

  const sayHi = () => {
    clearTimeout(greetingTimer.current);
    setGreeting(true);
    greetingTimer.current = setTimeout(() => setGreeting(false), 1600);
  };

  return (
    <button ref={root} type="button" className={`${styles.mascot} ${className ?? ""}`}
      aria-label="Say hi to SideKick" data-greeting={greeting}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") sayHi(); }}
      onFocus={sayHi} onClick={sayHi}>
      <svg viewBox="0 0 480 399" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`${id}-head`}><path d="M0 0H480V280H366Q344 323 282 338Q213 356 157 332Q115 351 78 318H0Z" /></clipPath>
          <clipPath id={`${id}-resting-hand`}><rect x="108" y="344" width="88" height="55" /></clipPath>
          <clipPath id={`${id}-hand`}><path d="M286 376Q283 348 310 343Q345 339 366 359Q380 375 372 393Q361 402 338 397Q300 408 287 390Z" /></clipPath>
          <clipPath id={`${id}-eyes`}><path d={leftEye} /><path d={rightEye} /></clipPath>
        </defs>
        {/* A continuous neck sits behind the contoured head, so turning cannot expose a cut edge. */}
        <path d="M132 384Q136 343 181 332Q236 316 292 334Q340 343 351 384Z" fill="#002052" />
        <g className={styles.head}>
          <image href={artwork} width="480" height="399" clipPath={`url(#${id}-head)`} />
          <path d={leftEye} fill="white" /><path d={rightEye} fill="white" />
          <g clipPath={`url(#${id}-eyes)`}>
            <g className={styles.pupils} fill="#0062fd">
              <ellipse cx="205" cy="246" rx="13" ry="14" />
              <ellipse cx="289" cy="216" rx="13" ry="14" />
            </g>
          </g>
        </g>
        <image href={artwork} width="480" height="399" clipPath={`url(#${id}-resting-hand)`} />
        <g className={styles.hand}>
          <image href={artwork} width="480" height="399" clipPath={`url(#${id}-hand)`} />
        </g>
      </svg>
      <span className={styles.hello} aria-hidden="true">Hi!</span>
    </button>
  );
}
