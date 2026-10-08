"use client";

import { useRef, useState, type FormEvent } from "react";

import { track } from "./analytics";

const field =
  "w-full rounded-xl border border-line-strong bg-bg px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-muted/60 focus:border-accent";
const label = "mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-muted";

export function BriefingForm() {
  const [sent, setSent] = useState(false);
  const started = useRef(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: conectar a um endpoint (e-mail/CRM). Por enquanto só confirma na tela.
    track("form_submit_briefing");
    track("generate_lead", { method: "briefing_form", source: "briefing_form" });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-line-strong bg-surface p-10 text-center">
        <p className="font-display text-4xl">Recebido.</p>
        <p className="mt-3 text-muted">
          Respondemos o seu briefing em até 1 dia útil, com ideias e uma estimativa.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocus={() => {
        if (started.current) return;
        started.current = true;
        track("form_start_briefing");
      }}
      className="grid gap-5 rounded-3xl border border-line-strong bg-surface p-6 md:grid-cols-2 md:p-10"
    >
      <div>
        <label className={label} htmlFor="nome">Nome</label>
        <input id="nome" name="nome" required className={field} placeholder="Seu nome" />
      </div>
      <div>
        <label className={label} htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" required className={field} placeholder="Nome da empresa" />
      </div>
      <div>
        <label className={label} htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required className={field} placeholder="voce@empresa.com" />
      </div>
      <div>
        <label className={label} htmlFor="whatsapp">WhatsApp</label>
        <input id="whatsapp" name="whatsapp" type="tel" className={field} placeholder="(11) 90000-0000" />
      </div>
      <div>
        <label className={label} htmlFor="tipo">Tipo de unboxing</label>
        <select id="tipo" name="tipo" className={field} defaultValue="">
          <option value="" disabled>Selecione</option>
          <option>Kit de boas-vindas</option>
          <option>Lançamento de produto</option>
          <option>Kit para influenciadores / imprensa</option>
          <option>Presente para clientes VIP</option>
          <option>Kit de evento</option>
          <option>Outro</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="qtd">Quantidade</label>
        <select id="qtd" name="qtd" className={field} defaultValue="">
          <option value="" disabled>Selecione</option>
          <option>1 a 10</option>
          <option>11 a 100</option>
          <option>101 a 1.000</option>
          <option>1.000 a 5.000</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className={label} htmlFor="prazo">Prazo desejado</label>
        <select id="prazo" name="prazo" className={field} defaultValue="">
          <option value="" disabled>Selecione</option>
          <option>Urgente (até 7 dias)</option>
          <option>2 a 3 semanas</option>
          <option>Mais de 1 mês</option>
          <option>Ainda sem data</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className={label} htmlFor="ideia">Conte a ideia</label>
        <textarea
          id="ideia"
          name="ideia"
          rows={5}
          className={field}
          placeholder="Quem vai abrir a caixa? O que você quer que sintam? Pode ser só um rascunho."
        />
      </div>
      <div className="flex flex-col items-start justify-between gap-4 md:col-span-2 md:flex-row md:items-center">
        <p className="text-[13px] text-muted">Sem compromisso. Resposta em até 1 dia útil.</p>
        <button
          type="submit"
          className="rounded-full bg-accent px-7 py-3.5 text-[15px] font-medium text-accent-ink transition hover:brightness-110"
        >
          Enviar briefing →
        </button>
      </div>
    </form>
  );
}
