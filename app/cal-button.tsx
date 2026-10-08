"use client";

import { useEffect } from "react";

import { CAL_NAMESPACE as NAMESPACE } from "./cal";
import { useTheme } from "./theme";

type CalFn = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns?: Record<string, (...args: unknown[]) => void>;
  q?: unknown[];
  config?: Record<string, unknown>;
};

function bootstrapCal(): CalFn {
  const w = window as unknown as { Cal?: CalFn };
  if (w.Cal) return w.Cal;

  const queue = (api: { q?: unknown[] }, args: unknown) => {
    (api.q ??= []).push(args);
  };

  const cal: CalFn = function (...args: unknown[]) {
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const s = document.createElement("script");
      s.src = "https://app.cal.com/embed/embed.js";
      document.head.appendChild(s);
      cal.loaded = true;
    }
    if (args[0] === "init") {
      const api: CalFn = function (...a: unknown[]) {
        queue(api, a);
      };
      const namespace = args[1];
      if (typeof namespace === "string") {
        cal.ns![namespace] = cal.ns![namespace] || api;
        queue(cal.ns![namespace] as CalFn, args);
        queue(cal, ["initNamespace", namespace]);
      } else queue(cal, args);
      return;
    }
    queue(cal, args);
  };

  w.Cal = cal;
  return cal;
}

export function CalButton() {
  const theme = useTheme();
  useEffect(() => {
    const w = window as unknown as { Cal?: CalFn };
    if (w.Cal?.ns?.[NAMESPACE]) return; // já inicializado (StrictMode / navegação)

    const Cal = bootstrapCal();
    Cal("init", NAMESPACE, { origin: "https://app.cal.com" });
    Cal.config = Cal.config || {};
    Cal.config.forwardQueryParams = true;
  }, []);

  // tema do modal do Cal acompanha o do site
  useEffect(() => {
    const w = window as unknown as { Cal?: CalFn };
    const ns = w.Cal?.ns?.[NAMESPACE];
    ns?.("ui", {
      theme,
      hideEventTypeDetails: false,
      layout: "month_view",
      cssVarsPerTheme: {
        light: { "cal-brand": "#ce6a4b" },
        dark: { "cal-brand": "#2f9e8e" },
      },
    });
  }, [theme]);

  return null;
}
