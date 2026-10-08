import { BriefingForm } from "./briefing-form";
import { calTrigger } from "./cal";
import { Header } from "./header";
import { HeroShowcase } from "./hero-showcase";
import { KitBox } from "./kit-box";
import type { KitIcon } from "./kit-icons";
import { Logo } from "./logo";
import { NoiseSection } from "./noise-section";
import { NAV } from "./nav";
import { Reveal } from "./reveal";
import { SectorsMarquee } from "./sectors-marquee";
import { SurpriseKit } from "./surprise-kit";
import { WhyCamu } from "./why-camu";

const kits: { n: string; slug: string; tag: string; title: string; text: string; items: KitIcon[] }[] = [
  {
    n: "01",
    slug: "boas_vindas",
    tag: "Onboarding",
    title: "Kit de boas-vindas",
    text: "Kit de entrada que o novo cliente ou colaborador abre e fotografa: crachá, porta-objetos e peças com a sua marca.",
    items: ["cracha", "caneca", "chave"],
  },
  {
    n: "02",
    slug: "lancamento",
    tag: "Lançamento",
    title: "Lançamento de produto",
    text: "Caixa-conceito com miniatura do produto, objetos temáticos e um detalhe impossível de copiar.",
    items: ["foguete", "cubo", "estrela"],
  },
  {
    n: "03",
    slug: "creators",
    tag: "Creators",
    title: "Caixa para influenciadores",
    text: "Peças pensadas para virar conteúdo: o vídeo de unboxing já nasce no desenho do kit.",
    items: ["video", "coracao", "camera"],
  },
  {
    n: "04",
    slug: "vip",
    tag: "Edição numerada",
    title: "Presentes para clientes VIP",
    text: "Edição numerada, acabamento premium e personalização por pessoa. Nada de brinde genérico.",
    items: ["trofeu", "gema", "coroa"],
  },
  {
    n: "05",
    slug: "evento",
    tag: "Eventos",
    title: "Kits de evento",
    text: "Do credenciamento à lembrança para levar para casa: peças produzidas em escala, de 1 a 5.000 unidades.",
    items: ["ingresso", "medalha", "engrenagem"],
  },
];

const ideias = [
  {
    who: "Fintech",
    brief: "“Queremos celebrar o cliente nº 10.000.”",
    obj: "O gráfico real de crescimento da base, impresso como uma escultura de mesa. Cada cliente recebe o pico que ajudou a construir.",
  },
  {
    who: "SaaS B2B",
    brief: "“O kit de boas-vindas da nossa empresa é igual ao de todo mundo.”",
    obj: "Uma peça de encaixe com o nome de cada pessoa nova. Junta com as do time e forma o logo, literalmente fazer parte.",
  },
  {
    who: "Logística",
    brief: "“Precisamos de algo pros clientes na feira.”",
    obj: "Um caminhão em miniatura da frota que vira porta-cartões. Fica na mesa do comprador por anos.",
  },
  {
    who: "Hardware",
    brief: "“O molde custa R$ 80 mil. E se o encaixe estiver errado?”",
    obj: "Três versões da carcaça em uma semana, testadas na mão, antes de pagar pelo molde definitivo.",
  },
];

const steps = [
  { n: "01", title: "Briefing", time: "Dia 1", text: "Uma conversa de 15 minutos. Você conta o objetivo, o público, o prazo e o orçamento. Pode vir só com uma ideia solta." },
  { n: "02", title: "Conceito", time: "Até 3 dias úteis", text: "Voltamos com 2 a 3 direções criativas, imagens do resultado final e uma proposta fechada de preço e prazo." },
  { n: "03", title: "Desenho & amostra", time: "Até 5 dias úteis", text: "Desenhamos o objeto em 3D e imprimimos uma amostra física para você aprovar com a mão, não só na tela." },
  { n: "04", title: "Produção", time: "Conforme volume", text: "Fabricação de toda a quantidade no nosso parque de impressoras, com controle de qualidade peça a peça." },
  { n: "05", title: "Acabamento & entrega", time: "Todo o Brasil", text: "Lixamento, pintura, montagem, embalagem personalizada e envio para um endereço ou para cada destinatário." },
];

const faqs = [
  ["arquivo_3d", "Preciso ter o arquivo 3D?", "Não. Você pode mandar só a ideia, um rascunho ou referências. Se já tiver o arquivo 3D, ótimo, nós conferimos tudo antes de imprimir."],
  ["pedido_minimo", "Existe pedido mínimo?", "Não. Produzimos desde 1 unidade (um protótipo ou um presente especial) até 5.000 unidades por pedido."],
  ["prazo", "Qual o prazo de um kit de unboxing?", "Depende da complexidade e da quantidade. Depois do briefing já passamos um prazo realista para o seu projeto."],
  ["preco", "Como funciona o preço?", "Depende de quantidade, material e acabamento. Depois do briefing enviamos uma estimativa e, com o conceito aprovado, o orçamento fechado."],
  ["nota_fiscal", "Emitem nota fiscal?", "Sim, emitimos nota fiscal para pessoa jurídica em todos os pedidos."],
  ["entrega_brasil", "Entregam em todo o Brasil?", "Sim. Enviamos para um endereço único ou para vários destinatários, com a caixa já montada."],
];

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.18em] text-accent";
const h2 = "font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.02] tracking-[-0.02em]";
const section = "mx-auto max-w-[1320px] px-5 py-24 md:px-8 md:py-32";

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-24 h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]"
          />
          <div className="relative mx-auto max-w-[1320px] px-5 pb-24 pt-32 md:px-8 md:pb-32 md:pt-40">
            <HeroShowcase
              before={
                <>
                  <Reveal>
                    <p className={eyebrow}>Impressão 3D sob demanda · feito no Brasil</p>
                  </Reveal>
                  <Reveal delay={80}>
                    <h1 className="mt-6 font-display text-[clamp(2.8rem,5.6vw,5.6rem)] leading-[0.98] tracking-[-0.03em]">
                      Se dá pra imaginar,
                      <br />
                      <em className="text-accent">dá pra imprimir.</em>
                    </h1>
                  </Reveal>
                </>
              }
              after={
                <>
                  <Reveal delay={160}>
                    <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
                      A Camu Studio desenha e imprime em 3D os objetos que fazem seu cliente, time ou
                      parceiro parar, abrir devagar e mostrar para alguém. Da ideia à caixa montada.
                    </p>
                  </Reveal>
                  <Reveal delay={240}>
                    <div className="mt-10 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        {...calTrigger}
                        data-source="hero"
                        className="rounded-full bg-accent px-7 py-3.5 text-[15px] font-medium text-accent-ink transition hover:brightness-110"
                      >
                        Agendar briefing →
                      </button>
                      <a
                        href="#solucoes"
                        className="rounded-full border border-line-strong px-7 py-3.5 text-[15px] transition hover:border-fg"
                      >
                        Ver tipos de kit
                      </a>
                    </div>
                  </Reveal>
                </>
              }
            />
            <Reveal delay={320}>
              <dl className="mt-20 grid max-w-xl grid-cols-3 gap-8 border-t border-line pt-8">
                {[
                  ["1 → 5.000", "unidades por pedido"],
                  ["Modelagem", "inclusa no projeto"],
                  ["Brasil", "entrega em todo o país"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[15px] font-medium tracking-tight">{k}</dt>
                    <dd className="mt-1 text-[13px] leading-snug text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        <SectorsMarquee />

        <NoiseSection />

        {/* KITS */}
        <section id="solucoes" className={section}>
          <Reveal>
            <p className={eyebrow}>Kits</p>
            <h2 className={`mt-4 max-w-3xl ${h2}`}>
              Uma fábrica sob demanda para a <em>sua empresa.</em>
            </h2>
            <p className="mt-5 max-w-xl text-muted">
              Passe o mouse (ou toque) para abrir cada caixa. Nenhuma delas vem de catálogo.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {kits.map((k, i) => (
              <Reveal key={k.n} delay={(i % 3) * 80} className="bg-bg">
                <article tabIndex={0} data-hover={`kit_open_${k.slug}`} className="box-card h-full p-8 outline-none">
                  <div className="mt-6">
                    <KitBox items={k.items} label={k.tag} />
                  </div>
                  <h3 className="mt-8 font-display text-3xl">{k.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{k.text}</p>
                </article>
              </Reveal>
            ))}
            <Reveal delay={160} className="bg-bg">
              <SurpriseKit n="" />
            </Reveal>
          </div>
        </section>

        {/* IDEIAS */}
        <section id="ideias" className="border-y border-line">
          <div className={section}>
            <Reveal>
              <p className={eyebrow}>Ideias</p>
              <h2 className={`mt-4 max-w-3xl ${h2}`}>
                Do briefing ao <em>objeto.</em>
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-5 md:grid-cols-2">
              {ideias.map((idea, i) => (
                <Reveal key={idea.who} delay={(i % 2) * 100} className="h-full">
                  <article
                    data-hover={`idea_hover_${idea.who}`}
                    className="group relative h-full overflow-hidden rounded-2xl border border-line bg-bg p-8 md:p-10"
                  >
                    <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/0 blur-3xl transition duration-700 group-hover:bg-accent/15" />
                    <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                      <span>{idea.who}</span>
                    </div>
                    <p className="mt-10 font-display text-[clamp(26px,2.6vw,34px)] leading-tight text-muted italic">{idea.brief}</p>
                    <div className="my-7 flex items-center gap-3 text-accent">
                      <span className="h-px flex-1 bg-gradient-to-r from-accent/60 to-transparent" />
                      <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase">Camu</span>
                    </div>
                    <p className="text-[19px] leading-relaxed tracking-tight">{idea.obj}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* POR QUE A CAMU */}
        <WhyCamu eyebrow={eyebrow} h2={h2} />

        {/* PROCESSO */}
        <section id="processo" className={section}>
          <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal className="lg:sticky lg:top-32 lg:self-start">
              <p className={eyebrow}>Processo</p>
              <h2 className={`mt-4 ${h2}`}>
                Você aprova.
                <br />
                <em>A gente resolve.</em>
              </h2>
              <p className="mt-8 max-w-sm text-lg text-muted">
                Um gerente de projeto dedicado do primeiro e-mail até a caixa chegar. Sem você precisar entender nada de
                impressão 3D.
              </p>
            </Reveal>
            <ol className="relative">
              <span className="absolute top-2 bottom-2 left-[19px] w-px bg-gradient-to-b from-accent/70 via-line-strong to-transparent" />
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 60}>
                  <li className="relative grid grid-cols-[40px_1fr] gap-6 pb-14 last:pb-0">
                    <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-bg font-mono text-[12px] text-fg">
                      {s.n}
                    </span>
                    <div className="pt-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h3 className="font-display text-3xl">{s.title}</h3>
                        <span className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">{s.time}</span>
                      </div>
                      <p className="mt-3 max-w-xl leading-relaxed text-muted">{s.text}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${section} grid gap-12 lg:grid-cols-[1fr_1.5fr]`}>
          <Reveal>
            <p className={eyebrow}>FAQ</p>
            <h2 className={`mt-4 ${h2}`}>
              Perguntas <em>frequentes</em>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="divide-y divide-line border-y border-line">
              {faqs.map(([key, q, a]) => (
                <details key={key} data-faq={key} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="text-2xl text-accent transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 max-w-2xl leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <Logo size="lg" />
            <p className="mt-4 text-muted">
              Sua <strong className="font-semibold text-accent [[data-theme=light]_&]:text-[#8f3f26]">marca</strong> merece mais que uma entrega.
              <span className="block">
                Merece uma <strong className="font-semibold text-accent [[data-theme=light]_&]:text-[#8f3f26]">experiência</strong>.
              </span>
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[14px] text-muted">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="transition hover:text-fg">{n.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <p className="border-t border-line px-5 py-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          © 2026 Camu Studio
        </p>
      </footer>
    </>
  );
}
