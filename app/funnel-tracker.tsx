"use client";

import { useEffect } from "react";

import { initAnalytics, setBookingSource, track } from "./analytics";

// Funil: page_view → section_view_<secao> → booking_click_<botao> → booking_opened_<botao>
//        → booking_successful_<botao> (+ generate_lead com source)
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
          const name = SECTIONS.find(([sid]) => sid === (e.target as HTMLElement).id)?.[1];
          if (!name || seen.has(name)) continue;
          seen.add(name);
          track(`section_view_${name}`, { step: SECTIONS.findIndex(([, n]) => n === name) + 1 });
          io.unobserve(e.target);
        }
      },
      { threshold: 0.35 },
    );
    for (const [id] of SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;
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
          track(`scroll_depth_${step}`);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    // 3) Cliques: CTA de agendamento (abre o Cal) e navegação por âncora.
    // A origem do CTA vem de data-source (hero, header, surprise_box…) e vai no nome do evento.
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      const cta = target?.closest?.("[data-cal-link]");
      if (cta) {
        const source = (cta as HTMLElement).dataset.source ?? locationOf(cta);
        setBookingSource(source);
        track(`booking_click_${source}`, { label: cta.textContent?.trim().slice(0, 60) ?? "" });
        return;
      }
      const link = target?.closest?.("a[href^='#']");
      if (link) {
        const to = link.getAttribute("href")!.slice(1);
        track(`nav_click_${to || "top"}`, { location: locationOf(link) });
      }
    };
    document.addEventListener("click", onClick, true);
    cleanups.push(() => document.removeEventListener("click", onClick, true));

    // 4) Perguntas do FAQ abertas (data-faq = chave da pergunta).
    const onToggle = (ev: Event) => {
      const d = ev.target as HTMLDetailsElement;
      if (d.tagName === "DETAILS" && d.open && d.dataset.faq) track(`faq_open_${d.dataset.faq}`);
    };
    document.addEventListener("toggle", onToggle, true);
    cleanups.push(() => document.removeEventListener("toggle", onToggle, true));

    // 5) Interesse em cards/caixas: elementos com data-hover="<evento>" disparam uma vez por visita,
    // depois de 400ms de mouse em cima (ignora passagem de relance) ou ao receber foco/toque.
    const hovered = new Set<string>();
    const timers = new Map<Element, ReturnType<typeof setTimeout>>();
    const fire = (el: Element) => {
      const name = (el as HTMLElement).dataset.hover;
      if (!name || hovered.has(name)) return;
      hovered.add(name);
      track(name);
    };
    const onOver = (ev: MouseEvent) => {
      const el = (ev.target as Element | null)?.closest?.("[data-hover]");
      if (!el || timers.has(el)) return;
      timers.set(el, setTimeout(() => fire(el), 400));
    };
    const onOut = (ev: MouseEvent) => {
      const el = (ev.target as Element | null)?.closest?.("[data-hover]");
      if (!el || el.contains(ev.relatedTarget as Node | null)) return;
      clearTimeout(timers.get(el));
      timers.delete(el);
    };
    const onFocusIn = (ev: FocusEvent) => {
      const el = (ev.target as Element | null)?.closest?.("[data-hover]");
      if (el) fire(el);
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusin", onFocusIn);
    cleanups.push(() => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      timers.forEach(clearTimeout);
    });

    // 6) Chat Crisp (crisp-chat.tsx dispara CustomEvent "camu:chat": opened, closed, message_sent).
    const onChat = (ev: Event) => track(`chat_${(ev as CustomEvent<string>).detail}`);
    window.addEventListener("camu:chat", onChat);
    cleanups.push(() => window.removeEventListener("camu:chat", onChat));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
