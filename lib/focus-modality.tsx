"use client";

import { useEffect } from "react";

/** Distinguish pointer-triggered programmatic focus from keyboard navigation. */
export function FocusModality() {
  useEffect(() => {
    const root = document.documentElement;
    const pointer = () => { root.dataset.inputMode = "pointer"; };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key.startsWith("Arrow")) root.dataset.inputMode = "keyboard";
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
      delete root.dataset.inputMode;
    };
  }, []);
  return null;
}
