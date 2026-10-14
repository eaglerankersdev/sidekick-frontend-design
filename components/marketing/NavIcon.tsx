import {
  LayoutGrid,
  Sparkles,
  PanelsTopLeft,
  FileSignature,
  CalendarCheck,
  Smartphone,
  Plug,
  Droplets,
  Layers,
  PackageOpen,
  Paintbrush,
  BriefcaseBusiness,
  Palette,
  type LucideProps,
} from "lucide-react";

export function TowTruck(props: LucideProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 17V9h5l3 5v3M2 13h7M10 17h12v-4H10M11 13l7-9h3M20 4v5l2 1v2h-2" />
      <path d="M2 17h1m4 0h9m4 0h2" />
      <circle cx="5" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
    </svg>
  );
}

const map: Record<string, React.ComponentType<LucideProps>> = {
  "layout-grid": LayoutGrid,
  sparkles: Sparkles,
  "panels-top-left": PanelsTopLeft,
  "file-signature": FileSignature,
  "calendar-check": CalendarCheck,
  smartphone: Smartphone,
  plug: Plug,
  droplets: Droplets,
  layers: Layers,
  truck: TowTruck,
  "package-open": PackageOpen,
  paintbrush: Paintbrush,
  "briefcase-business": BriefcaseBusiness,
  palette: Palette,
};

export function NavIcon({ name, ...rest }: { name?: string } & LucideProps) {
  const Icon = (name && map[name]) || LayoutGrid;
  return <Icon aria-hidden {...rest} />;
}
