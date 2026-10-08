"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { HeroScene } from "./hero-scene";
import { PIECES } from "./hero-pieces";
import { useTheme } from "./theme";

const INTERVAL = 5200;
const GLYPHS = "▪▫░▒▓/\\+*#<>=";

/** Troca o texto "metamorfoseando" letra por letra. */
function useMorphText(target: string, animate: boolean) {
  const [text, setText] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    prev.current = target;
    if (!animate) return;
    const start = performance.now();
    const dur = 750;
    const delays = Array.from(target, (_, i) => (i / target.length) * 0.55 + Math.random() * 0.2);
    let raf = 0;
    const tick = (now: number) => {
      const k = (now - start) / dur;
      if (k >= 1) {
        setText(target);
        return;
      }
      setText(
        Array.from(target, (ch, i) =>
          ch === " " || k > delays[i] + 0.25
            ? ch
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        ).join(""),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);

  return animate ? text : target;
}

export function HeroShowcase({ before, after }: { before: ReactNode; after: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // só ligado por prefers-reduced-motion
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const theme = useTheme();

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HeroScene | null>(null);
  const indexRef = useRef(0);

  const piece = PIECES[index];
  const name = useMorphText(piece.name, !reduced);
  const text = useMorphText(piece.text, !reduced);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(mq.matches);
      if (mq.matches) setPaused(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // cria a cena 3D (three.js é carregado só no cliente, sob demanda); uma por versão
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    setFailed(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const load = import("./hero-scene").then(({ createScene }) =>
      createScene(canvas, { reduced, initial: indexRef.current, theme }),
    );
    load
      .then((scene) => {
        if (disposed) scene.dispose();
        else sceneRef.current = scene;
      })
      .catch(() => setFailed(true));
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    indexRef.current = index;
    sceneRef.current?.setIndex(index);
  }, [index]);

  // só anima quando o hero está na tela e a aba está ativa
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => sceneRef.current?.setActive(visible && !document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [visible]);

  useEffect(() => {
    if (paused || !visible) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % PIECES.length), INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, visible]);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
      <div>
        {before}

        <div className="mt-8 border-l border-accent/60 pl-5">
          <span className="sr-only">{piece.name}. {piece.text}</span>
          <p
            aria-hidden
            className="min-h-[1.2em] font-display text-[clamp(1.9rem,3.4vw,3rem)] italic leading-[1.1] text-accent"
          >
            {name}
          </p>
          <p aria-hidden className="mt-3 min-h-[3.2rem] max-w-md text-[15px] leading-relaxed text-muted">
            {text}
          </p>
        </div>

        {after}
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto aspect-[1/1.05] w-full max-w-[640px] lg:max-w-none"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[8%] bottom-[8%] h-[22%] rounded-[50%] bg-accent/10 blur-3xl"
        />
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Animação 3D: objetos impressos se transformando uns nos outros"
          className={`absolute inset-0 h-full w-full ${failed ? "hidden" : ""}`}
        />
      </div>
    </div>
  );
}
