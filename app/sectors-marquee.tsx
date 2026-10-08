const AUDIENCE = [
  "Startups",
  "PMEs",
  "Agências",
  "Times de RH",
  "Marketing & eventos",
  "Produto & engenharia",
  "Varejo & PDV",
  "Arquitetura",
];

export function SectorsMarquee() {
  const row = [...AUDIENCE, ...AUDIENCE];
  return (
    <section aria-label="Para quem a gente cria" className="border-y border-line py-5">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="strip-marquee flex w-max gap-12 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
          {row.map((a, i) => (
            <span key={i} className="flex items-center gap-12">
              {a}
              <span className="h-1 w-1 rounded-full bg-muted/60" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
