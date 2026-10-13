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
  Truck,
  PackageOpen,
  Paintbrush,
  BriefcaseBusiness,
  Palette,
  type LucideProps,
} from "lucide-react";

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
  truck: Truck,
  "package-open": PackageOpen,
  paintbrush: Paintbrush,
  "briefcase-business": BriefcaseBusiness,
  palette: Palette,
};

export function NavIcon({ name, ...rest }: { name?: string } & LucideProps) {
  const Icon = (name && map[name]) || LayoutGrid;
  return <Icon aria-hidden {...rest} />;
}
