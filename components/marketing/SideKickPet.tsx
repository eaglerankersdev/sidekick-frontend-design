"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import styles from "./SideKickPet.module.css";

type Pose = "idle" | "wave";
const HIDDEN_KEY = "sidekick-pet-hidden";

export function SideKickPet() {
  const root = useRef<HTMLDivElement>(null);
  const position = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const dragged = useRef(false);
  const moved = useRef(false);
  const [dragging, setDragging] = useState(false);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [obstructed, setObstructed] = useState(false);
  const [reaction, setReaction] = useState<Pose | null>(null);

  useEffect(() => {
    try { if (sessionStorage.getItem(HIDDEN_KEY)) return; } catch { /* Storage is optional. */ }
    const image = new Image();
    image.onload = () => setReady(true);
    image.src = "/illustrations/sidekick-pet.webp";
    return () => { image.onload = null; };
  }, []);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(media.matches);
    const syncObstruction = () => {
      setObstructed(document.hidden || Boolean(
        document.querySelector("dialog[open]") ||
        document.activeElement?.closest("input, textarea, select, [contenteditable='true']")
      ));
    };
    // Native dialogs enter the top layer; stop the companion while they are open.
    const observer = new MutationObserver(syncObstruction);
    observer.observe(document.body, {subtree: true, attributes: true, attributeFilter: ["open"]});
    syncMotion();
    syncObstruction();
    media.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncObstruction);
    document.addEventListener("focusin", syncObstruction);
    document.addEventListener("focusout", syncObstruction);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncObstruction);
      document.removeEventListener("focusin", syncObstruction);
      document.removeEventListener("focusout", syncObstruction);
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    };
  }, []);

  function place(x: number, y: number) {
    const size = root.current?.offsetWidth ?? 100;
    position.current = { x: Math.max(8, Math.min(innerWidth - size - 8, x)), y: Math.max(matchMedia("(max-width: 600px)").matches ? 8 : 60, Math.min(innerHeight - size - 8, y)) };
    if (root.current) root.current.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`;
  }

  useEffect(() => {
    if (!ready || dismissed) return;
    const resize = () => {
      const size = root.current?.offsetWidth ?? 100;
      const mobile = matchMedia("(max-width: 600px)").matches;
      if (moved.current && position.current) place(position.current.x, position.current.y);
      else place(innerWidth - size - (mobile ? 8 : 16), innerHeight - size - (mobile ? 8 : 80));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [ready, dismissed]);

  function react(pose: Pose) {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction(pose);
    reactionTimer.current = setTimeout(() => setReaction(null), 1400);
  }

  function dismiss() {
    try { sessionStorage.setItem(HIDDEN_KEY, "1"); } catch { /* Still dismiss without storage. */ }
    setDismissed(true);
  }

  if (!ready || dismissed) return null;
  const currentPose = reaction ?? "idle";

  return (
    <div
      ref={root}
      className={styles.pet}
      data-pose={currentPose}
      data-still={paused || reduced}
      data-dragging={dragging}
      hidden={obstructed}
      onKeyDown={event => { if (event.key === "Escape") dismiss(); }}
    >
      <button className={styles.character} type="button" aria-label="Say hello to SideKick"
        title="Drag to move SideKick. Arrow keys also move it."
        onPointerEnter={event => {
          if (event.pointerType === "mouse" && !drag.current) react("wave");
        }}
        onPointerDown={event => {
          if (event.button !== 0 || !position.current) return;
          dragged.current = false;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: position.current.x, startY: position.current.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x, dy = event.clientY - start.y;
          if (Math.hypot(dx, dy) > 4) { dragged.current = true; moved.current = true; setDragging(true); setReaction(null); }
          if (dragged.current) place(start.startX + dx, start.startY + dy);
        }}
        onPointerUp={event => {
          drag.current = null;
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
        onPointerCancel={() => { dragged.current = true; drag.current = null; setDragging(false); }}
        onKeyDown={event => {
          const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
          const step = directions[event.key];
          if (!step || !position.current) return;
          event.preventDefault();
          moved.current = true;
          const distance = event.shiftKey ? 50 : 20;
          place(position.current.x + step[0] * distance, position.current.y + step[1] * distance);
        }}
        onClick={event => {
          if (dragged.current && event.detail !== 0) { dragged.current = false; return; }
          event.currentTarget.focus({preventScroll: true});
          react("wave");
        }}>
        <span className={styles.bounce} aria-hidden="true">
          <span className={styles.sprite} data-pet-sprite />
        </span>
        <span className={styles.shadow} aria-hidden="true" />
        {reaction === "wave" && <span className={styles.greeting} role="status">Hi!</span>}
      </button>
      <div className={styles.controls} role="group" aria-label="SideKick companion controls">
        <button type="button" aria-label={paused ? "Resume SideKick" : "Pause SideKick"} title={paused ? "Resume SideKick" : "Pause SideKick"} onClick={() => {
          setPaused(value => !value);
          setReaction(null);
        }}>
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <button type="button" aria-label="Hide SideKick for this visit" title="Hide for this visit" onClick={dismiss}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
