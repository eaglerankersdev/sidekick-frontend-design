/**
 * Tailwind class strings shared by the Tailwind-styled pages (pricing, contact, checkout).
 * They mirror the site's global .container / .section / .btn primitives from app/globals.css.
 * Radius uses `!` because the unlayered global :focus-visible rule sets a 6px radius.
 */
export const wrap = "mx-auto w-full max-w-[calc(var(--maxw)+var(--gutter)*2)] px-(--gutter)";
export const section = "relative py-(--section-y)";

const btn =
  "relative inline-flex min-h-12 max-w-full items-center justify-center gap-2.5 rounded-btn! px-5.5 py-3 text-center text-base leading-tight font-bold " +
  "transition-[transform,box-shadow,background-color,color] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] " +
  "motion-reduce:transform-none max-sm:min-h-[50px] [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:transition-transform hover:[&_svg]:translate-x-[3px]";

export const btnPrimary = `${btn} bg-cobalt text-white shadow-cobalt hover:bg-cobalt-hover`;
export const btnGhost = `${btn} bg-white text-navy ring-[1.5px] ring-line ring-inset hover:bg-ice hover:text-cobalt hover:ring-light-blue`;
export const btnLight = `${btn} bg-white text-navy hover:bg-ice hover:text-cobalt`;
export const btnOutlineLight = `${btn} text-white ring-[1.5px] ring-white/35 ring-inset hover:bg-white hover:text-navy`;

export const textLink = "inline-flex items-center gap-1.5 font-bold text-cobalt underline-offset-[5px] hover:underline [&_svg]:size-4";
