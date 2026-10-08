"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { calTrigger } from "./cal";
import { KitBox } from "./kit-box";

const SHARDS = [
  { dx: "-46px", dy: "-34px" },
  { dx: "-30px", dy: "-52px" },
  { dx: "10px", dy: "-58px" },
  { dx: "42px", dy: "-40px" },
  { dx: "52px", dy: "-8px" },
  { dx: "-52px", dy: "-6px" },
];

export function SurpriseKit({ n }: { n: string }) {
  const [open, setOpen] = useState(false);
  const seal = useRef<HTMLButtonElement>(null);
  const cta = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);

  // devolve o foco ao ponto certo depois que a animação termina
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const t = setTimeout(
      () => (open ? cta : seal).current?.focus({ preventScroll: true }),
      open ? 1200 : 60,
    );
    return () => clearTimeout(t);
  }, [open]);

  return (
    <article
      className={`box-card box-mystery relative h-full overflow-hidden p-8 outline-none${open ? " is-open" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted">{n}</span>
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          <span className="kseal-dot" aria-hidden />
          Lacrado
        </span>
      </div>

      <div className="mt-6">
        <KitBox mystery label="Surpresa">
          <button
            ref={seal}
            type="button"
            className="kseal"
            aria-label="Romper o lacre e abrir a caixa surpresa"
            tabIndex={open ? -1 : 0}
            onClick={() => setOpen(true)}
          >
            <span className="kseal-ping" aria-hidden />
            <span className="kseal-ring" aria-hidden />
            <span className="kseal-base" aria-hidden />
            <span className="kseal-half kseal-l font-display" aria-hidden>
              c
            </span>
            <span className="kseal-half kseal-r font-display" aria-hidden>
              c
            </span>
            {SHARDS.map((s, i) => (
              <span
                key={i}
                aria-hidden
                className="kseal-shard"
                style={{ "--dx": s.dx, "--dy": s.dy, "--i": i } as CSSProperties}
              />
            ))}
          </button>
          <span className="kseal-hint font-mono" aria-hidden>
            Clique no lacre
          </span>
        </KitBox>
      </div>

      <h3 className="mt-8 font-display text-3xl">Item surpresa</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Esta caixa a gente não conta o que tem. Rompa o lacre para descobrir.
      </p>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
        Toque no lacre ↑
      </p>

      <div className="invite" role="region" aria-label="Convite" aria-hidden={!open}>
        <div className="invite-in flex items-start justify-between" style={{ "--d": 0 } as CSSProperties}>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3b3a35]">
            Convite Especial para você
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Lacrar a caixa de novo"
            className="-mr-1 -mt-1 grid size-8 place-items-center rounded-full border border-[#0d1203]/25 text-lg leading-none text-[#0d1203] transition hover:bg-[#0d1203] hover:text-accent"
          >
            ×
          </button>
        </div>

        <div>
          <span className="invite-in invite-star font-display" aria-hidden style={{ "--d": 1 } as CSSProperties}>
            ✦
          </span>
          <h3
            className="invite-in mt-3 font-display text-[clamp(2.1rem,3.6vw,3rem)] leading-[1.02] tracking-[-0.02em]"
            style={{ "--d": 2 } as CSSProperties}
          >
            Você está convidado a criar algo que <em>ninguém mais tem.</em>
          </h3>
          <p
            className="invite-in mt-5 max-w-[26ch] text-[15px] leading-relaxed text-[#3b3a35]"
            style={{ "--d": 3 } as CSSProperties}
          >
            Escolha um horário e conte o que você quer ver saindo da caixa.
          </p>
        </div>

        <div className="invite-in" style={{ "--d": 4 } as CSSProperties}>
          <button
            ref={cta}
            type="button"
            {...calTrigger}
            className="rounded-full bg-[#f7efe2] px-6 py-3.5 text-[15px] font-medium text-[#ce6a4b] transition hover:brightness-125"
          >
            Aceitar o convite →
          </button>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#3b3a35]">
            Camu Studio · Briefing
          </p>
        </div>
      </div>
    </article>
  );
}
