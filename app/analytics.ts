"use client";

import type { Analytics } from "firebase/analytics";

// Firebase Analytics (GA4). Só inicializa no browser e se as variáveis NEXT_PUBLIC_FIREBASE_* existirem.
// O SDK é carregado sob demanda; eventos disparados antes disso esperam a promise resolver.

type Params = Record<string, string | number | boolean>;

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let ready: Promise<Analytics | null> | null = null;

function load(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !config.apiKey || !config.appId || !config.measurementId) {
    return Promise.resolve(null);
  }
  ready ??= (async () => {
    try {
      const [{ getApp, getApps, initializeApp }, { getAnalytics, isSupported }] = await Promise.all([
        import("firebase/app"),
        import("firebase/analytics"),
      ]);
      if (!(await isSupported())) return null;
      const app = getApps().length ? getApp() : initializeApp(config);
      return getAnalytics(app);
    } catch {
      return null;
    }
  })();
  return ready;
}

/** Inicia o SDK (coleta o page_view automático). Seguro chamar mais de uma vez. */
export function initAnalytics() {
  void load();
}

export function track(event: string, params: Params = {}) {
  void load().then(async (analytics) => {
    if (!analytics) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, event, params);
  });
}
