"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { calTrigger } from "./cal";
import { BRAZIL_CENTERS, BRAZIL_STATES, BRAZIL_VIEWBOX } from "./brazil-map";
import { iconMask, iconPath, type KitIcon } from "./kit-icons";

function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
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
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, on] as const;
}

function CountUp({ to, on, duration = 1800 }: { to: number; on: boolean; duration?: number }) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!on) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, to, duration]);

  return <>{v.toLocaleString("pt-BR")}</>;
}

/* ───────── visuais ───────── */

function Icon({ name, className = "", style }: { name: KitIcon; className?: string; style?: CSSProperties }) {
  const mask = iconMask(name);
  return (
    <span
      aria-hidden
      className={`block bg-accent ${className}`}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        ...style,
      }}
    />
  );
}

const Label = ({ children, accent = false }: { children: ReactNode; accent?: boolean }) => (
  <span className={`font-mono text-[11px] tracking-[0.12em] uppercase ${accent ? "text-accent" : "text-muted"}`}>
    {children}
  </span>
);

/** Molde de metal com etiqueta de preço riscada → arquivo digital que troca de forma sem custo. */
function MoldVisual() {
  const swap: KitIcon[] = ["trofeu", "coracao", "estrela", "cubo"];
  return (
    <div className="flex items-center gap-4 sm:gap-6" aria-hidden>
      <div className="flex flex-1 flex-col items-center gap-3">
        <div className="relative">
          <svg viewBox="0 0 80 76" className="h-24 w-28 overflow-visible text-muted">
            <g className="why-mold-top">
              <rect x="8" y="6" width="64" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M28 32v-9a12 9 0 0 1 24 0v9z" fill="currentColor" opacity=".35" />
              <circle cx="15" cy="12" r="1.8" fill="currentColor" />
              <circle cx="65" cy="12" r="1.8" fill="currentColor" />
            </g>
            <g>
              <rect x="8" y="36" width="64" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M28 36v9a12 9 0 0 0 24 0v-9z" fill="currentColor" opacity=".35" />
              <circle cx="15" cy="56" r="1.8" fill="currentColor" />
              <circle cx="65" cy="56" r="1.8" fill="currentColor" />
            </g>
          </svg>
          <span className="why-price absolute -top-1 -right-5 rotate-6 rounded-md border border-line-strong bg-bg px-2 py-1 font-mono text-[11px] text-muted">
            <span className="relative">
              R$ 50 mil
              <span className="why-strike absolute top-1/2 left-0 h-[2px] w-full bg-accent" />
            </span>
          </span>
        </div>
        <Label>Molde</Label>
      </div>

      <span className="font-mono text-xl text-accent">→</span>

      <div className="flex flex-1 flex-col items-center gap-3">
        <div className="relative grid h-24 w-20 place-items-center rounded-lg border border-line-strong bg-surface">
          <span className="absolute top-0 right-0 h-5 w-5 rounded-bl-lg border-b border-l border-line-strong bg-bg" />
          {swap.map((n, i) => (
            <Icon key={n} name={n} className="why-swap absolute h-10 w-10" style={{ "--i": i } as CSSProperties} />
          ))}
          <span className="absolute bottom-2 font-mono text-[9px] tracking-[0.12em] text-muted uppercase">.3D</span>
        </div>
        <Label accent>Arquivo · R$ 0</Label>
      </div>
    </div>
  );
}

/** Uma peça vira um lote: o troféu se multiplica numa grade, cada peça ganha um check de entregue e o contador sobe. */
function VolumeVisual({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-6" aria-hidden>
      <div className="shrink-0">
        <p className="font-display text-[clamp(2.6rem,5vw,3.6rem)] leading-none tracking-[-0.02em] tabular-nums">
          <CountUp to={5000} on={on} duration={2400} />
        </p>
        <p className="mt-2">
          <Label>peças no mesmo pedido</Label>
        </p>
      </div>
      <div className="grid flex-1 grid-cols-8 gap-1.5">
        {Array.from({ length: 32 }, (_, i) => (
          <span
            key={i}
            className={`why-copy relative grid aspect-square place-items-center rounded-md border ${
              i === 0 ? "border-accent bg-accent/15" : "border-line bg-surface"
            }`}
            style={{ "--i": i } as CSSProperties}
          >
            <Icon name="trofeu" className="h-[70%] w-[70%]" style={{ opacity: i === 0 ? 1 : 0.7 }} />
            <svg viewBox="0 0 20 20" className="why-check absolute -right-1 -bottom-1 h-[42%] w-[42%]">
              <circle cx="10" cy="10" r="10" className="why-check-bg" />
              <path
                pathLength={1}
                d="M5.5 10.5l3 3 6-6.5"
                fill="none"
                stroke="var(--c-accent-ink)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="why-check-mark"
              />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Rascunho a lápis → desenho 3D → objeto pronto, desenhados em sequência. */
const MUG_BODY = "M14 16H54V50Q54 66 38 66H30Q14 66 14 50Z";
const MUG_HANDLE = "M54 24H60Q70 24 70 36Q70 48 60 48H54";
const MUG_RIM = "M14 16Q34 8 54 16Q34 24 14 16Z";

function DesignVisual() {
  const stages = [
    { t: "Seu rascunho", st: 0 },
    { t: "Desenho 3D", st: 1 },
    { t: "Objeto na mão", st: 2 },
  ];
  return (
    <div className="grid grid-cols-3 gap-2" aria-hidden>
      {stages.map(({ t, st }, i) => (
        <div key={t} className="relative flex flex-col items-center gap-3" style={{ "--st": st } as CSSProperties}>
          <svg viewBox="0 0 80 80" className="h-24 w-24 overflow-visible">
            {st === 0 && (
              <g className="why-draw" fill="none" stroke="var(--c-muted)" strokeWidth="1.8" strokeLinecap="round">
                <path pathLength={1} d={MUG_BODY} />
                <path pathLength={1} d={MUG_HANDLE} />
                <path pathLength={1} d="M14 16Q34 11 54 16" />
              </g>
            )}
            {st === 1 && (
              <g className="why-draw" fill="none" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinecap="round">
                <path pathLength={1} d={MUG_BODY} />
                <path pathLength={1} d={MUG_HANDLE} />
                <path pathLength={1} d={MUG_RIM} />
                <path pathLength={1} d="M14 34Q34 42 54 34" />
                <path pathLength={1} d="M14 50Q34 58 54 50" />
                <path pathLength={1} d="M24 19V64" opacity=".6" />
                <path pathLength={1} d="M34 22V66" opacity=".6" />
                <path pathLength={1} d="M44 19V64" opacity=".6" />
              </g>
            )}
            {st === 2 && (
              <g className="why-solid">
                <path d={MUG_HANDLE} fill="none" stroke="var(--c-accent)" strokeWidth="5" strokeLinecap="round" />
                <path d={MUG_BODY} fill="var(--c-accent)" />
                <path d={MUG_RIM} fill="var(--c-accent-hi)" />
                <path
                  d="M18 26H50M16 34H52M16 42H52M17 50H51M21 58H47"
                  stroke="var(--c-accent-ink)"
                  strokeOpacity=".18"
                  strokeWidth="1"
                />
              </g>
            )}
          </svg>
          <Label accent={st === 2}>{t}</Label>
          {i < 2 && <span className="absolute top-9 -right-3 font-mono text-accent">→</span>}
        </div>
      ))}
    </div>
  );
}

/** Mapa do Brasil (public/brazil.svg) com rotas saindo de São Paulo para o resto do país. */
const HUB = BRAZIL_CENTERS.SP;
const DEST = ["AM", "PA", "PE", "DF", "RS"] as const;

function route([x, y]: [number, number]) {
  const [hx, hy] = HUB;
  const cx = (hx + x) / 2 + (hy - y) * 0.18;
  const cy = (hy + y) / 2 - Math.abs(hx - x) * 0.18;
  return `M${hx} ${hy}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x} ${y}`;
}

/** Os mesmos objetos que trocam no card "Zero molde". */
const PARCEL_ICONS: KitIcon[] = ["trofeu", "coracao", "estrela", "cubo"];

const pickIcon = (not?: KitIcon) => {
  const pool = PARCEL_ICONS.filter((n) => n !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};

/** Uma viagem de ~10s: o objeto sai do hub, chega ao destino e some. A cada novo ciclo sorteia outro objeto. */
function ParcelTrip({ d, begin }: { d: string; begin: string }) {
  const [icon, setIcon] = useState<KitIcon>(() => pickIcon());
  const motion = useRef<SVGAnimateMotionElement>(null);

  useEffect(() => {
    const el = motion.current;
    if (!el) return;
    const next = () => setIcon((cur) => pickIcon(cur));
    el.addEventListener("repeatEvent", next);
    return () => el.removeEventListener("repeatEvent", next);
  }, []);

  return (
    <g className="why-parcel" opacity="0">
      <path d={iconPath(icon)} fill="var(--c-accent)" fillRule="evenodd" transform="translate(-16 -16) scale(1.35)" />
      <animateMotion
        ref={motion}
        path={d}
        dur="10s"
        begin={begin}
        repeatCount="indefinite"
        calcMode="spline"
        keyPoints="0;1;1"
        keyTimes="0;0.45;1"
        keySplines="0.4 0 0.6 1;0 0 1 1"
      />
      <animate
        attributeName="opacity"
        values="0;0.75;0.75;0;0"
        keyTimes="0;0.05;0.4;0.45;1"
        dur="10s"
        begin={begin}
        repeatCount="indefinite"
      />
    </g>
  );
}

function BrazilVisual({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-6" aria-hidden>
      <svg viewBox={BRAZIL_VIEWBOX} className="h-48 w-auto shrink-0 overflow-visible">
        {Object.entries(BRAZIL_STATES).map(([uf, d]) => (
          <path key={uf} d={d} className={uf === "SP" ? "why-state why-state--hub" : "why-state"} />
        ))}
        {DEST.map((uf, i) => (
          <g key={uf} style={{ "--i": i } as CSSProperties}>
            <path d={route(BRAZIL_CENTERS[uf])} className="why-route" />
            <circle cx={BRAZIL_CENTERS[uf][0]} cy={BRAZIL_CENTERS[uf][1]} r="8" className="why-city" />
          </g>
        ))}
        {on &&
          DEST.map((uf, i) => (
            <ParcelTrip key={uf} d={route(BRAZIL_CENTERS[uf])} begin={`${1.5 + i * 2}s`} />
          ))}
        <circle cx={HUB[0]} cy={HUB[1]} r="11" className="why-hub" />
        <circle cx={HUB[0]} cy={HUB[1]} r="11" className="why-hub-ring" />
      </svg>
      <ul className="space-y-3">
        {["Produção em São Paulo", "Entrega em todo o Brasil", "Nota fiscal para sua empresa"].map((t, i) => (
          <li key={t} className="why-tick flex items-center gap-2" style={{ "--i": i } as CSSProperties}>
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-accent text-[9px] text-accent-ink">
              ✓
            </span>
            <Label>{t}</Label>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────── cards ───────── */

type Reason = {
  k: string;
  v: string;
  visual: (on: boolean) => ReactNode;
};

const REASONS: Reason[] = [
  {
    k: "Zero molde",
    v: "Sem custo de molde. Mudar o design custa um arquivo, não dezenas de milhares de reais.",
    visual: () => <MoldVisual />,
  },
  {
    k: "Do 1 ao 5.000",
    v: "Uma peça para o CEO ou um lote para a convenção inteira. O mesmo processo, o mesmo cuidado.",
    visual: (on) => <VolumeVisual on={on} />,
  },
  {
    k: "Design incluso",
    v: "Você não precisa chegar com arquivo 3D. O desenho faz parte do projeto, da ideia à amostra.",
    visual: () => <DesignVisual />,
  },
  {
    k: "Feito no Brasil",
    v: "Produção local, prazos curtos e a nota fiscal da sua empresa em dia. Entregamos em todo o país.",
    visual: (on) => <BrazilVisual on={on} />,
  },
];

function ReasonCard({ r, i }: { r: Reason; i: number }) {
  const [ref, on] = useInView<HTMLElement>(0.35);

  return (
    <article
      ref={ref}
      className={`why-card group relative flex flex-col overflow-hidden bg-bg p-8 md:p-10 ${on ? "why-on" : ""}`}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/0 blur-3xl transition duration-700 group-hover:bg-accent/15" />
      <span className="font-mono text-[11px] tracking-[0.16em] text-muted">{String(i + 1).padStart(2, "0")}</span>
      <div className="mt-8 flex min-h-[170px] items-center [&>*]:w-full">{r.visual(on)}</div>
      <h3 className="mt-10 font-display text-4xl">{r.k}</h3>
      <p className="mt-3 max-w-md leading-relaxed text-muted">{r.v}</p>
    </article>
  );
}

export function WhyCamu({ eyebrow, h2 }: { eyebrow: string; h2: string }) {
  const [ref, on] = useInView<HTMLDivElement>(0.2);

  return (
    <section id="por-que" className="border-y border-line">
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-8 md:py-32">
        <div
          ref={ref}
          className={`reveal ${on ? "is-in" : ""} flex flex-col justify-between gap-8 md:flex-row md:items-end`}
        >
          <div>
            <p className={eyebrow}>Por que a Camu</p>
            <h2 className={`mt-4 max-w-3xl ${h2}`}>
              A flexibilidade de um ateliê, <em>a confiabilidade de uma fábrica.</em>
            </h2>
          </div>
          <p className="max-w-sm text-muted md:text-right">
            Sem catálogo e sem pedido mínimo engessado. Entra um time que pega a sua ideia e entrega o objeto pronto.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
          {REASONS.map((r, i) => (
            <ReasonCard key={r.k} r={r} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
