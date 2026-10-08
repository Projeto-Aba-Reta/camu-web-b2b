"use client";

import { useEffect } from "react";

import { initAnalytics, track } from "./analytics";

// Funil: page_view → section_view (por seção) → cta_click → booking_opened → generate_lead
const SECTIONS: [id: string, name: string][] = [
  ["top", "hero"],
  ["ruido", "ruido"],
  ["solucoes", "kits"],
  ["ideias", "ideias"],
  ["por-que", "por_que_camu"],
  ["processo", "processo"],
  ["faq", "faq"],
];

const SCROLL_STEPS = [25, 50, 75, 100];

/** Nome da área da página onde um elemento está (header, hero, kits, footer…). */
function locationOf(el: Element): string {
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  const id = el.closest("section[id], main[id]")?.id;
  return SECTIONS.find(([sid]) => sid === id)?.[1] ?? id ?? "page";
}

export function FunnelTracker() {
  useEffect(() => {
    initAnalytics();
    const cleanups: (() => void)[] = [];

    // 1) Seção vista (uma vez por seção): mostra onde o visitante desiste.
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const name = (e.target as HTMLElement).dataset.funnel!;
          if (seen.has(name)) continue;
          seen.add(name);
          track("section_view", { section: name, step: SECTIONS.findIndex(([, n]) => n === name) + 1 });
          io.unobserve(e.target);
        }
      },
      { threshold: 0.35 },
    );
    for (const [id, name] of SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.dataset.funnel = name;
      io.observe(el);
    }
    cleanups.push(() => io.disconnect());

    // 2) Profundidade de scroll.
    const hit = new Set<number>();
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = (window.scrollY / max) * 100;
      for (const step of SCROLL_STEPS) {
        if (pct >= step - 1 && !hit.has(step)) {
          hit.add(step);
          track("scroll_depth", { percent: step });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    // 3) Cliques: CTA de agendamento (abre o Cal) e navegação por âncora.
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      const cta = target?.closest?.("[data-cal-link]");
      if (cta) {
        track("cta_click", {
          location: locationOf(cta),
          label: cta.textContent?.trim().slice(0, 60) ?? "",
        });
        return;
      }
      const link = target?.closest?.("a[href^='#']");
      if (link) {
        track("nav_click", { location: locationOf(link), target: link.getAttribute("href")!.slice(1) });
      }
    };
    document.addEventListener("click", onClick, true);
    cleanups.push(() => document.removeEventListener("click", onClick, true));

    // 4) Perguntas do FAQ abertas.
    const onToggle = (ev: Event) => {
      const d = ev.target as HTMLDetailsElement;
      if (d.tagName === "DETAILS" && d.open) {
        const q = d.querySelector("summary")?.textContent?.replace("+", "").trim() ?? "";
        track("faq_open", { question: q.slice(0, 80) });
      }
    };
    document.addEventListener("toggle", onToggle, true);
    cleanups.push(() => document.removeEventListener("toggle", onToggle, true));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
