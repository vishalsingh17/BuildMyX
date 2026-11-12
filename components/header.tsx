"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./icons";
import { Brand } from "./brand";
import { EnquiryLink } from "./enquiry-link";
import { useEnquiry } from "./enquiry-provider";
import { serviceNames, servicePaths, type Interest } from "@/lib/site-config";

export function Header() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const { interest, setInterest } = useEnquiry();
  const pageInterests: Record<string, Interest> = {
    "/services/ai/": "ai",
    "/services/career/": "learning",
    "/services/team/": "hiring",
    "/developers/": "developer",
    "/projects/": "ai",
    "/projects/reporting-pipeline/": "ai",
    "/resources/reporting-readiness/": "ai",
    "/resources/hiring-brief/": "hiring",
  };
  const pageInterest =
    pageInterests[pathname.endsWith("/") ? pathname : `${pathname}/`] ??
    interest;
  const links = [
    { name: serviceNames.AI, href: servicePaths.AI },
    { name: serviceNames.Career, href: servicePaths.Career },
    { name: serviceNames.Team, href: servicePaths.Team },
    { name: "Examples", href: "/projects/" },
    { name: "Contact", href: `/?interest=${pageInterest}#enquire` },
  ];
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      setOpen(false);
      previousPath.current = pathname;
      let target = "main";
      try {
        target = window.location.hash
          ? decodeURIComponent(window.location.hash.slice(1))
          : "main";
      } catch {
        /* Malformed fragments fall back to the page heading. */
      }
      document.getElementById(target)?.focus({ preventScroll: true });
    }
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [open]);
  useEffect(() => {
    const media = matchMedia("(min-width: 1000px)");
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  const selected = (href: string) =>
    pathname.replace(/\/$/, "") === href.replace(/\/$/, "")
      ? ("page" as const)
      : undefined;
  const navigate = (href: string) => {
    setOpen(false);
    if (href.includes("interest=")) setInterest(pageInterest);
    if (pathname === "/" && href.includes("#"))
      requestAnimationFrame(() =>
        document
          .getElementById(href.split("#")[1])
          ?.focus({ preventScroll: true }),
      );
  };
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" aria-label="BuildMyX home" className="brand-link">
          <Brand />
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {links.map(({ name, href }) => (
            <Link
              href={href}
              key={name}
              aria-current={selected(href)}
              onClick={() => navigate(href)}
            >
              {name}
            </Link>
          ))}
        </nav>
        <EnquiryLink
          interest={pageInterest}
          className="button button-small header-cta"
        >
          Let’s talk
        </EnquiryLink>
        <button
          ref={button}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          <span className={open ? "menu-lines is-open" : "menu-lines"} />
        </button>
      </div>
      <nav
        ref={nav}
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className="mobile-nav"
        hidden={!open}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node) &&
            event.relatedTarget !== button.current
          )
            setOpen(false);
        }}
      >
        {links.map(({ name, href }) => (
          <Link
            href={href}
            key={name}
            aria-current={selected(href)}
            onClick={() => navigate(href)}
          >
            {name}
            <Arrow diagonal />
          </Link>
        ))}
        <Link href="/developers/" onClick={() => navigate("/developers/")}>
          For developers
          <Arrow diagonal />
        </Link>
      </nav>
    </header>
  );
}
