import type { CSSProperties, ReactNode } from "react";

import { iconMask, type KitIcon } from "./kit-icons";

// esquerda, centro (maior), direita
const SLOTS = [
  { x: "-64px", y: "-46px", r: "-14deg", s: "46px" },
  { x: "0px", y: "-82px", r: "0deg", s: "60px" },
  { x: "64px", y: "-46px", r: "14deg", s: "46px" },
];

const SPARKS = [
  { left: "34%", delay: "0s", dx: "-10px" },
  { left: "44%", delay: "0.7s", dx: "8px" },
  { left: "52%", delay: "1.5s", dx: "-6px" },
  { left: "60%", delay: "0.35s", dx: "12px" },
  { left: "40%", delay: "2.1s", dx: "6px" },
  { left: "66%", delay: "1.1s", dx: "-12px" },
  { left: "48%", delay: "1.8s", dx: "10px" },
];

/**
 * Caixa de unboxing em CSS puro. A abertura é guiada pelo estado do `.box-card`
 * pai (hover/foco, ou `.is-open` na caixa surpresa); ver globals.css.
 */
export function KitBox({
  items = [],
  label,
  mystery = false,
  children,
}: {
  items?: KitIcon[];
  label: string;
  mystery?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`kbox${mystery ? " kbox--mystery" : ""}`}>
      <div aria-hidden className="contents">
        <div className="kbox-glow" />
        <div className="kbox-shadow" />
        <div className="kbox-beam" />
        {SPARKS.map((p, i) => (
          <span
            key={i}
            className="kbox-spark"
            style={{ left: p.left, animationDelay: p.delay, "--dx": p.dx } as CSSProperties}
          />
        ))}

        {["l", "r"].map((side) => (
          <div key={side} className={`kbox-lid kbox-lid--${side}`}>
            <div className="kbox-lid-out" />
            <div className="kbox-lid-in" />
          </div>
        ))}
        <div className="kbox-rim" />

        <div className="kbox-items">
          {items.slice(0, 3).map((icon, i) => (
            <span
              key={i}
              className="kbox-item"
              style={
                {
                  "--i": i,
                  "--x": SLOTS[i].x,
                  "--y": SLOTS[i].y,
                  "--r": SLOTS[i].r,
                  "--s": SLOTS[i].s,
                } as CSSProperties
              }
            >
              <span className="kbox-float">
                <span className="kbox-shape" style={{ "--mask": iconMask(icon) } as CSSProperties} />
              </span>
            </span>
          ))}
        </div>

        <div className="kbox-body">
          {mystery && <span className="kbox-q font-display">?</span>}
          <span className="kbox-tag">{label}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
