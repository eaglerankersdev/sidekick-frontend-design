import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="section" style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>404</span>
        <h1 style={{ fontSize: "var(--fs-h1)" }}>This page is not on the map.</h1>
        <p className="lead" style={{ marginTop: 16 }}>The link may be old or mistyped. Here are a few places to go instead.</p>
        <div className="btn-row" style={{ justifyContent: "center", marginTop: 28 }}>
          <Link href="/" className="btn btn--primary">Home <ArrowRight aria-hidden /></Link>
          <Link href="/features" className="btn btn--ghost">Features</Link>
          <Link href="/contact" className="btn btn--ghost">Contact</Link>
        </div>
      </div>
    </section>
  );
}
