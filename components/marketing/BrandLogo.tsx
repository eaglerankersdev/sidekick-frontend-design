import Image from "next/image";
import s from "./BrandLogo.module.css";

const brands = {
  claude: { name: "Claude", file: "claude.svg" },
  chatgpt: { name: "ChatGPT", file: "chatgpt.svg" },
  cursor: { name: "Cursor", file: "cursor.svg" },
  mcp: { name: "Model Context Protocol", file: "mcp.svg" },
  meta: { name: "Meta", file: "meta.svg" },
  googleAds: { name: "Google Ads", file: "google-ads.png" },
  gmail: { name: "Gmail", file: "gmail.png" },
  stripe: { name: "Stripe", file: "stripe.svg" },
  callrail: { name: "CallRail", file: "callrail.svg" },
};
export type Brand = keyof typeof brands;

export function BrandLogo({ brand, compact = false }: { brand: Brand; compact?: boolean }) {
  const wordmark = brand === "stripe" || brand === "callrail";
  return <span className={`${s.logo} ${compact ? s.compact : ""} ${wordmark ? s.wordmark : ""}`}>
    <Image src={`/brands/${brands[brand].file}`} alt={brands[brand].name} width={wordmark ? 112 : 48} height={48} unoptimized />
  </span>;
}

export function BrandBadge({ brand }: { brand: Brand }) {
  const wordmark = brand === "stripe" || brand === "callrail";
  return <span className={s.badge}><BrandLogo brand={brand} compact />{!wordmark && <span aria-hidden="true">{brands[brand].name}</span>}</span>;
}
