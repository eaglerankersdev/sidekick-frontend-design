"use client";

/**
 * White-label branding preview: the same CRM mock re-themed per sample brand.
 * Sample brands are fictional placeholders, clearly labelled as a concept.
 */
import { useId, useState } from "react";
import { Browser, DashboardMock, PreviewLabel } from "@/components/mocks/Mocks";
import s from "./BrandPreview.module.css";

const brands = [
  { name: "Your Brand", navy: "#002052", cobalt: "#0062FD", ice: "#E6F0FF", light: "#87B5FF" },
  { name: "Sample brand A", navy: "#143d2b", cobalt: "#0a7a4f", ice: "#e3f6ee", light: "#7fd0ab" },
  { name: "Sample brand B", navy: "#3b1d4a", cobalt: "#7c3aed", ice: "#f1e9ff", light: "#c4a7ff" },
  { name: "Sample brand C", navy: "#4a2a0a", cobalt: "#d97706", ice: "#fff3d6", light: "#ffd37a" },
];

export function BrandPreview({ dark = false }: { dark?: boolean }) {
  const [i, setI] = useState(0);
  const id = useId();
  const b = brands[i];
  return (
    <div className={`${s.wrap} ${dark ? s.dark : ""}`}>
      <div className={s.picker} role="radiogroup" aria-label="Sample brand">
        {brands.map((br, idx) => (
          <label
            key={br.name}
            className={`${s.swatch} ${i === idx ? s.swatchOn : ""}`}
            style={{ ["--sw" as string]: br.cobalt, ["--sw2" as string]: br.navy }}
          >
            <input className="sr-only" type="radio" name={id} value={idx} checked={i === idx} onChange={() => setI(idx)} />
            <i aria-hidden />
            {br.name}
          </label>
        ))}
      </div>
      <div
        className={s.stage}
        style={{
          ["--navy" as string]: b.navy,
          ["--cobalt" as string]: b.cobalt,
          ["--ice" as string]: b.ice,
          ["--light-blue" as string]: b.light,
          ["--blue" as string]: b.cobalt,
        }}
      >
        <PreviewLabel>Concept preview · {b.name}</PreviewLabel>
        <Browser url={`crm.${b.name.toLowerCase().replace(/\s+/g, "")}.com`}>
          <DashboardMock brand={b.name} />
        </Browser>
      </div>
    </div>
  );
}
