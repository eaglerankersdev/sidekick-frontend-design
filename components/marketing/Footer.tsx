import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { footerNav, socialLinks } from "@/content/navigation";
import styles from "./Footer.module.css";
import { HomeLink } from "./HomeLink";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <HomeLink aria-label="SideKick CRM home" className={styles.logo}>
              <Image src="/brand/sidekick-crm-logo-footer.webp" alt="SideKick CRM" width={1024} height={490} sizes="238px" />
            </HomeLink>
            <p>One connected workflow for service businesses, from the first request to the paid invoice.</p>
            {socialLinks.length > 0 && (
              <ul role="list" className={styles.social}>
                {socialLinks.map((s) => (
                  <li key={s.href}>
                    <a href={s.href}>{s.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.invitation}>
            <span>Built for the people who get things done.</span>
            <p>A little less admin.<br />A lot more SideKick.</p>
            <Link href="/contact" className={styles.demo}>Let’s talk about your business <ArrowUpRight aria-hidden /></Link>
          </div>
        </div>
        <nav className={styles.cols} aria-label="Footer">
          {Object.entries(footerNav).map(([group, links]) => (
            <div key={group}>
              <h2 className={styles.colTitle}>{group}</h2>
              <ul role="list">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}<ArrowRight aria-hidden /></Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} SideKick CRM. All rights reserved.</span>
        <Link href="/integrations" className={styles.fine}>Your tools. One connected workflow. <ArrowUpRight aria-hidden /></Link>
      </div>
    </footer>
  );
}
