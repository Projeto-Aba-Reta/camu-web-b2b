"use client";

import { useEffect, useState } from "react";
import { track } from "./analytics";
import { calTrigger } from "./cal";
import { Logo } from "./logo";
import { NAV } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background,border-color,backdrop-filter] duration-500 ${
        scrolled || open ? "border-line bg-bg/80 backdrop-blur-xl" : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 md:px-8">
        <a href="#top" aria-label="Camu Studio — início">
          <Logo />
        </a>
        <ul className="hidden items-center gap-8 text-[14px] text-muted lg:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="transition hover:text-fg">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            {...calTrigger}
            data-source="header"
            className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-ink transition hover:brightness-110"
          >
            Agendar briefing
          </button>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line-strong lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => {
              track(open ? "menu_close" : "menu_open");
              setOpen((v) => !v);
            }}
          >
            <span className="text-lg leading-none">{open ? "×" : "≡"}</span>
          </button>
        </div>
      </nav>
      {open && (
        <ul className="flex flex-col gap-1 border-t border-line px-5 pb-5 pt-3 lg:hidden">
          {NAV.map((n) => (
            <li key={n.href}>
              <a
                href={n.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-lg text-muted hover:text-fg"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
