"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ArrowRight, Network } from "lucide-react";
import { productNav, industryNav, mainNav, solutionNav, LOGIN_URL, type NavLink } from "@/content/navigation";
import { NavIcon } from "./NavIcon";
import { HomeLink } from "./HomeLink";
import s from "./Header.module.css";

const menus = [
  { key: "product", label: "Product", items: productNav },
  { key: "industries", label: "Industries", items: industryNav },
  { key: "solutions", label: "Solutions", items: solutionNav },
] as const;
type MenuKey = (typeof menus)[number]["key"];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpened = useRef(false);
  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  const hoverMenu = (key: MenuKey) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    clearHover();
    hoverTimer.current = setTimeout(() => { hoverOpened.current = true; setOpen(key); }, 100);
  };
  const leaveMenu = () => {
    clearHover();
    hoverTimer.current = setTimeout(() => {
      // Keep a keyboard-focused menu available even when the pointer leaves it.
      const focusedPanel = document.activeElement?.closest('[data-nav-menu]');
      if (!focusedPanel) setOpen(null);
    }, 180);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(previous => window.scrollY > (previous ? 24 : 72));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearHover(); };
  }, []);
  const header = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const drawerAnimation = useRef<Animation | null>(null);
  const savedOverflow = useRef<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const burger = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      clearHover();
      setOpen(null);
      setMobileOpen(false);
      previousPath.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        clearHover();
        triggers.current[open]?.focus({ preventScroll: true });
        setOpen(null);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const sheet = dialog.current;
    if (!sheet) return;
    const currentTransform = sheet.open ? getComputedStyle(sheet).transform : "translateX(100%)";
    drawerAnimation.current?.cancel();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finishClose = () => {
      if (sheet.open) sheet.close();
      if (savedOverflow.current !== null) {
        document.documentElement.style.overflow = savedOverflow.current;
        savedOverflow.current = null;
      }
    };
    if (mobileOpen) {
      setOpen(null);
      if (savedOverflow.current === null) savedOverflow.current = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      if (!sheet.open) sheet.showModal();
      closeButton.current?.focus({ preventScroll: true });
      drawerAnimation.current = sheet.animate(
        [{ transform: currentTransform }, { transform: "translateX(0)" }],
        { duration: reduced ? 0 : 420, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "both" }
      );
    } else if (sheet.open) {
      drawerAnimation.current = sheet.animate(
        [{ transform: currentTransform }, { transform: "translateX(100%)" }],
        { duration: reduced ? 0 : 280, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "both" }
      );
      drawerAnimation.current.onfinish = finishClose;
    }
    const desktop = window.matchMedia("(min-width: 1080px)");
    const onResize = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, [mobileOpen]);

  useEffect(() => () => {
    drawerAnimation.current?.cancel();
    if (savedOverflow.current !== null) document.documentElement.style.overflow = savedOverflow.current;
  }, []);

  const active = (key: MenuKey) => key === "product"
    ? pathname.startsWith("/features") || pathname === "/integrations"
    : key === "industries" ? pathname.startsWith("/industries") : pathname === "/white-label";

  return (
    <header className={s.header} data-scrolled={scrolled && !mobileOpen} ref={header} onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null);
    }}>
      <div className={`container ${s.bar}`}>
        <HomeLink className={s.logo} aria-label="SideKick CRM home">
          <Image src="/brand/sidekick-crm-logo.png" alt="SideKick CRM" width={2048} height={778} sizes="176px" priority />
        </HomeLink>
        <nav className={s.nav} aria-label="Primary">
          <ul role="list" className={s.list}>
            {menus.map((menu) => (
              <li key={menu.key} data-nav-menu onPointerEnter={(e) => { if (e.pointerType !== "touch") hoverMenu(menu.key); }} onPointerLeave={leaveMenu}>
                <button type="button" ref={(el) => { triggers.current[menu.key] = el; }}
                  className={`${s.link} ${active(menu.key) ? s.linkActive : ""}`}
                  aria-expanded={open === menu.key} aria-controls={`nav-${menu.key}`}
                  onClick={() => {
                    clearHover();
                    setOpen(open === menu.key && !hoverOpened.current ? null : menu.key);
                    hoverOpened.current = false;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      clearHover();
                      hoverOpened.current = false;
                      setOpen(menu.key);
                      requestAnimationFrame(() => document.querySelector<HTMLAnchorElement>(`#nav-${menu.key} a`)?.focus());
                    }
                  }}>
                  {menu.label}<ChevronDown aria-hidden className={s.chev} />
                </button>
                <div id={`nav-${menu.key}`} hidden={open !== menu.key} className={s.dropdown}>
                  <div className={s.panel}>
                    <div className={s.panelHeading}>
                      <span>{menu.key === "product" ? "A little less admin. A lot more business." : menu.key === "industries" ? "Built around the work you do." : "Find your way to SideKick."}</span>
                      <span className={s.panelHint}>{menu.label}</span>
                    </div>
                    <div className={`${s.panelGrid} ${menu.key === "solutions" ? s.solutionGrid : ""}`}>
                      {menu.items.map((item) => <MenuLink key={item.href} item={item} onClick={() => setOpen(null)} pathname={pathname} />)}
                    </div>
                    {menu.key === "product" && <Link href="/features/ai-mcp" onClick={() => setOpen(null)} className={s.panelFoot}>
                      <Network aria-hidden /><span><strong>Your CRM, connected on your terms.</strong><small>Explore AI assistance and planned MCP connections</small></span><ArrowRight aria-hidden />
                    </Link>}
                  </div>
                </div>
              </li>
            ))}
            {mainNav.map((item) => <li key={item.href}><Link href={item.href} className={s.link} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setOpen(null)}>{item.label}</Link></li>)}
          </ul>
        </nav>
        <div className={s.actions}>
          {LOGIN_URL && <a href={LOGIN_URL} className={s.login}>Log in</a>}
          <Link href="/contact" className={`btn btn--primary btn--sm ${s.demo}`}>Book a Demo <ArrowRight aria-hidden /></Link>
          <button ref={burger} type="button" className={s.burger} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><MenuIcon open={mobileOpen} /></button>
        </div>
      </div>
      <dialog ref={dialog} id="mobile-menu" className={s.sheet} aria-label="Navigation menu"
        onCancel={event => { event.preventDefault(); setMobileOpen(false); }} onClose={() => { setMobileOpen(false); burger.current?.focus({ preventScroll: true }); }}
        onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}>
        <div className={s.sheetContent}>
          <div className={s.sheetTop}><HomeLink onClick={() => setMobileOpen(false)} aria-label="SideKick CRM home"><Image src="/brand/sidekick-crm-logo.png" alt="SideKick CRM" width={2048} height={778} sizes="154px" /></HomeLink><button ref={closeButton} autoFocus type="button" className={s.burger} aria-label="Close menu" onClick={() => setMobileOpen(false)}><MenuIcon open={mobileOpen} /></button></div>
          <nav aria-label="Mobile" className={s.sheetNav}>
            {menus.map((menu) => <details key={menu.key} className={s.acc} name="mobile-navigation">
              <summary>{menu.label}<ChevronDown aria-hidden /></summary>
              <div className={s.accBody}>{menu.items.map((item) => <MenuLink key={item.href} item={item} onClick={() => setMobileOpen(false)} pathname={pathname} />)}</div>
            </details>)}
            <Link href="/pricing" className={s.sheetLink} onClick={() => setMobileOpen(false)}>Pricing<ArrowRight aria-hidden /></Link>
            <div className={s.sheetSecondary}><Link href="/about" onClick={() => setMobileOpen(false)}>About SideKick</Link><Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link></div>
            <div className={s.sheetActions}>
              {LOGIN_URL && <a href={LOGIN_URL} className="btn btn--ghost">Log in</a>}
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="btn btn--primary">Book a Demo<ArrowRight aria-hidden /></Link>
              <p>Built for the people who get things done.</p>
            </div>
          </nav>
        </div>
      </dialog>
    </header>
  );
}

function MenuLink({ item, onClick, pathname }: { item: NavLink; onClick: () => void; pathname: string }) {
  return <Link href={item.href} onClick={onClick} className={s.panelLink} aria-current={pathname === item.href ? "page" : undefined}>
    <span className={s.panelIcon}><NavIcon name={item.icon} /></span>
    <span><span className={s.panelLabel}>{item.label}</span>{item.description && <span className={s.panelDesc}>{item.description}</span>}</span>
  </Link>;
}

function MenuIcon({ open }: { open: boolean }) {
  return <span className={s.menuGlyph} data-open={open} aria-hidden="true"><i /><i /><i /></span>;
}
