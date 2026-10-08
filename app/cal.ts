export const CAL_NAMESPACE = "breafing";

// Espalhe em qualquer <button>/<a> para abrir o popup do Cal.com ao clicar.
export const calTrigger = {
  "data-cal-link": "camu-studio/breafing",
  "data-cal-namespace": CAL_NAMESPACE,
  "data-cal-config": JSON.stringify({
    layout: "month_view",
    useSlotsViewOnSmallScreen: "true",
  }),
} as const;
