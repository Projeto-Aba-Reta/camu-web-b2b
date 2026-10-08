"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS = ["Garrafinha com logo", "Caneta", "Chaveiro", "Caderno", "Ecobag", "Squeeze", "Mousepad"];

export function NoiseSection() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="ruido"
      className={`noise relative overflow-hidden ${on ? "noise-on" : ""}`}
    >
      <div className="relative z-10 mx-auto grid max-w-[1320px] gap-14 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">O problema</p>
          <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[1] tracking-[-0.02em]">
            Brinde corporativo virou <em className="noise-glitch text-accent" data-text="ruído.">ruído.</em>
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted">
            Todo mundo dá a mesma garrafinha. Ela vai pra gaveta, e a marca acompanha. O problema
            nunca foi orçamento, sempre partiu de um catálogo.
          </p>
          <p className="noise-close mt-12 max-w-lg font-display text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.15]">
            Na Camu Studio, o ponto de partida é a sua ideia. <em className="text-accent">Qualquer uma.</em>
          </p>
        </div>

        <div className="noise-stage relative">
          <ol className="noise-list divide-y divide-line border-y border-line">
            {ITEMS.map((t, i) => (
              <li
                key={t}
                className="noise-item flex items-baseline gap-5 py-5 md:py-6"
                style={{ "--i": i } as React.CSSProperties}
              >
                <span className="font-mono text-[12px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative font-display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none">
                  <span className="noise-label">{t}</span>
                  <span aria-hidden className="noise-strike" />
                </span>
              </li>
            ))}
          </ol>
          <div aria-hidden className="noise-stamp">
            <span className="noise-stamp-main font-display">Passado</span>
            <span className="noise-stamp-sub font-mono">o padrão já é</span>
          </div>
        </div>
      </div>
      <div aria-hidden className="noise-spot noise-spot-list" />
      <div aria-hidden className="noise-spot noise-spot-close" />
    </section>
  );
}
